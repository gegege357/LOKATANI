import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, Activity as ActivityIcon, Droplets, AlertCircle, Clock } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

interface Activity {
  id: string;
  type: "pest_detected" | "motion_detected" | "sprayer_activated" | "system";
  message: string;
  detail?: string;
  timestamp: Date;
  severity: "critical" | "warning" | "info";
  pest?: string;
  confidence?: number;
}

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "a6", type: "system", message: "Sistem Terhubung", detail: "Menunggu data dari Raspberry Pi...",
    timestamp: new Date(), severity: "info",
  },
];

const typeConfig = {
  pest_detected: { icon: Bug, color: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)" },
  motion_detected: { icon: ActivityIcon, color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" },
  sprayer_activated: { icon: Droplets, color: "#38bdf8", bg: "rgba(56,189,248,0.15)", border: "rgba(56,189,248,0.3)" },
  system: { icon: AlertCircle, color: C.accent, bg: "rgba(144,198,124,0.15)", border: "rgba(144,198,124,0.3)" },
};

function formatRelTime(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  return `${Math.floor(diff / 3600)}j lalu`;
}

export function ActivityTimeline() {
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fungsi mengubah data supabase jadi format activity timeline
    const mapSupabaseToActivity = (data: any): Activity[] => {
      const results: Activity[] = [];
      const timestamp = new Date(data.timestamp);
      
      // Aktivitas deteksi
      results.push({
        id: `pest-${data.id}`,
        type: "pest_detected",
        message: `${data.pest_type} Terdeteksi`,
        detail: `Kamera ${data.rpi_hostname} - Zona ${data.camera_location}`,
        timestamp,
        severity: "critical",
        pest: data.pest_type,
        confidence: data.confidence ? Math.round(data.confidence * 100) : undefined,
      });

      // Aktivitas sprayer jika aktif
      if (data.spray_status) {
        results.push({
          id: `spray-${data.id}`,
          type: "sprayer_activated",
          message: "Sprayer Aktif",
          detail: `Otomatis semprot selama ${data.spray_duration_sec} detik`,
          timestamp: new Date(timestamp.getTime() + 1000), // Beda 1 detik agar urutan rapi
          severity: "warning",
        });
      }

      return results;
    };

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from("pest_detections")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(10); // Ambil 10 deteksi terakhir

        if (!error && data && data.length > 0) {
          let loadedActivities: Activity[] = [];
          data.forEach(d => {
            loadedActivities = [...loadedActivities, ...mapSupabaseToActivity(d)];
          });
          
          // Sort by timestamp desc and take max 15
          loadedActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setActivities(loadedActivities.slice(0, 15));
        }
      } catch (err) {
        console.error("Gagal load history activity:", err);
      }
    };

    fetchActivities();

    const channel = supabase
      .channel("activity_timeline_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pest_detections" },
        (payload) => {
          const newActivities = mapSupabaseToActivity(payload.new);
          // Sort descending
          newActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

          setActivities((prev) => {
            // Hilangkan "Sistem Terhubung" jika itu satu-satunya isi
            const filteredPrev = prev.length === 1 && prev[0].type === "system" ? [] : prev;
            return [...newActivities, ...filteredPrev].slice(0, 15);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div
      className="rounded-[2rem] p-6 flex flex-col h-full relative overflow-hidden"
      style={{
        background: "rgba(13, 43, 31, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(50, 142, 110, 0.15)", border: "1px solid rgba(50, 142, 110, 0.2)" }}>
            <Clock className="w-5 h-5 text-[#90C67C]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase opacity-90">System Activity</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              <span className="text-[10px] text-[#4ade80] font-bold uppercase tracking-tighter">Live Stream</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar" style={{ maxHeight: 380 }}>
        <AnimatePresence initial={false} mode="popLayout">
          {activities.map((activity, i) => {
            const cfg = typeConfig[activity.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex gap-4 p-4 rounded-2xl group transition-all duration-300 hover:bg-white/5"
                style={{
                  background: i === 0 ? "rgba(255, 255, 255, 0.03)" : "transparent",
                  border: `1px solid ${i === 0 ? "rgba(255, 255, 255, 0.06)" : "transparent"}`,
                }}
              >
                <div className="relative flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-12"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  {i < activities.length - 1 && (
                    <div className="w-px flex-1 mt-2 mb-2 opacity-20" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)", minHeight: 12 }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-bold tracking-tight leading-none">
                          {activity.message}
                        </span>
                        {activity.confidence && (
                          <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10">
                            <span className="text-[9px] font-black uppercase tracking-tighter" style={{ color: cfg.color }}>
                              {activity.confidence.toFixed(1)}% Match
                            </span>
                          </div>
                        )}
                      </div>
                      {activity.detail && (
                        <div className="text-[10px] text-white/30 font-medium tracking-wide">
                          {activity.detail}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-tighter whitespace-nowrap">
                      {formatRelTime(activity.timestamp)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
