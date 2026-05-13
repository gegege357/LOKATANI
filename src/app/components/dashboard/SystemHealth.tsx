import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Thermometer, Wifi, Clock, HardDrive, MemoryStick } from "lucide-react";
import { supabase } from "../../../lib/supabase";

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
  const [rpiHostname, setRpiHostname] = useState("rpi-hydro-01");
  const [rpiOnline, setRpiOnline]     = useState(false);
  const [lastSeen, setLastSeen]       = useState("—");
  const [camStatus, setCamStatus]     = useState(true);
  const [rcwlStatus, setRcwlStatus]   = useState(true);
  const [relayStatus, setRelayStatus] = useState("IDLE");

  useEffect(() => {

    // Load latest heartbeat
    const loadHB = async () => {
      const { data } = await supabase
        .from("pest_detection")
        .select("rpi_hostname, timestamp, camera_status")
        .eq("record_type", "heartbeat")
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setRpiHostname(data.rpi_hostname ?? "rpi-hydro-01");
        const ts      = new Date(data.timestamp);
        const online  = (Date.now() - ts.getTime()) < 30_000;
        setRpiOnline(online);
        setLastSeen(ts.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setCamStatus(data.camera_status ?? true);
        setRcwlStatus(data.rcwl_status ?? true);
        setRelayStatus(data.system_state ?? "IDLE");
      }
    };
    loadHB();

    // Realtime updates
    const channel = supabase
      .channel("system_health_hb")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "pest_detection" },
        (payload) => {
          const row = payload.new as any;
          if (row.record_type !== "heartbeat") return;
          setRpiHostname(row.rpi_hostname ?? "rpi-hydro-01");
          const ts     = new Date(row.timestamp);
          const online = (Date.now() - ts.getTime()) < 30_000;
          setRpiOnline(online);
          setLastSeen(ts.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
          setCamStatus(row.camera_status ?? true);
          setRcwlStatus(row.rcwl_status ?? true);
          setRelayStatus(row.system_state ?? "IDLE");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = [
    { icon: Wifi,  label: "RPi Node", value: rpiOnline ? "Online" : "Offline", color: rpiOnline ? "#4ade80" : "#ef4444" },
    { icon: Clock, label: "Last Seen", value: lastSeen, color: C.accent },
    { icon: Thermometer, label: "Camera", value: camStatus ? "Connected" : "Error", color: camStatus ? "#4ade80" : "#ef4444" },
    { icon: Cpu, label: "RCWL Sensor", value: rcwlStatus ? "Active" : "Error", color: rcwlStatus ? "#4ade80" : "#ef4444" },
    { icon: MemoryStick, label: "Relay Module", value: relayStatus === "SPRAYING" ? "Spraying" : "Standby", color: relayStatus === "SPRAYING" ? "#f59e0b" : "#4ade80" },
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
          <div className="text-xs text-white font-bold">{rpiHostname}</div>
          <div className="text-[10px] text-white/40 font-medium">Raspberry Pi • Lokatani Guard v5</div>
        </div>
        <div className="ml-auto">
          <div className="px-2 py-1 rounded-lg" style={{ background: rpiOnline ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${rpiOnline ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}` }}>
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: rpiOnline ? "#4ade80" : "#ef4444" }}>
              {rpiOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* System Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-auto pt-4">
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

