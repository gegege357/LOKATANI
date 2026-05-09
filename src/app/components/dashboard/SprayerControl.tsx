import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Play, Square, Clock, Zap, Settings2, AlertTriangle, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

export function SprayerControl() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isAdmin = user?.role === "admin";

  const [isActive, setIsActive] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [duration, setDuration] = useState(10);
  const [countdown, setCountdown] = useState(0);
  const [sprayCount, setSprayCount] = useState(2);
  const [lastSpray, setLastSpray] = useState("14:22:05");

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            setIsActive(false);
            setCooldown(300); // 5 min cooldown
            setSprayCount((prev) => prev + 1);
            setLastSpray(new Date().toLocaleTimeString("id-ID"));
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, countdown]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleStart = () => {
    if (!isAdmin || isActive || cooldown > 0) return;
    setIsActive(true);
    setCountdown(duration);
    addNotification({
      type: "sprayer_activated",
      title: "Sprayer Diaktifkan",
      message: `Sprayer pump aktif selama ${duration} detik`,
      severity: "warning",
    });
  };

  const handleStop = () => {
    if (!isAdmin) return;
    setIsActive(false);
    setCountdown(0);
    setCooldown(60);
  };

  const cooldownMins = Math.floor(cooldown / 60);
  const cooldownSecs = cooldown % 60;

  return (
    <div
      className="rounded-[2rem] p-6 flex flex-col h-full relative overflow-hidden"
      style={{
        background: isActive ? "rgba(13, 43, 31, 0.6)" : "rgba(13, 43, 31, 0.4)",
        border: `1px solid ${isActive ? "rgba(56, 189, 248, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        transition: "all 0.5s ease",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ 
              background: isActive ? "rgba(56, 189, 248, 0.15)" : "rgba(50, 142, 110, 0.15)",
              border: `1px solid ${isActive ? "rgba(56, 189, 248, 0.3)" : "rgba(50, 142, 110, 0.2)"}`
            }}
          >
            <Droplets className="w-5 h-5" style={{ color: isActive ? "#38bdf8" : "#90C67C" }} />
          </motion.div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase opacity-90">Sprayer Control</h3>
            <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Automated Pump</div>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: isActive ? "rgba(56,189,248,0.1)" : cooldown > 0 ? "rgba(245,158,11,0.1)" : "rgba(74,222,128,0.1)",
            border: `1px solid ${isActive ? "rgba(56,189,248,0.2)" : cooldown > 0 ? "rgba(245,158,11,0.2)" : "rgba(74,222,128,0.2)"}`,
          }}
        >
          <motion.div
            animate={isActive ? { scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isActive ? "#38bdf8" : cooldown > 0 ? "#f59e0b" : "#4ade80" }}
          />
          <span className="text-[9px] font-black uppercase tracking-widest" style={{
            color: isActive ? "#38bdf8" : cooldown > 0 ? "#f59e0b" : "#4ade80",
          }}>
            {isActive ? "SPRAYING" : cooldown > 0 ? "COOLDOWN" : "STANDBY"}
          </span>
        </div>
      </div>

      {/* Status display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Sprays</div>
          <div className="text-2xl text-white font-black tracking-tight">{sprayCount}<span className="text-xs text-white/40 ml-1 font-bold uppercase">Today</span></div>
        </div>
        <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">Last Activity</div>
          <div className="text-sm text-white font-black tracking-tight pt-1">{lastSpray}</div>
        </div>
      </div>

      {/* Dynamic Visuals */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl p-6 text-center relative overflow-hidden"
              style={{ background: "rgba(56, 189, 248, 0.05)", border: "1px solid rgba(56, 189, 248, 0.1)" }}
            >
              <div className="absolute inset-0 bg-[#38bdf8]/5 animate-pulse" />
              <div className="relative z-10">
                <div className="text-4xl text-[#38bdf8] font-black tracking-tighter mb-1">{countdown}<span className="text-lg ml-1 opacity-50">s</span></div>
                <div className="text-[10px] font-black text-[#38bdf8]/60 uppercase tracking-[0.2em]">Active Spraying</div>
                <div className="flex justify-center gap-1.5 mt-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [-4, 4, -4], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : cooldown > 0 ? (
            <motion.div
              key="cooldown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-6 flex flex-col items-center text-center gap-3"
              style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.1)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#f59e0b]/10">
                <Clock className="w-5 h-5 text-[#f59e0b] animate-spin-slow" />
              </div>
              <div>
                <div className="text-lg text-white font-black">{cooldownMins.toString().padStart(2, "0")}:{cooldownSecs.toString().padStart(2, "0")}</div>
                <div className="text-[10px] font-black text-[#f59e0b] uppercase tracking-widest">Cooldown Period</div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="standby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-6 flex flex-col items-center text-center gap-3"
              style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5">
                <Zap className="w-5 h-5 text-white/30" />
              </div>
              <div className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-loose">
                System Ready for Inference<br/>Manual Override Available
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control panel */}
      {isAdmin && (
        <div className="mt-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-white/30" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Spray Duration</span>
              </div>
              <span className="text-xs font-black text-[#90C67C]">{duration}s</span>
            </div>
            <input
              type="range"
              min={5} max={60} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={isActive || cooldown > 0}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/5 accent-[#328E6E] hover:accent-[#67AE6E] transition-all"
            />
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={!isActive && cooldown === 0 ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isActive && cooldown === 0 ? { scale: 0.98 } : {}}
              onClick={handleStart}
              disabled={isActive || cooldown > 0}
              className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300"
              style={{
                background: isActive || cooldown > 0
                  ? "rgba(255, 255, 255, 0.03)"
                  : "linear-gradient(135deg, #328E6E, #67AE6E)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: isActive || cooldown > 0 ? "none" : "0 8px 20px rgba(50, 142, 110, 0.3)",
                cursor: isActive || cooldown > 0 ? "not-allowed" : "pointer",
              }}
            >
              <Play className={`w-4 h-4 ${isActive || cooldown > 0 ? "text-white/20" : "text-white"}`} />
              <span className={`text-xs font-black uppercase tracking-widest ${isActive || cooldown > 0 ? "text-white/20" : "text-white"}`}>Manual Start</span>
            </motion.button>
            <motion.button
              whileHover={isActive ? { scale: 1.02, y: -2 } : {}}
              whileTap={isActive ? { scale: 0.98 } : {}}
              onClick={handleStop}
              disabled={!isActive}
              className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300"
              style={{
                background: isActive ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${isActive ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)"}`,
                color: isActive ? "#ef4444" : "rgba(255, 255, 255, 0.1)",
                cursor: isActive ? "pointer" : "not-allowed",
              }}
            >
              <Square className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Abort</span>
            </motion.button>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="mt-6 p-4 rounded-2xl flex items-center gap-3 bg-amber-500/5 border border-amber-500/10">
          <Shield className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] text-amber-500/70 font-bold uppercase tracking-tight leading-relaxed">
            Admin privilege required for manual sprayer override
          </span>
        </div>
      )}
    </div>
  );
}
