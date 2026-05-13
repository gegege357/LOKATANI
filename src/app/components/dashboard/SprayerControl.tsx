import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets, Play, Square, Clock, Zap, Settings2, Shield,
  Loader2, Camera, Radio, Power,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { sendDeviceCommand, fetchLatestHeartbeat } from "../../../lib/deviceCommands";
import { supabase } from "../../../lib/supabase";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

interface DeviceState {
  camera_status: boolean;
  rcwl_status: boolean;
  relay_status: boolean;
  system_state: string;
  emergency: boolean;
  last_seen: string | null;
}

const DEFAULT_STATE: DeviceState = {
  camera_status: false,
  rcwl_status: false,
  relay_status: false,
  system_state: "IDLE",
  emergency: false,
  last_seen: null,
};

export function SprayerControl() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isAdmin = user?.role === "admin";

  const [deviceState, setDeviceState] = useState<DeviceState>(DEFAULT_STATE);
  const [loadingCmd, setLoadingCmd] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<string>("—");

  // ── Load initial heartbeat & subscribe to realtime ──────────
  useEffect(() => {
    const loadHeartbeat = async () => {
      const hb = await fetchLatestHeartbeat();
      if (hb) applyHeartbeat(hb);
    };
    loadHeartbeat();

    const channel = supabase
      .channel("sprayer_control_hb")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pest_detection" },
        (payload) => {
          const row = payload.new as any;
          if (row.record_type === "heartbeat" || row.record_type === "detection") {
            applyHeartbeat(row);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const applyHeartbeat = (row: any) => {
    setDeviceState({
      camera_status: row.camera_status ?? false,
      rcwl_status:   row.rcwl_status ?? false,
      relay_status:  row.relay_status ?? false,
      system_state:  row.system_state ?? "IDLE",
      emergency:     row.emergency ?? false,
      last_seen:     row.timestamp ?? null,
    });

    const d = new Date(row.timestamp);
    setLastActivity(
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
  };

  // ── Send a command ───────────────────────────────────────────
  const sendCmd = async (
    cmd: "relay_on" | "relay_off" | "camera_on" | "camera_off" | "rcwl_on" | "rcwl_off"
  ) => {
    if (!isAdmin) return;
    setLoadingCmd(cmd);
    const { ok, error } = await sendDeviceCommand(cmd, user?.email);
    setLoadingCmd(null);

    if (!ok) {
      addNotification({
        type: "system",
        title: "Gagal kirim perintah",
        message: error ?? "Unknown error",
        severity: "critical",
      });
      return;
    }

    const labels: Record<string, string> = {
      relay_on: "Relay/Pompa ON",
      relay_off: "Relay/Pompa OFF",
      camera_on: "Kamera ON",
      camera_off: "Kamera OFF",
      rcwl_on: "RCWL Sensor ON",
      rcwl_off: "RCWL Sensor OFF",
    };
    addNotification({
      type: "sprayer_activated",
      title: labels[cmd] ?? cmd,
      message: `Perintah ${cmd} dikirim ke Raspberry Pi`,
      severity: "warning",
    });
  };

  const isEmergency = deviceState.emergency || deviceState.system_state === "EMERGENCY";
  const isSpraying  = deviceState.system_state === "SPRAYING" || deviceState.relay_status;

  // ── Online check: last_seen within 30s ──────────────────────
  const isOnline = (() => {
    if (!deviceState.last_seen) return false;
    return (Date.now() - new Date(deviceState.last_seen).getTime()) < 30_000;
  })();

  return (
    <div
      className="rounded-[2rem] p-6 flex flex-col h-full relative overflow-hidden"
      style={{
        background: isEmergency
          ? "rgba(60,10,10,0.6)"
          : isSpraying
          ? "rgba(13, 43, 31, 0.6)"
          : "rgba(13, 43, 31, 0.4)",
        border: `1px solid ${isEmergency ? "rgba(239,68,68,0.4)" : isSpraying ? "rgba(56, 189, 248, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        transition: "all 0.5s ease",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isSpraying ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: isSpraying ? "rgba(56, 189, 248, 0.15)" : "rgba(50, 142, 110, 0.15)",
              border: `1px solid ${isSpraying ? "rgba(56, 189, 248, 0.3)" : "rgba(50, 142, 110, 0.2)"}`,
            }}
          >
            <Droplets className="w-5 h-5" style={{ color: isSpraying ? "#38bdf8" : "#90C67C" }} />
          </motion.div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase opacity-90">
              Device Control
            </h3>
            <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
              Remote Override
            </div>
          </div>
        </div>

        {/* Online badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: isOnline ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${isOnline ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          <motion.div
            animate={isOnline ? { scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isOnline ? "#4ade80" : "#ef4444" }}
          />
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: isOnline ? "#4ade80" : "#ef4444" }}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* State indicator */}
      <div className="mb-4 rounded-2xl p-3 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">State</div>
          <div
            className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
            style={{
              background: isEmergency ? "rgba(239,68,68,0.2)" : isSpraying ? "rgba(56,189,248,0.2)" : "rgba(74,222,128,0.1)",
              color: isEmergency ? "#ef4444" : isSpraying ? "#38bdf8" : "#4ade80",
            }}
          >
            {deviceState.system_state}
          </div>
        </div>
        <div className="text-[10px] text-white/20 font-bold">Last: {lastActivity}</div>
      </div>

      {/* Hardware status indicators */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Kamera",  active: deviceState.camera_status, icon: Camera },
          { label: "RCWL",    active: deviceState.rcwl_status,   icon: Radio },
          { label: "Relay",   active: deviceState.relay_status,  icon: Droplets },
        ].map(({ label, active, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-2 flex flex-col items-center gap-1"
            style={{
              background: active ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${active ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)"}`,
            }}
          >
            <Icon className="w-4 h-4" style={{ color: active ? "#4ade80" : "rgba(255,255,255,0.2)" }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: active ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
              {label}
            </span>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "#4ade80" : "rgba(255,255,255,0.1)" }} />
          </div>
        ))}
      </div>

      {/* Spray visual */}
      <div className="flex-1 flex flex-col justify-center mb-4">
        <AnimatePresence mode="wait">
          {isEmergency ? (
            <motion.div
              key="emergency"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <div className="text-lg text-red-400 font-black uppercase tracking-widest mb-1">⚠ Emergency</div>
              <div className="text-[10px] text-red-400/60 uppercase tracking-widest">Sistem berhenti — tunggu restart manual</div>
            </motion.div>
          ) : isSpraying ? (
            <motion.div
              key="spraying"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl p-6 text-center relative overflow-hidden"
              style={{ background: "rgba(56, 189, 248, 0.05)", border: "1px solid rgba(56, 189, 248, 0.1)" }}
            >
              <div className="absolute inset-0 bg-[#38bdf8]/5 animate-pulse" />
              <div className="relative z-10">
                <div className="text-2xl text-[#38bdf8] font-black tracking-tighter mb-1">SPRAYING</div>
                <div className="text-[10px] font-black text-[#38bdf8]/60 uppercase tracking-[0.2em]">Pompa Aktif</div>
                <div className="flex justify-center gap-1.5 mt-3">
                  {[0,1,2,3,4].map((i) => (
                    <motion.div key={i}
                      animate={{ y: [-4, 4, -4], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="standby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-5 flex flex-col items-center text-center gap-2"
              style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5">
                <Zap className="w-4 h-4 text-white/30" />
              </div>
              <div className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-loose">
                Sistem Standby<br />Manual Override Available
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control buttons */}
      {isAdmin ? (
        <div className="space-y-3">
          {/* Relay controls */}
          <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Settings2 className="w-3 h-3" /> Relay / Pompa
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={!deviceState.relay_status ? { scale: 1.02, y: -2 } : {}}
              whileTap={!deviceState.relay_status ? { scale: 0.98 } : {}}
              onClick={() => sendCmd("relay_on")}
              disabled={!!loadingCmd || deviceState.relay_status || isEmergency}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: deviceState.relay_status ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #328E6E, #67AE6E)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                boxShadow: deviceState.relay_status ? "none" : "0 4px 15px rgba(50,142,110,0.3)",
              }}
            >
              {loadingCmd === "relay_on" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              ON
            </motion.button>
            <motion.button
              whileHover={deviceState.relay_status ? { scale: 1.02, y: -2 } : {}}
              whileTap={deviceState.relay_status ? { scale: 0.98 } : {}}
              onClick={() => sendCmd("relay_off")}
              disabled={!!loadingCmd || !deviceState.relay_status || isEmergency}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: deviceState.relay_status ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${deviceState.relay_status ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
                color: deviceState.relay_status ? "#ef4444" : "rgba(255,255,255,0.2)",
              }}
            >
              {loadingCmd === "relay_off" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
              OFF
            </motion.button>
          </div>

          {/* Camera controls */}
          <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1 pt-1">
            <Camera className="w-3 h-3" /> Kamera
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => sendCmd("camera_on")}
              disabled={!!loadingCmd || isEmergency}
              className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              {loadingCmd === "camera_on" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              ON
            </button>
            <button
              onClick={() => sendCmd("camera_off")}
              disabled={!!loadingCmd || isEmergency}
              className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              {loadingCmd === "camera_off" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              OFF
            </button>
          </div>

          {/* RCWL controls */}
          <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1 pt-1">
            <Radio className="w-3 h-3" /> RCWL Sensor
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => sendCmd("rcwl_on")}
              disabled={!!loadingCmd || isEmergency}
              className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              {loadingCmd === "rcwl_on" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              ON
            </button>
            <button
              onClick={() => sendCmd("rcwl_off")}
              disabled={!!loadingCmd || isEmergency}
              className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              {loadingCmd === "rcwl_off" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              OFF
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-4 rounded-2xl flex items-center gap-3 bg-amber-500/5 border border-amber-500/10">
          <Shield className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] text-amber-500/70 font-bold uppercase tracking-tight leading-relaxed">
            Admin privilege diperlukan untuk remote control
          </span>
        </div>
      )}
    </div>
  );
}
