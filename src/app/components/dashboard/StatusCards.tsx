import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bug, Activity, Droplets, Wifi, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

type DeviceTool = {
  id: string;
  name: string;
  type: string;
  status: "active" | "idle" | "maintenance";
  notes: string;
};

type Device = {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline";
  tools: DeviceTool[];
  createdAt: string;
};

const STORAGE_KEY = "lokatani_devices";

const CARDS = [
  {
    id: "pest",
    title: "Pest Detection",
    value: "3",
    sub: "deteksi hari ini",
    status: "warning",
    statusLabel: "Aktif Memantau",
    icon: Bug,
    trend: "+2",
    trendUp: true,
    glow: "#f59e0b",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
    border: "rgba(245,158,11,0.3)",
  },
  {
    id: "pir",
    title: "PIR Motion",
    value: "7",
    sub: "gerakan terdeteksi",
    status: "active",
    statusLabel: "Online",
    icon: Activity,
    trend: "Normal",
    trendUp: true,
    glow: C.primary,
    gradient: "linear-gradient(135deg, rgba(50,142,110,0.2), rgba(50,142,110,0.05))",
    border: `rgba(50,142,110,0.35)`,
  },
  {
    id: "sprayer",
    title: "Sprayer Pump",
    value: "2x",
    sub: "spray hari ini",
    status: "active",
    statusLabel: "Standby",
    icon: Droplets,
    trend: "Siap",
    trendUp: true,
    glow: "#38bdf8",
    gradient: "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.05))",
    border: "rgba(56,189,248,0.3)",
  },
  {
    id: "network",
    title: "Network Status",
    value: "98%",
    sub: "uptime koneksi",
    status: "active",
    statusLabel: "Connected",
    icon: Wifi,
    trend: "Stabil",
    trendUp: true,
    glow: C.secondary,
    gradient: "linear-gradient(135deg, rgba(103,174,110,0.2), rgba(103,174,110,0.05))",
    border: `rgba(103,174,110,0.35)`,
  },
];

const statusColors: Record<string, string> = {
  active: "#4ade80",
  warning: "#f59e0b",
  offline: "#ef4444",
};

export function StatusCards() {
  const [alertSummary, setAlertSummary] = useState({ total: 0, high: 0, medium: 0 });
  const [pestCountToday, setPestCountToday] = useState("0");
  const [sprayCountToday, setSprayCountToday] = useState("0x");

  useEffect(() => {
    // Fetch today's data from Supabase
    const fetchTodayStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIso = today.toISOString();

        const { data, error } = await supabase
          .from("pest_detections")
          .select("id, spray_status")
          .gte("timestamp", todayIso);

        if (!error && data) {
          setPestCountToday(data.length.toString());
          const sprayCount = data.filter((d: any) => d.spray_status === true).length;
          setSprayCountToday(`${sprayCount}x`);
        }
      } catch (err) {
        console.error("Error fetching today's stats:", err);
      }
    };

    fetchTodayStats();

    // Subscribe to realtime inserts
    const channel = supabase
      .channel("status_cards_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pest_detections" },
        (payload) => {
          // Increment count based on payload
          setPestCountToday((prev) => (parseInt(prev) + 1).toString());
          if (payload.new.spray_status === true) {
             setSprayCountToday((prev) => `${parseInt(prev.replace('x', '')) + 1}x`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const loadAlerts = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
          setAlertSummary({ total: 0, high: 0, medium: 0 });
          return;
        }

        const devices: Device[] = JSON.parse(saved);
        let high = 0;
        let medium = 0;

        devices.forEach((device) => {
          if (device.status === "offline") {
            high += 1;
          }
          device.tools.forEach((tool) => {
            if (tool.status === "maintenance") {
              medium += 1;
            }
          });
        });

        setAlertSummary({ total: high + medium, high, medium });
      } catch (error) {
        console.error("Error loading device alerts:", error);
      }
    };

    loadAlerts();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        loadAlerts();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const alertCard = {
    id: "device_alerts",
    title: "Device Alerts",
    value: alertSummary.total.toString(),
    sub: "peringatan aktif",
    status: alertSummary.high > 0 ? "offline" : alertSummary.medium > 0 ? "warning" : "active",
    statusLabel: alertSummary.high > 0 ? "Kritis" : alertSummary.medium > 0 ? "Perhatian" : "Aman",
    icon: AlertTriangle,
    trend: alertSummary.high > 0 ? `${alertSummary.high} kritis` : alertSummary.medium > 0 ? `${alertSummary.medium} alert` : "Sistem Aman",
    trendUp: alertSummary.high === 0,
    glow: alertSummary.high > 0 ? "#ef4444" : alertSummary.medium > 0 ? "#f59e0b" : "#4ade80",
  };

  const dynamicCards = CARDS.map(card => {
    if (card.id === "pest") return { ...card, value: pestCountToday };
    if (card.id === "sprayer") return { ...card, value: sprayCountToday };
    return card;
  });

  const cards = [...dynamicCards, alertCard];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 px-4 lg:px-6 pt-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
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
            {/* Ambient Background Glow */}
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
                  boxShadow: `0 0 15px ${color}10`
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
                <span className="text-[9px] uppercase tracking-widest font-black" style={{ color: statusColors[card.status] }}>
                  {card.statusLabel}
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-3xl text-white font-black tracking-tight">{card.value}</div>
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{card.sub}</div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
              <div className="text-[11px] text-white/70 font-bold tracking-tight">{card.title}</div>
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-white/5">
                  {card.trendUp ? (
                    <TrendingUp className="w-3 h-3 text-[#4ade80]" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-[#ef4444]" />
                  )}
                </div>
                <span className="text-[10px] font-bold" style={{ color: card.trendUp ? "#4ade80" : "#ef4444" }}>
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
