import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Thermometer, Wifi, Clock, HardDrive, MemoryStick } from "lucide-react";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

function MiniBar({ value, color, label, unit }: { value: number; color: string; label: string; unit: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{label}</span>
        <span className="text-xs" style={{ color, fontWeight: 600, fontSize: 10 }}>{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}40` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function SystemHealth() {
  const [metrics, setMetrics] = useState({
    cpu: 67,
    memory: 58,
    temp: 52,
    disk: 43,
    uptime: "12h 34m",
    camUptime: "99.8%",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        cpu: Math.min(95, Math.max(20, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.min(90, Math.max(30, prev.memory + (Math.random() - 0.5) * 5)),
        temp: Math.min(80, Math.max(40, prev.temp + (Math.random() - 0.5) * 3)),
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const cpuColor = metrics.cpu > 80 ? "#ef4444" : metrics.cpu > 60 ? "#f59e0b" : "#4ade80";
  const tempColor = metrics.temp > 70 ? "#ef4444" : metrics.temp > 55 ? "#f59e0b" : "#4ade80";

  const stats = [
    { icon: Clock, label: "System Uptime", value: metrics.uptime, color: C.accent },
    { icon: Wifi, label: "Camera Link", value: metrics.camUptime, color: "#4ade80" },
  ];

  return (
    <div
      className="rounded-[2rem] p-6 flex flex-col h-full relative overflow-hidden"
      style={{
        background: "rgba(13, 43, 31, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }}
    >
      {/* Subtle Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#328E6E]/10 blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform hover:rotate-12" style={{ background: "rgba(50, 142, 110, 0.15)", border: "1px solid rgba(50, 142, 110, 0.2)" }}>
            <Cpu className="w-5 h-5 text-[#90C67C]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase opacity-90">System Health</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              <span className="text-[10px] text-[#4ade80] font-bold uppercase tracking-tighter">Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Device Hardware Spec */}
      <div
        className="rounded-2xl px-4 py-3 mb-6 flex items-center gap-3"
        style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "rgba(50, 142, 110, 0.1)" }}>
          🍓
        </div>
        <div>
          <div className="text-xs text-white font-bold">Raspberry Pi 4B</div>
          <div className="text-[10px] text-white/40 font-medium">Quad-core Cortex-A72 • 4GB LPDDR4</div>
        </div>
        <div className="ml-auto">
          <div className="px-2 py-1 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/20">
            <span className="text-[9px] text-[#4ade80] font-black uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics */}
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">CPU Load</span>
            </div>
            <span className="text-xs font-black text-white" style={{ color: cpuColor }}>{Math.round(metrics.cpu)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.cpu}%` }}
              className="h-full rounded-full"
              style={{ background: cpuColor, boxShadow: `0 0 10px ${cpuColor}60` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">Memory usage</span>
            </div>
            <span className="text-xs font-black text-white" style={{ color: "#38bdf8" }}>{Math.round(metrics.memory)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.memory}%` }}
              className="h-full rounded-full"
              style={{ background: "#38bdf8", boxShadow: "0 0 10px rgba(56, 189, 248, 0.6)" }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <Thermometer className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">Core Temperature</span>
            </div>
            <span className="text-xs font-black text-white" style={{ color: tempColor }}>{Math.round(metrics.temp)}°C</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.temp}%` }}
              className="h-full rounded-full"
              style={{ background: tempColor, boxShadow: `0 0 10px ${tempColor}60` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">Storage Disk</span>
            </div>
            <span className="text-xs font-black text-white" style={{ color: C.accent }}>{metrics.disk}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.disk}%` }}
              className="h-full rounded-full"
              style={{ background: C.accent, boxShadow: `0 0 10px ${C.accent}60` }}
            />
          </div>
        </div>
      </div>

      {/* System Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-3 flex flex-col gap-2 group transition-all duration-300 hover:bg-white/5"
            style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.04)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors group-hover:bg-white/10" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-sm text-white font-black tracking-tight">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

