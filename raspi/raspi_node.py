import time
import json
import threading
import requests
import io
import cv2
# from ultralytics import YOLO  # Uncomment and install ultralytics for YOLO support

# --- Konfigurasi Supabase ---
SUPABASE_URL = "https://brfuwgkkvsnbpmssfbwx.supabase.co/rest/v1/pest_detections" # Sesuaikan nama tabel jika perlu
SUPABASE_KEY = "sb_publishable_276gBvf7bSuE8QW72fQr2w_Matt6CpN" # Ambil dari .env frontend
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}
TRANSFER_INTERVAL = 15 # Transfer data 15s

class SystemState:
    def __init__(self):
        self.emergency_stop = False
        self.rcwl_status = [True, True, True]  # Misalnya ada 3 sensor RCWL
        self.motion_count = 0
        self.camera_status = True
        self.relay_status = False

state = SystemState()
# model = YOLO('yolov8n.pt') # Load model YOLO

def check_rcwl_sensors():
    # rcwl satu jalur satu mati mati semua
    if not all(state.rcwl_status):
        return False
    return True

def capture_and_compress():
    try:
        if not state.camera_status or state.emergency_stop:
            return None
            
        # Mock Camera Capture
        # cap = cv2.VideoCapture(0)
        # ret, frame = cap.read()
        # cap.release()
        
        # Mock frame
        frame = cv2.imread('dummy.jpg')
        if frame is None:
            return None
            
        # Kompresi (capture gambar)
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 50]
        result, encimg = cv2.imencode('.jpg', frame, encode_param)
        return encimg
    except Exception as e:
        state.camera_status = False
        return None

def yolo_detection(image):
    # foto detection (yolo)
    if image is None: return []
    # results = model(image)
    # return results.pandas().xyxy[0].to_dict(orient="records")
    return [{"name": "pest", "confidence": 0.85}] # Mock detection

def sensor_loop():
    while True:
        if state.emergency_stop:
            state.relay_status = False
            time.sleep(1)
            continue
            
        # raspi, sistem tetap jalan walau sensor mati
        try:
            # Mock membaca sensor RCWL
            # Jika semua rcwl hidup, lakukan counting
            if check_rcwl_sensors():
                # sensor gerak counting
                # mock mendeteksi gerakan
                motion_detected = True
                if motion_detected:
                    state.motion_count += 1
        except Exception as e:
            # Jika error baca sensor, anggap mati
            state.rcwl_status[0] = False
            
        time.sleep(1)

def main_loop():
    while True:
        time.sleep(TRANSFER_INTERVAL)
        
        payload = {
            "emergency_stop": state.emergency_stop,
            "motion_count": state.motion_count,
            "rcwl_healthy": check_rcwl_sensors(), # kirim data sensornya mati
            "rcwl_details": state.rcwl_status,
            "camera_healthy": state.camera_status,
            "relay_status": state.relay_status,
            "detections": []
        }
        
        if not state.emergency_stop and check_rcwl_sensors() and state.camera_status:
            img = capture_and_compress()
            if img is not None:
                # validasi kamera dengan yolo
                detections = yolo_detection(img)
                payload["detections"] = detections
        
        # Transfer data 15s ke Supabase
        try:
            # requests.post(SUPABASE_URL, headers=HEADERS, json=payload, timeout=5)
            print(f"Data transferred to Supabase: {json.dumps(payload)}")
        except Exception as e:
            print(f"Failed to transfer data: {e}")

if __name__ == "__main__":
    sensor_thread = threading.Thread(target=sensor_loop, daemon=True)
    sensor_thread.start()
    
    print("Raspi Node Started...")
    try:
        main_loop()
    except KeyboardInterrupt:
        print("Shutting down...")
