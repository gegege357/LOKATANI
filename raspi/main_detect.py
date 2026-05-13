"""
=============================================================
  Lokatani Guard — Production Script [v5]
  + Remote control via Supabase (emergency stop, camera,
    RCWL, relay on/off)
=============================================================
  Tabel Supabase yang dibutuhkan:
    pest_detection  — data deteksi & heartbeat
    device_commands — perintah dari web dashboard

  Command yang didukung:
    emergency_stop | camera_on | camera_off
    rcwl_on | rcwl_off | relay_on | relay_off

  Jalankan:
    python3 main_detect.py --model model.tflite --labels labels.txt
    python3 main_detect.py --mode yolo --model best.pt
    python3 main_detect.py --mode simulate   ← test tanpa model/kamera
=============================================================
"""

import argparse
import datetime
import json
import logging
import os
import sys
import threading
import time
from enum import Enum, auto

import cv2
import numpy as np
import requests

# ── TFLite via TensorFlow ──
def _get_tflite_interpreter():
    try:
        import tensorflow as tf
        return tf.lite.Interpreter
    except ImportError:
        raise ImportError("Jalankan: pip install tensorflow")

# ── GPIO ──
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False
    print("[WARN] RPi.GPIO tidak tersedia — simulasi GPIO aktif")

# ─────────────────────────────────────────────
#  KONFIGURASI
# ─────────────────────────────────────────────
SUPABASE_URL      = "https://brfuwgkkvsnbpmssfbwx.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZnV3Z2trdnNuYnBtc3NmYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzM2NjEsImV4cCI6MjA5MDI0OTY2MX0"
    ".6yJMN6ccyuqUVuYXAa-ee0G7AdxR7DzeckqhvUXUMoQ"
)
SUPABASE_TABLE    = "pest_detection"
COMMAND_TABLE     = "device_commands"
STORAGE_BUCKET    = "pest-images"

PIN_RCWL_1 = 17
PIN_RCWL_2 = 22
PIN_RELAY  = 27

CONFIDENCE_THRESHOLD  = 0.60
ACTIVE_WINDOW_SEC     = 30
SPRAY_DURATION_SEC    = 10
RCWL_POLL_INTERVAL    = 1.0
CNN_FRAME_INTERVAL    = 0.5
HEARTBEAT_INTERVAL    = 15    # detik
COMMAND_POLL_INTERVAL = 3     # cek command baru setiap N detik

CAPTURE_WIDTH        = 1280
CAPTURE_HEIGHT       = 720
CAMERA_WARMUP_FRAMES = 10

MODEL_VERSION   = "v1.2"
CAMERA_LOCATION = "main_zone"
RPI_HOSTNAME    = os.uname().nodename if hasattr(os, "uname") else "rpi-hydro-01"

# ─────────────────────────────────────────────
#  STATE
# ─────────────────────────────────────────────
class State(Enum):
    IDLE      = auto()
    ACTIVE    = auto()
    SPRAYING  = auto()
    EMERGENCY = auto()   # sistem berhenti, tunggu restart manual

# ─────────────────────────────────────────────
#  SHARED SYSTEM STATUS
# ─────────────────────────────────────────────
class SystemStatus:
    def __init__(self):
        self._lock          = threading.Lock()
        self.state          = State.IDLE
        self.camera_status  = False
        self.rcwl_status    = False
        self.relay_status   = False
        # Override manual dari web (None = ikut state machine)
        self.camera_override = None   # True / False / None
        self.rcwl_override   = None
        self.relay_override  = None
        self.emergency       = False
        # Data deteksi terakhir
        self.pest_type      = None
        self.confidence     = 0.0
        self.count          = 0
        self.spray_status   = False
        self.image_url      = ""

    def update(self, **kwargs):
        with self._lock:
            for k, v in kwargs.items():
                setattr(self, k, v)

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "state":           self.state.name,
                "camera_status":   self.camera_status,
                "rcwl_status":     self.rcwl_status,
                "relay_status":    self.relay_status,
                "camera_override": self.camera_override,
                "rcwl_override":   self.rcwl_override,
                "relay_override":  self.relay_override,
                "emergency":       self.emergency,
                "pest_type":       self.pest_type,
                "confidence":      self.confidence,
                "count":           self.count,
                "spray_status":    self.spray_status,
                "image_url":       self.image_url,
            }

STATUS = SystemStatus()

# ─────────────────────────────────────────────
#  LOGGING
# ─────────────────────────────────────────────
_LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lokatani_guard.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(_LOG_FILE),
    ],
)
log = logging.getLogger("LokataniGuard")


# ─────────────────────────────────────────────
#  GPIO
# ─────────────────────────────────────────────
def gpio_setup():
    if not GPIO_AVAILABLE:
        return
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(PIN_RCWL_1, GPIO.IN)
    GPIO.setup(PIN_RCWL_2, GPIO.IN)
    GPIO.setup(PIN_RELAY,  GPIO.OUT, initial=GPIO.LOW)
    log.info("GPIO initialized")

def gpio_cleanup():
    if GPIO_AVAILABLE:
        GPIO.output(PIN_RELAY, GPIO.LOW)
        GPIO.cleanup()

def read_rcwl() -> bool:
    if not GPIO_AVAILABLE:
        return True
    return bool(GPIO.input(PIN_RCWL_1) or GPIO.input(PIN_RCWL_2))

def relay_on():
    if GPIO_AVAILABLE:
        GPIO.output(PIN_RELAY, GPIO.HIGH)
    STATUS.update(relay_status=True)
    log.info("Relay ON")

def relay_off():
    if GPIO_AVAILABLE:
        GPIO.output(PIN_RELAY, GPIO.LOW)
    STATUS.update(relay_status=False)
    log.info("Relay OFF")


# ─────────────────────────────────────────────
#  SUPABASE — helpers
# ─────────────────────────────────────────────
def _headers_rest() -> dict:
    return {
        "apikey":        SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type":  "application/json",
    }

def upload_image(frame: np.ndarray, filename: str) -> str:
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type":  "image/jpeg",
    }
    try:
        r = requests.post(url, headers=headers,
                          data=buf.tobytes(), timeout=10)
        if r.status_code in (200, 201):
            return (f"{SUPABASE_URL}/storage/v1/object/public/"
                    f"{STORAGE_BUCKET}/{filename}")
        log.warning("Upload gagal [%d]: %s", r.status_code, r.text)
    except Exception as e:
        log.error("Upload error: %s", e)
    return ""

def send_to_supabase(payload: dict):
    url = f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}"
    headers = {**_headers_rest(), "Prefer": "return=minimal"}
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=10)
        if r.status_code in (200, 201):
            log.info("[Supabase] Terkirim | type=%s",
                     payload.get("record_type", "?"))
            return
        log.warning("[Supabase] Gagal [%d]: %s", r.status_code, r.text)
    except Exception as e:
        log.error("[Supabase] Error: %s", e)

def build_payload(record_type: str, snap: dict,
                  image_url: str = "") -> dict:
    ts = datetime.datetime.utcnow()
    return {
        "timestamp":          ts.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "record_type":        record_type,
        "camera_status":      snap["camera_status"],
        "rcwl_status":        snap["rcwl_status"],
        "relay_status":       snap["relay_status"],
        "system_state":       snap["state"],
        "emergency":          snap["emergency"],
        "pest_type":          snap["pest_type"],
        "count":              snap["count"],
        "confidence":         round(snap["confidence"], 4),
        "spray_status":       snap["spray_status"],
        "spray_duration_sec": SPRAY_DURATION_SEC if snap["spray_status"] else 0,
        "image_url":          image_url or snap["image_url"],
        "camera_location":    CAMERA_LOCATION,
        "model_version":      MODEL_VERSION,
        "rpi_hostname":       RPI_HOSTNAME,
        "rcwl_validated":     snap["rcwl_status"],
    }


# ─────────────────────────────────────────────
#  COMMAND POLLING — cek perintah dari web
# ─────────────────────────────────────────────
def fetch_pending_commands() -> list:
    """
    Ambil semua command dengan status 'pending' dari Supabase,
    diurutkan dari yang terlama.
    """
    url = (f"{SUPABASE_URL}/rest/v1/{COMMAND_TABLE}"
           f"?status=eq.pending&order=created_at.asc")
    try:
        r = requests.get(url, headers=_headers_rest(), timeout=8)
        if r.status_code == 200:
            return r.json()
        log.warning("[CMD] Fetch gagal [%d]", r.status_code)
    except Exception as e:
        log.error("[CMD] Fetch error: %s", e)
    return []

def mark_command(cmd_id: str, status: str):
    """Update status command: 'executed' atau 'rejected'."""
    url = (f"{SUPABASE_URL}/rest/v1/{COMMAND_TABLE}"
           f"?id=eq.{cmd_id}")
    ts  = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    body = {"status": status, "executed_at": ts}
    try:
        r = requests.patch(url, headers=_headers_rest(),
                           json=body, timeout=8)
        if r.status_code in (200, 204):
            log.info("[CMD] %s → %s", cmd_id[:8], status)
        else:
            log.warning("[CMD] Mark gagal [%d]", r.status_code)
    except Exception as e:
        log.error("[CMD] Mark error: %s", e)

def execute_command(cmd: dict, stop_main: threading.Event,
                    cap_ref: list):
    """
    Eksekusi satu command.
    cap_ref: list berisi [cap] atau [None] — mutable reference ke
             VideoCapture aktif agar bisa ditutup dari luar.
    """
    command = cmd.get("command", "").strip().lower()
    cmd_id  = cmd.get("id", "")
    log.info("[CMD] Eksekusi: %s", command)

    # ── Emergency stop ──────────────────────────
    if command == "emergency_stop":
        log.warning("[CMD] EMERGENCY STOP diterima!")
        STATUS.update(emergency=True, state=State.EMERGENCY)
        relay_off()
        # Tutup kamera jika sedang aktif
        if cap_ref[0] and cap_ref[0].isOpened():
            cap_ref[0].release()
            cap_ref[0] = None
            STATUS.update(camera_status=False)
        # Sinyal main loop untuk berhenti
        stop_main.set()
        mark_command(cmd_id, "executed")
        # Kirim heartbeat emergency
        snap = STATUS.snapshot()
        send_to_supabase(build_payload("emergency", snap))

    # ── Kamera ──────────────────────────────────
    elif command == "camera_on":
        STATUS.update(camera_override=True)
        mark_command(cmd_id, "executed")
        log.info("[CMD] Camera override → ON")

    elif command == "camera_off":
        STATUS.update(camera_override=False)
        if cap_ref[0] and cap_ref[0].isOpened():
            cap_ref[0].release()
            STATUS.update(camera_status=False)
        mark_command(cmd_id, "executed")
        log.info("[CMD] Camera override → OFF")

    # ── RCWL ────────────────────────────────────
    elif command == "rcwl_on":
        STATUS.update(rcwl_override=True)
        mark_command(cmd_id, "executed")
        log.info("[CMD] RCWL override → ON")

    elif command == "rcwl_off":
        STATUS.update(rcwl_override=False)
        mark_command(cmd_id, "executed")
        log.info("[CMD] RCWL override → OFF")

    # ── Relay / Pompa ────────────────────────────
    elif command == "relay_on":
        relay_on()
        STATUS.update(relay_override=True)
        mark_command(cmd_id, "executed")
        log.info("[CMD] Relay override → ON")

    elif command == "relay_off":
        relay_off()
        STATUS.update(relay_override=False)
        mark_command(cmd_id, "executed")
        log.info("[CMD] Relay override → OFF")

    else:
        log.warning("[CMD] Command tidak dikenal: %s", command)
        mark_command(cmd_id, "rejected")


# ─────────────────────────────────────────────
#  COMMAND POLLING THREAD
# ─────────────────────────────────────────────
def command_worker(stop_event: threading.Event,
                   stop_main: threading.Event,
                   cap_ref: list):
    log.info("[CMD] Thread dimulai, interval=%ds", COMMAND_POLL_INTERVAL)
    while not stop_event.is_set():
        cmds = fetch_pending_commands()
        for cmd in cmds:
            if stop_event.is_set():
                break
            execute_command(cmd, stop_main, cap_ref)
        for _ in range(COMMAND_POLL_INTERVAL):
            if stop_event.is_set():
                break
            time.sleep(1)
    log.info("[CMD] Thread berhenti")


# ─────────────────────────────────────────────
#  HEARTBEAT THREAD
# ─────────────────────────────────────────────
def heartbeat_worker(stop_event: threading.Event):
    log.info("[HB] Thread dimulai, interval=%ds", HEARTBEAT_INTERVAL)
    while not stop_event.is_set():
        snap    = STATUS.snapshot()
        payload = build_payload("heartbeat", snap)
        log.info("[HB] cam=%s rcwl=%s relay=%s state=%s emergency=%s",
                 snap["camera_status"], snap["rcwl_status"],
                 snap["relay_status"],  snap["state"],
                 snap["emergency"])
        send_to_supabase(payload)
        for _ in range(HEARTBEAT_INTERVAL):
            if stop_event.is_set():
                break
            time.sleep(1)
    log.info("[HB] Thread berhenti")


# ─────────────────────────────────────────────
#  MODEL
# ─────────────────────────────────────────────
def load_tflite(model_path: str):
    Interpreter = _get_tflite_interpreter()
    interp = Interpreter(model_path=model_path)
    interp.allocate_tensors()
    in_det  = interp.get_input_details()
    out_det = interp.get_output_details()
    shape   = in_det[0]["shape"]
    h, w    = int(shape[1]), int(shape[2])
    log.info("TFLite loaded: %s | input=%dx%d", model_path, w, h)
    return interp, in_det, out_det, w, h

def load_labels(path: str) -> list:
    with open(path) as f:
        labels = [l.strip() for l in f if l.strip()]
    log.info("Labels: %s", labels)
    return labels

def preprocess_tflite(frame, w, h):
    img = cv2.resize(frame, (w, h))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    return np.expand_dims(img, axis=0)

def infer_tflite(interp, in_det, out_det, tensor):
    interp.set_tensor(in_det[0]["index"], tensor)
    interp.invoke()
    output = interp.get_tensor(out_det[0]["index"])[0]
    idx    = int(np.argmax(output))
    return idx, float(output[idx])

def load_yolo(model_path: str):
    try:
        from ultralytics import YOLO
        return YOLO(model_path)
    except ImportError:
        raise ImportError("Jalankan: pip install ultralytics")

def infer_yolo(model, frame):
    results    = model(frame, conf=CONFIDENCE_THRESHOLD, verbose=False)
    result     = results[0]
    names      = model.names
    detections = [
        {
            "label": names.get(int(b.cls[0]), "unknown"),
            "conf":  round(float(b.conf[0]), 4),
            "box":   [round(v) for v in b.xyxy[0].tolist()],
        }
        for b in result.boxes
    ]
    annotated = result.plot()
    if not detections:
        return "no_pest", 0.0, 0, annotated
    best = max(detections, key=lambda d: d["conf"])
    return best["label"], best["conf"], len(detections), annotated


# ─────────────────────────────────────────────
#  KAMERA
# ─────────────────────────────────────────────
def open_camera(index: int) -> cv2.VideoCapture:
    cap = cv2.VideoCapture(index)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  CAPTURE_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAPTURE_HEIGHT)
    cap.set(cv2.CAP_PROP_AUTO_WB, 0)
    cap.set(cv2.CAP_PROP_WB_TEMPERATURE, 4500)
    cap.set(cv2.CAP_PROP_AUTOFOCUS, 0)
    if not cap.isOpened():
        raise RuntimeError(f"Kamera index {index} tidak bisa dibuka")
    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    log.info("Kamera dibuka | %dx%d", actual_w, actual_h)
    for _ in range(CAMERA_WARMUP_FRAMES):
        cap.read()
    return cap

def close_camera(cap):
    if cap and cap.isOpened():
        cap.release()
        log.info("Kamera ditutup")


# ─────────────────────────────────────────────
#  PHASE: ACTIVE
# ─────────────────────────────────────────────
def run_active_phase(cap, mode, model_ctx, labels, cap_ref, stop_main):
    deadline    = time.time() + ACTIVE_WINDOW_SEC
    best_result = None
    log.info(">>> ACTIVE window=%ds", ACTIVE_WINDOW_SEC)

    while time.time() < deadline:
        # Cek emergency / override kamera off
        if stop_main.is_set():
            return None
        snap = STATUS.snapshot()
        if snap["camera_override"] is False:
            log.info("  Kamera di-off via command — keluar ACTIVE")
            return None

        ret, frame = cap.read()
        if not ret:
            time.sleep(0.2)
            continue

        if mode == "tflite":
            interp, in_det, out_det, mw, mh = model_ctx
            tensor    = preprocess_tflite(frame, mw, mh)
            idx, conf = infer_tflite(interp, in_det, out_det, tensor)
            pest_type = labels[idx] if idx < len(labels) else "unknown"
            count     = 3 if conf >= 0.90 else 2 if conf >= 0.75 else 1
            annotated = frame.copy()
            cv2.putText(annotated, f"{pest_type} {conf*100:.1f}%",
                        (10, 35), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        else:
            pest_type, conf, count, annotated = infer_yolo(model_ctx, frame)

        sisa = deadline - time.time()
        log.info("  CNN: %-14s %.1f%% | sisa=%.0fs", pest_type, conf*100, sisa)
        STATUS.update(pest_type=pest_type, confidence=conf, count=count)

        if pest_type.lower() != "no_pest" and conf >= CONFIDENCE_THRESHOLD:
            if best_result is None or conf > best_result[1]:
                best_result = (pest_type, conf, count, annotated)
            return best_result

        time.sleep(CNN_FRAME_INTERVAL)

    log.info(">>> ACTIVE timeout")
    return None


# ─────────────────────────────────────────────
#  PHASE: SPRAYING
# ─────────────────────────────────────────────
def run_spray_phase(pest_type, conf, count, frame):
    log.info(">>> SPRAYING %ds", SPRAY_DURATION_SEC)

    # Cek relay override — kalau di-off dari web, jangan nyalakan
    snap = STATUS.snapshot()
    if snap["relay_override"] is False:
        log.warning("  Relay di-off via command — spray dibatalkan")
        return

    relay_on()
    STATUS.update(spray_status=True)

    # Tunggu durasi spray, tapi cek override setiap detik
    for _ in range(SPRAY_DURATION_SEC):
        time.sleep(1)
        if STATUS.snapshot()["relay_override"] is False:
            log.info("  Relay dimatikan via command saat spray")
            break

    relay_off()
    STATUS.update(spray_status=False)
    log.info(">>> SPRAYING selesai")

    ts        = datetime.datetime.utcnow()
    filename  = f"{ts.strftime('%Y%m%d_%H%M%S')}_{pest_type}.jpg"
    image_url = upload_image(frame, filename)
    STATUS.update(image_url=image_url)

    snap    = STATUS.snapshot()
    payload = build_payload("detection", snap, image_url=image_url)
    send_to_supabase(payload)
    STATUS.update(pest_type=None, confidence=0.0,
                  count=0, image_url="")


# ─────────────────────────────────────────────
#  SIMULATE MODE — test koneksi Supabase tanpa hardware
# ─────────────────────────────────────────────
import random

SIM_PESTS   = ["Ulat", "Belalang"]
SIM_CYCLE   = 20   # detik antara tiap simulasi deteksi

def simulate_loop(stop_main: threading.Event):
    """
    Kirim heartbeat setiap HEARTBEAT_INTERVAL detik.
    Setiap SIM_CYCLE detik simulasi satu siklus deteksi → spray.
    Berguna untuk test koneksi & tampilan dashboard tanpa hardware.
    """
    log.info("=== SIMULATE MODE — tidak ada model/kamera yang dibutuhkan ===")
    cycle = 0
    while not stop_main.is_set():
        cycle += 1
        # Setiap 2 siklus, simulasi deteksi + spray
        if cycle % 2 == 0:
            pest  = random.choice(SIM_PESTS)
            conf  = round(random.uniform(0.61, 0.98), 4)
            count = random.randint(1, 4)
            log.info("[SIM] Deteksi: %s %.0f%% count=%d", pest, conf*100, count)

            # ACTIVE phase
            STATUS.update(state=State.ACTIVE, camera_status=True,
                          rcwl_status=True, pest_type=pest,
                          confidence=conf, count=count)
            time.sleep(2)

            # SPRAYING phase
            STATUS.update(state=State.SPRAYING, camera_status=False,
                          relay_status=True, spray_status=True)
            snap    = STATUS.snapshot()
            payload = build_payload("detection", snap)
            payload["pest_type"]  = pest
            payload["confidence"] = conf
            payload["count"]      = count
            send_to_supabase(payload)
            log.info("[SIM] Detection payload terkirim")
            time.sleep(3)

            # Kembali IDLE
            STATUS.update(state=State.IDLE, camera_status=False,
                          relay_status=False, spray_status=False,
                          pest_type=None, confidence=0.0, count=0)
        else:
            STATUS.update(state=State.IDLE, camera_status=False,
                          rcwl_status=True, relay_status=False)
            log.info("[SIM] IDLE — menunggu gerakan...")

        for _ in range(SIM_CYCLE):
            if stop_main.is_set():
                break
            time.sleep(1)


# ─────────────────────────────────────────────
#  MAIN LOOP
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Lokatani Guard v5")
    parser.add_argument("--mode",         default="tflite",
                        choices=["tflite", "yolo", "simulate"])
    parser.add_argument("--model",        default="model.tflite")
    parser.add_argument("--labels",       default="labels.txt")
    parser.add_argument("--camera-index", type=int, default=0)
    args = parser.parse_args()

    gpio_setup()

    if args.mode == "simulate":
        # ── Simulate mode: tidak perlu model/kamera ──────────────
        cap_ref    = [None]
        stop_event = threading.Event()
        stop_main  = threading.Event()

        hb_thread = threading.Thread(
            target=heartbeat_worker, args=(stop_event,),
            daemon=True, name="Heartbeat")
        cmd_thread = threading.Thread(
            target=command_worker, args=(stop_event, stop_main, cap_ref),
            daemon=True, name="CommandPoll")
        hb_thread.start()
        cmd_thread.start()

        try:
            simulate_loop(stop_main)
        except KeyboardInterrupt:
            log.info("Dihentikan oleh pengguna.")
        finally:
            stop_event.set()
            hb_thread.join(timeout=5)
            cmd_thread.join(timeout=5)
            relay_off()
            gpio_cleanup()
            log.info("=== Simulate mode dimatikan ===")
        return

    if args.mode == "tflite":
        labels    = load_labels(args.labels)
        model_ctx = load_tflite(args.model)
    else:
        labels    = []
        model_ctx = load_yolo(args.model)

    # cap_ref: mutable reference agar command thread bisa tutup kamera
    cap_ref   = [None]
    stop_event = threading.Event()   # stop semua thread
    stop_main  = threading.Event()   # stop main loop (emergency)

    # Mulai threads
    hb_thread = threading.Thread(
        target=heartbeat_worker, args=(stop_event,),
        daemon=True, name="Heartbeat")
    cmd_thread = threading.Thread(
        target=command_worker, args=(stop_event, stop_main, cap_ref),
        daemon=True, name="CommandPoll")
    hb_thread.start()
    cmd_thread.start()

    state  = State.IDLE
    result = None
    log.info("=== Lokatani Guard v5 | host=%s | mode=%s ===",
             RPI_HOSTNAME, args.mode)

    try:
        while not stop_main.is_set():
            snap = STATUS.snapshot()

            # ══ EMERGENCY ══
            if snap["emergency"]:
                log.warning("=== EMERGENCY STATE — sistem berhenti ===")
                relay_off()
                break

            # ══ IDLE ══
            if state == State.IDLE:
                STATUS.update(state=State.IDLE,
                              camera_status=False, rcwl_status=True)

                # Cek override RCWL dari web
                if snap["rcwl_override"] is False:
                    log.debug("[IDLE] RCWL di-off via command, skip polling")
                    time.sleep(RCWL_POLL_INTERVAL)
                    continue

                motion = read_rcwl()
                if not motion:
                    time.sleep(RCWL_POLL_INTERVAL)
                    continue

                log.info(">>> RCWL trigger → ACTIVE")
                state = State.ACTIVE

            # ══ ACTIVE ══
            elif state == State.ACTIVE:
                # Cek override kamera dari web
                if STATUS.snapshot()["camera_override"] is False:
                    log.info("Kamera di-off via command — kembali IDLE")
                    state = State.IDLE
                    continue

                STATUS.update(state=State.ACTIVE,
                              camera_status=True, rcwl_status=False)
                cap = open_camera(args.camera_index)
                cap_ref[0] = cap
                try:
                    result = run_active_phase(
                        cap, args.mode, model_ctx, labels,
                        cap_ref, stop_main)
                finally:
                    close_camera(cap)
                    cap_ref[0] = None
                    STATUS.update(camera_status=False)

                if result is None:
                    state = State.IDLE
                else:
                    state = State.SPRAYING

            # ══ SPRAYING ══
            elif state == State.SPRAYING:
                STATUS.update(state=State.SPRAYING,
                              camera_status=False,
                              rcwl_status=False,
                              spray_status=True)
                pest_type, conf, count, frame = result
                run_spray_phase(pest_type, conf, count, frame)
                log.info(">>> Kembali ke IDLE")
                state  = State.IDLE
                result = None

    except KeyboardInterrupt:
        log.info("Dihentikan oleh pengguna.")
    finally:
        stop_event.set()
        hb_thread.join(timeout=5)
        cmd_thread.join(timeout=5)
        relay_off()
        if cap_ref[0]:
            close_camera(cap_ref[0])
        gpio_cleanup()
        log.info("=== Sistem dimatikan ===")


if __name__ == "__main__":
    main()
