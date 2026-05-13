import React, { useState } from "react";
import { motion } from "framer-motion";
import { Power, AlertTriangle, Loader2 } from "lucide-react";
import { sendDeviceCommand } from "../../../lib/deviceCommands";
import { useAuth } from "../../context/AuthContext";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
  danger: "#ef4444",
  warning: "#f59e0b",
};

export function EmergencyStop() {
  const { user } = useAuth();
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmergencyStop = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    setError(null);

    const { ok, error: cmdErr } = await sendDeviceCommand(
      "emergency_stop",
      user?.email ?? "web_dashboard"
    );

    setLoading(false);

    if (!ok) {
      setError(`Gagal kirim perintah: ${cmdErr}`);
      setShowConfirm(false);
      return;
    }

    setIsEmergencyMode(true);
    setShowConfirm(false);

    // Tampilkan state emergency selama 8 detik, lalu reset UI
    setTimeout(() => {
      setIsEmergencyMode(false);
    }, 8000);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-4 lg:px-6 mb-4 mt-6"
    >
      <div
        className="rounded-[2rem] p-6 relative overflow-hidden transition-all duration-500"
        style={{
          background: isEmergencyMode
            ? `linear-gradient(135deg, ${C.danger}30, ${C.warning}30)`
            : "rgba(13, 43, 31, 0.4)",
          border: isEmergencyMode
            ? `2px solid ${C.danger}40`
            : "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: isEmergencyMode
            ? `0 0 50px ${C.danger}40`
            : "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Animated Background Glow when in emergency mode */}
        {isEmergencyMode && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-500 blur-3xl pointer-events-none"
          />
        )}

        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 ${
                isEmergencyMode ? "animate-pulse" : ""
              }`}
              style={{
                background: isEmergencyMode
                  ? `linear-gradient(135deg, ${C.danger}, ${C.warning})`
                  : `rgba(255, 255, 255, 0.05)`,
                border: `1px solid ${isEmergencyMode ? "transparent" : "rgba(255, 255, 255, 0.1)"}`,
                boxShadow: isEmergencyMode ? `0 0 30px ${C.danger}60` : "none",
              }}
            >
              {isEmergencyMode ? (
                <AlertTriangle className="w-7 h-7 text-white" />
              ) : (
                <Power className="w-7 h-7 text-white/40" />
              )}
            </div>
            <div>
              <h3
                className="text-lg font-black tracking-tight uppercase"
                style={{ color: "white" }}
              >
                {isEmergencyMode ? "EMERGENCY ACTIVE" : "Emergency Stop"}
              </h3>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mt-1"
                style={{
                  color: isEmergencyMode
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.3)",
                }}
              >
                {isEmergencyMode
                  ? "Perintah emergency dikirim ke Raspberry Pi"
                  : "Matikan semua perangkat aktif secara darurat"}
              </p>
              {error && (
                <p className="text-[11px] font-bold text-red-400 mt-1">{error}</p>
              )}
            </div>
          </div>

          {!isEmergencyMode && (
            <div className="flex gap-3">
              {showConfirm ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 hover:bg-white/10 disabled:opacity-50"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "rgba(255, 255, 255, 0.6)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleEmergencyStop}
                    disabled={loading}
                    className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${C.danger}, ${C.warning})`,
                      color: "white",
                      boxShadow: `0 8px 25px ${C.danger}50`,
                    }}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Stop
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEmergencyStop}
                  className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 group"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Power className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                    Stop Darurat
                  </div>
                </button>
              )}
            </div>
          )}

          {isEmergencyMode && (
            <div className="text-right">
              <div className="inline-block px-3 py-1 rounded-lg bg-white/10 border border-white/20 mb-1">
                <span className="text-[10px] text-white font-black uppercase tracking-widest animate-pulse">
                  Perintah Terkirim...
                </span>
              </div>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">
                Raspberry Pi akan berhenti dalam ~3 detik
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
