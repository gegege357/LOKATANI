import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Target } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

function CircularGauge({ value, max = 100, size = 120, strokeWidth = 10, color }: {
  value: number; max?: number; size?: number; strokeWidth?: number; color: string;
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 270 degrees
  const offset = arc - (arc * value) / max;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} className="rotate-[135deg]">
      {/* Background track */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${arc} ${circumference}`}
        strokeLinecap="round"
      />
      {/* Value arc */}
      <motion.circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${arc} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        initial={{ strokeDashoffset: arc }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </svg>
  );
}

interface RecentDet { label: string; confidence: number; color: string; }

const PEST_COLORS: Record<string, string> = {
  Caterpillar: "#ef4444",
  Grasshopper: "#f59e0b",
  default:     "#38bdf8",
};

export function AIConfidenceMeter() {
  const [currentConf, setCurrentConf] = useState(0);
  const [recentDets, setRecentDets]   = useState<RecentDet[]>([]);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("pest_detection")
        .select("pest_type, confidence, rpi_hostname")
        .eq("record_type", "detection")
        .not("pest_type", "is", null)
        .neq("rpi_hostname", "USEP")
        .neq("pest_type", "Grasshopper")
        .neq("pest_type", "Whitefly")
        .neq("pest_type", "Aphid")
        .order("timestamp", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        const latest = data[0];
        const conf   = latest.confidence ?? 0;
        // stored as 0–1 fraction
        setCurrentConf(conf <= 1 ? conf * 100 : conf);

        const recent = data.map((d: any) => ({
          label:      d.pest_type ?? "Unknown",
          confidence: d.confidence <= 1 ? +(d.confidence * 100).toFixed(1) : +d.confidence.toFixed(1),
          color:      PEST_COLORS[d.pest_type] ?? PEST_COLORS.default,
        }));
        setRecentDets(recent);
      }
    };
    fetchLatest();

    const channel = supabase
      .channel("ai_confidence_meter")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "pest_detection" },
        (payload) => {
          const row = payload.new as any;
          if (row.record_type !== "detection" || !row.pest_type) return;
          if (row.rpi_hostname === "USEP" || row.pest_type === "Grasshopper" || row.pest_type === "Whitefly" || row.pest_type === "Aphid") return;
          
          const conf = row.confidence <= 1 ? row.confidence * 100 : row.confidence;
          setCurrentConf(+conf.toFixed(1));
          setRecentDets((prev) => [
            { label: row.pest_type, confidence: +conf.toFixed(1), color: PEST_COLORS[row.pest_type] ?? PEST_COLORS.default },
            ...prev,
          ].slice(0, 5));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const confColor =
    currentConf >= 85 ? "#4ade80" :
    currentConf >= 70 ? "#f59e0b" : "#ef4444";

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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(50, 142, 110, 0.15)", border: "1px solid rgba(50, 142, 110, 0.2)" }}>
          <Brain className="w-5 h-5 text-[#90C67C]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase opacity-90">AI Confidence</h3>
          <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Decision Metrics</div>
        </div>
      </div>

      {/* Main gauge */}
      <div className="flex flex-col items-center justify-center py-4 relative">
        <div className="relative group transition-transform duration-500 hover:scale-105">
          <CircularGauge value={currentConf} size={150} strokeWidth={12} color={confColor} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.div
              key={currentConf.toFixed(0)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl text-white font-black tracking-tighter"
              style={{ textShadow: `0 0 20px ${confColor}40` }}
            >
              {currentConf.toFixed(1)}%
            </motion.div>
            <div className="text-[9px] font-black text-white/30 tracking-[0.2em] mt-1 uppercase">Confidence</div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
          <Target className="w-3.5 h-3.5 text-[#90C67C]" />
          <span className="text-[11px] text-white/60 font-bold uppercase tracking-tight">
            Confidence Threshold: <span className="text-[#4ade80] font-black ml-1">60%</span>
          </span>
        </div>
      </div>

      {/* Recent detections confidence */}
      <div className="mt-6 space-y-4">
        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Latest Inference</div>
        {recentDets.length === 0 ? (
          <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Belum ada deteksi</div>
        ) : recentDets.slice(0, 3).map((det, idx) => (
          <div key={det.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60 font-bold">{det.label}</span>
              <span className="text-xs font-black" style={{ color: det.color }}>{det.confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: det.color, boxShadow: `0 0 10px ${det.color}40` }}
                initial={{ width: 0 }}
                animate={{ width: `${det.confidence}%` }}
                transition={{ duration: 1.2, ease: "circOut" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Model info */}
      <div
        className="mt-auto pt-6"
      >
        <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#4ade80]" />
            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">CNN Model • v1.2</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-white/20 font-bold uppercase">Threshold: 60%</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
          </div>
        </div>
      </div>
    </div>
  );
}
