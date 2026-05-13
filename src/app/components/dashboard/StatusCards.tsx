import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bug, Activity, Droplets, Wifi, TrendingUp, TrendingDown, Camera } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

const statusColors: Record<string, string> = {
  active:  "#4ade80",
  warning: "#f59e0b",
  offline: "#ef4444",
};

export function StatusCards() {
  const [pestCountToday, setPestCountToday]   = useState(0);
  const [sprayCountToday, setSprayCountToday] = useState(0);
  const [motionToday, setMotionToday]         = useState(0);
  const [cameraOnline, setCameraOnline]       = useState(false);
  const [rcwlOnline, setRcwlOnline]           = useState(false);
  const [relayActive, setRelayActive]         = useState(false);
  const [rpiOnline, setRpiOnline]             = useState(false);
  const [systemState, setSystemState]         = useState("IDLE");
  const [activeHostname, setActiveHostname]   = useState("Offline");

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today detections
      const { data: todayData } = await supabase
        .from("pest_detection")
        .select("id, spray_status, rcwl_status, record_type, rpi_hostname, pest_type")
        .gte("timestamp", today.toISOString())
        .neq("rpi_hostname", "USEP")
        .neq("pest_type", "Whitefly")
        .neq("pest_type", "Aphid")
        .neq("pest_type", "Grasshopper");

      if (todayData) {
        const detections = todayData.filter((d: any) => d.record_type === "detection");
        setPestCountToday(detections.length);
        setSprayCountToday(detections.filter((d: any) => d.spray_status).length);
        setMotionToday(todayData.filter((d: any) => d.rcwl_status).length);
      }

      // Latest heartbeat for device status
      const { data: hb } = await supabase
        .from("pest_detection")
        .select("camera_status, rcwl_status, relay_status, system_state, timestamp, rpi_hostname")
        .eq("record_type", "heartbeat")
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (hb) {
        const isRecent = (Date.now() - new Date(hb.timestamp).getTime()) < 30_000;
        setCameraOnline(hb.camera_status && isRecent);
        setRcwlOnline(hb.rcwl_status);
        setRelayActive(hb.relay_status);
        setRpiOnline(isRecent);
        setSystemState(hb.system_state ?? "IDLE");
        setActiveHostname(isRecent ? (hb.rpi_hostname || "Active Node") : "Offline");
      }
    };

    fetchStats();

    // Realtime subscribe
    const channel = supabase
      .channel("status_cards_v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pest_detection" },
        (payload) => {
          const row = payload.new as any;
          const ts  = new Date(row.timestamp);
          const todayStart = new Date(); todayStart.setHours(0,0,0,0);

          if (row.rpi_hostname === "USEP") return;

          if (row.record_type === "heartbeat") {
            const isRecent = (Date.now() - ts.getTime()) < 30_000;
            setCameraOnline(row.camera_status && isRecent);
            setRcwlOnline(row.rcwl_status);
            setRelayActive(row.relay_status);
            setRpiOnline(isRecent);
            setSystemState(row.system_state ?? "IDLE");
            setActiveHostname(isRecent ? (row.rpi_hostname || "Active Node") : "Offline");
          }
          if (row.record_type === "detection" && ts >= todayStart && row.pest_type !== "Grasshopper") {
            setPestCountToday((p) => p + 1);
            if (row.spray_status) setSprayCountToday((p) => p + 1);
          }
          if (row.rcwl_status && ts >= todayStart) {
            setMotionToday((p) => p + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const cards = [
    {
      id: "pest",
      title: "Pest Detection",
      value: pestCountToday.toString(),
      sub: "deteksi hari ini",
      status: pestCountToday > 0 ? "warning" : "active",
      statusLabel: pestCountToday > 0 ? "Hama Ditemukan" : "Aman",
      icon: Bug,
      trend: pestCountToday > 0 ? `+${pestCountToday} hari ini` : "Tidak ada hama",
      trendUp: pestCountToday === 0,
      glow: pestCountToday > 0 ? "#f59e0b" : "#4ade80",
    },
    {
      id: "motion",
      title: "Motion (RCWL)",
      value: motionToday.toString(),
      sub: "trigger hari ini",
      status: rcwlOnline ? "active" : "offline",
      statusLabel: rcwlOnline ? "Aktif" : "Offline",
      icon: Activity,
      trend: rcwlOnline ? "Memantau" : "Sensor mati",
      trendUp: rcwlOnline,
      glow: rcwlOnline ? C.primary : "#ef4444",
    },
    {
      id: "sprayer",
      title: "Sprayer Pump",
      value: `${sprayCountToday}x`,
      sub: "spray hari ini",
      status: relayActive ? "warning" : "active",
      statusLabel: relayActive ? "Spraying" : "Standby",
      icon: Droplets,
      trend: relayActive ? "Aktif menyemprot" : "Siap",
      trendUp: true,
      glow: relayActive ? "#38bdf8" : C.secondary,
    },
    {
      id: "camera",
      title: "Perangkat",
      value: activeHostname,
      sub: rpiOnline ? `Status: ${systemState}` : "RPi offline",
      status: rpiOnline ? (cameraOnline ? "active" : "warning") : "offline",
      statusLabel: rpiOnline ? (cameraOnline ? "Rekam" : "Standby") : "Offline",
      icon: Camera,
      trend: rpiOnline ? "Terhubung" : "Tidak ada koneksi",
      trendUp: rpiOnline,
      glow: rpiOnline ? (cameraOnline ? "#4ade80" : C.accent) : "#ef4444",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6 pt-6">
      {cards.map((card, i) => {
        const Icon  = card.icon;
        const color = card.glow;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="rounded-[2rem] p-5 relative overflow-hidden group cursor-pointer transition-all duration-300"
            style={{
              background: "rgba(13, 43, 31, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
              style={{ background: color, filter: "blur(40px)" }}
            />

            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `${color}15`,
                  border: `1px solid ${color}25`,
                  boxShadow: `0 0 15px ${color}10`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: statusColors[card.status] }}
                />
                <span
                  className="text-[9px] uppercase tracking-widest font-black"
                  style={{ color: statusColors[card.status] }}
                >
                  {card.statusLabel}
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-3xl text-white font-black tracking-tight truncate">
                {card.value}
              </div>
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                {card.sub}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
              <div className="text-[11px] text-white/70 font-bold tracking-tight">
                {card.title}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-white/5">
                  {card.trendUp ? (
                    <TrendingUp className="w-3 h-3 text-[#4ade80]" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-[#ef4444]" />
                  )}
                </div>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: card.trendUp ? "#4ade80" : "#ef4444" }}
                >
                  {card.trend}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
