import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, WifiOff, CameraOff, PowerOff, X, HardDrive } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export function DeviceAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkHealth = async () => {
      const { data, error } = await supabase
        .from("pest_detection")
        .select("timestamp, camera_status, rcwl_status, emergency, system_state, rpi_hostname")
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return;

      const newAlerts = [];
      const lastSeen = new Date(data.timestamp).getTime();
      const now = new Date().getTime();
      const diffSec = (now - lastSeen) / 1000;

      // 1. Check Offline
      if (diffSec > 60) {
        newAlerts.push({
          id: `offline-${data.timestamp}`,
          title: "Koneksi RPi Terputus",
          message: `Raspberry Pi tidak merespons selama >1 menit. Terakhir dilihat: ${new Date(data.timestamp).toLocaleTimeString()}`,
          icon: WifiOff,
          severity: "high",
          deviceName: data.rpi_hostname || "RPi Node",
        });
      } else {
        // 2. Check Camera
        if (data.camera_status === false) {
          newAlerts.push({
            id: `cam-${data.timestamp}`,
            title: "Modul Kamera Error",
            message: "Kamera tidak terdeteksi oleh sistem. Cek koneksi kabel fleksibel.",
            icon: CameraOff,
            severity: "medium",
            deviceName: data.rpi_hostname || "RPi Node",
          });
        }
        // 3. Check RCWL
        if (data.rcwl_status === false) {
          newAlerts.push({
            id: `rcwl-${data.timestamp}`,
            title: "Sensor RCWL Mati",
            message: "Sensor gerak gagal diinisialisasi. Counting tidak akan berjalan.",
            icon: AlertTriangle,
            severity: "medium",
            deviceName: data.rpi_hostname || "RPi Node",
          });
        }
        // 4. Check Emergency
        if (data.emergency === true || data.system_state === "EMERGENCY") {
          newAlerts.push({
            id: `emg-${data.timestamp}`,
            title: "EMERGENCY STOP AKTIF",
            message: "Sistem dihentikan paksa. Periksa hardware dan reset sistem.",
            icon: PowerOff,
            severity: "high",
            deviceName: data.rpi_hostname || "RPi Node",
          });
        }
      }

      setAlerts(newAlerts);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 lg:px-6 mb-6 mt-6">
      <div className="rounded-[2rem] overflow-hidden relative" style={{ background: "rgba(13, 43, 31, 0.4)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)" }}>
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
              <AlertTriangle className="w-5 h-5 text-[#fbbf24]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide uppercase">Hardware Error Alerts ({visibleAlerts.length})</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter mt-0.5">Live Diagnostic</p>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-5 space-y-4">
          <AnimatePresence mode="popLayout">
            {visibleAlerts.map((alert, index) => (
              <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="rounded-2xl p-5 flex items-start gap-5 relative group transition-all duration-300 hover:bg-white/5" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 rounded-r-full" style={{ background: alert.severity === "high" ? "#ef4444" : "#fbbf24" }} />
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: alert.severity === "high" ? "rgba(239, 68, 68, 0.1)" : "rgba(251, 191, 36, 0.1)", border: `1px solid ${alert.severity === "high" ? "rgba(239, 68, 68, 0.2)" : "rgba(251, 191, 36, 0.2)"}` }}>
                  <alert.icon className="w-6 h-6" style={{ color: alert.severity === "high" ? "#ef4444" : "#fbbf24" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-white font-bold text-sm tracking-tight">{alert.title}</h4>
                      <p className="text-xs text-white/50 leading-relaxed max-w-2xl">{alert.message}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                          <HardDrive className="w-3 h-3 text-white/30" />
                          <span className="text-[10px] text-white/40 font-black uppercase tracking-tight">{alert.deviceName}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))} className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/5 text-white/30 hover:text-white/70 hover:bg-white/10 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
