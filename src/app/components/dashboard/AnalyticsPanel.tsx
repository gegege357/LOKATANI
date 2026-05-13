import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { BarChart3, TrendingUp, PieChart as PieIcon } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
  bg: "#E1EEBC",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: "#0d2b1f",
        border: "1px solid rgba(144,198,124,0.2)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="text-xs text-white mb-1" style={{ fontWeight: 600 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{p.name}:</span>
          <span style={{ color: "white", fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function AnalyticsPanel() {
  const [activeTab, setActiveTab] = useState<"trend" | "hourly" | "dist">("trend");
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [pestDist, setPestDist] = useState<any[]>([]);
  const [stats, setStats] = useState({ total7d: 0, dominant: "-", peakHour: "-" });

  useEffect(() => {
    const loadData = async () => {
      // Ambil data 7 hari terakhir agar tidak kosong
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoIso = sevenDaysAgo.toISOString();

      const { data } = await supabase
        .from("pest_detection")
        .select("timestamp, pest_type")
        .eq("record_type", "detection")
        .gte("timestamp", sevenDaysAgoIso)
        .neq("rpi_hostname", "USEP")
        .neq("pest_type", "Whitefly")
        .neq("pest_type", "Aphid")
        .neq("pest_type", "Grasshopper")
        .order("timestamp", { ascending: true });

      if (!data) return;

      const counts: Record<string, number> = { "Ulat": 0, "Belalang": 0 };
      const hours: Record<string, number> = {};
      const daysArr: any[] = [];

      // Inisialisasi 7 hari terakhir
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString("id-ID", { weekday: 'short' });
        const dateKey = d.toISOString().split('T')[0];
        daysArr.push({ day: dayLabel, dateKey, Ulat: 0, Belalang: 0 });
      }

      data.forEach(row => {
        const ts = new Date(row.timestamp);
        let pest = (row.pest_type || "Unknown").trim();
        
        // Normalisasi nama lebih agresif
        const lowPest = pest.toLowerCase();
        if (lowPest.includes("ulat") || lowPest.includes("caterpillar")) pest = "Ulat";
        else if (lowPest.includes("belalang") || lowPest.includes("grasshopper")) pest = "Belalang";
        else pest = "Unknown";

        if (pest !== "Unknown") {
          counts[pest] = (counts[pest] || 0) + 1;
        }

        const hr = ts.getHours().toString().padStart(2, '0');
        hours[hr] = (hours[hr] || 0) + 1;

        const rowDateKey = ts.toISOString().split('T')[0];
        const dayObj = daysArr.find(d => d.dateKey === rowDateKey);
        if (dayObj && pest !== "Unknown") {
          dayObj[pest] = (dayObj[pest] || 0) + 1;
        }
      });

      const distData = Object.keys(counts)
        .filter(k => counts[k] > 0)
        .map(k => {
          const lowerK = k.toLowerCase();
          let color = "#90C67C"; // Default green
          if (lowerK.includes("ulat") || lowerK.includes("caterpillar")) color = "#ef4444"; // Red for Ulat
          if (lowerK.includes("belalang") || lowerK.includes("grasshopper")) color = "#f59e0b"; // Orange for Belalang
          
          return {
            name: k,
            value: counts[k],
            color
          };
        });

      const hourData = Object.keys(hours).map(h => ({ hour: h, detections: hours[h] })).sort((a,b) => a.hour.localeCompare(b.hour));

      let dom = "-";
      let max = 0;
      for (let k in counts) { if (counts[k] > max) { max = counts[k]; dom = k; } }

      let peak = "-";
      let maxH = 0;
      for (let h in hours) { if (hours[h] > maxH) { maxH = hours[h]; peak = `${h}:00`; } }

      setDailyData(daysArr);
      setHourlyData(hourData);
      setPestDist(distData);
      setStats({ total7d: data.length, dominant: dom, peakHour: peak });
    };

    loadData();

    const channel = supabase
      .channel("analytics_sync")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pest_detection" }, (payload) => {
        const row = payload.new as any;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoIso = sevenDaysAgo.toISOString();
        
        if (row.timestamp >= sevenDaysAgoIso && row.rpi_hostname !== "USEP" && row.pest_type !== "Grasshopper") {
          loadData();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const tabs = [
    { id: "trend", label: "Daily Trend", icon: TrendingUp },
    { id: "hourly", label: "Hourly", icon: BarChart3 },
    { id: "dist", label: "Species Dist", icon: PieIcon },
  ] as const;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(50, 142, 110, 0.15)", border: "1px solid rgba(50, 142, 110, 0.2)" }}>
            <BarChart3 className="w-5 h-5 text-[#90C67C]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase opacity-90">Intelligence Panel</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              <span className="text-[10px] text-[#4ade80] font-bold uppercase tracking-widest">Real-time Analytics</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/5 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
                style={{
                  background: activeTab === tab.id ? "#328E6E" : "transparent",
                  color: activeTab === tab.id ? "white" : "rgba(255,255,255,0.3)",
                  boxShadow: activeTab === tab.id ? "0 4px 12px rgba(50, 142, 110, 0.3)" : "none",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto custom-scrollbar pb-2">
        {[
          { label: "Total Data", value: stats.total7d, color: "#90C67C", sub: "Detections" },
          { label: "Dominant", value: stats.dominant, color: "#ef4444", sub: "Species" },
          { label: "Peak Hour", value: stats.peakHour, color: "#f59e0b", sub: "Intensity" },
        ].map(({ label, value, color, sub }) => (
          <div
            key={label}
            className="px-5 py-4 rounded-2xl flex-shrink-0 min-w-[140px]"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{label}</div>
            <div className="text-lg font-black tracking-tight truncate" style={{ color }}>{value}</div>
            <div className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-[260px] w-full relative">
        {activeTab === "trend" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} barCategoryGap="25%">
              <defs>
                <linearGradient id="ulatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="belalangGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="8 8" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", paddingBottom: 20, color: "rgba(255,255,255,0.3)" }}
              />
              <Bar dataKey="Ulat" name="Ulat" fill="url(#ulatGrad)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Belalang" name="Belalang" fill="url(#belalangGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === "hourly" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="detGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#328E6E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#328E6E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="8 8" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}:00`}
              />
              <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="detections"
                name="Detections"
                stroke="#90C67C"
                strokeWidth={3}
                fill="url(#detGrad)"
                dot={{ fill: "#90C67C", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: "rgba(255,255,255,0.2)", strokeWidth: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "dist" && (
          <div className="flex flex-col sm:flex-row items-center justify-center h-full gap-8">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pestDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pestDist.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{ filter: `drop-shadow(0 0 12px ${entry.color}40)` }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {pestDist.map((p) => (
                <div key={p.name} className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/2 border border-white/5 min-w-[160px]">
                  <div className="w-3 h-3 rounded-full" style={{ background: p.color, boxShadow: `0 0 15px ${p.color}` }} />
                  <div>
                    <div className="text-[10px] font-black text-white uppercase tracking-widest">{p.name}</div>
                    <div className="text-lg font-black mt-0.5" style={{ color: p.color }}>{p.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
