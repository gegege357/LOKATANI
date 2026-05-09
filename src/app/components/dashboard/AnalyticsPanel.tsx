import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { BarChart3, TrendingUp, PieChart as PieIcon } from "lucide-react";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
  bg: "#E1EEBC",
};

const DAILY_DATA = [
  { day: "Sel", caterpillar: 4, grasshopper: 2, rat: 1 },
  { day: "Rab", caterpillar: 6, grasshopper: 3, rat: 0 },
  { day: "Kam", caterpillar: 2, grasshopper: 5, rat: 2 },
  { day: "Jum", caterpillar: 8, grasshopper: 1, rat: 1 },
  { day: "Sab", caterpillar: 3, grasshopper: 4, rat: 3 },
  { day: "Min", caterpillar: 5, grasshopper: 2, rat: 0 },
  { day: "Sen", caterpillar: 7, grasshopper: 6, rat: 2 },
];

const HOURLY_DATA = [
  { hour: "06", detections: 1 }, { hour: "07", detections: 0 }, { hour: "08", detections: 3 },
  { hour: "09", detections: 2 }, { hour: "10", detections: 5 }, { hour: "11", detections: 4 },
  { hour: "12", detections: 2 }, { hour: "13", detections: 6 }, { hour: "14", detections: 8 },
  { hour: "15", detections: 3 }, { hour: "16", detections: 4 }, { hour: "17", detections: 2 },
];

const PEST_DIST = [
  { name: "Caterpillar", value: 56, color: "#ef4444" },
  { name: "Grasshopper", value: 44, color: "#f59e0b" },
];

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
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{p.name}:</span>
          <span style={{ color: "white", fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function AnalyticsPanel() {
  const [activeTab, setActiveTab] = useState<"trend" | "hourly" | "dist">("trend");

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
            <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Advanced Analytics</div>
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
          { label: "7D Total", value: "47", color: "#90C67C", sub: "Detections" },
          { label: "Dominant", value: "Caterpillar", color: "#ef4444", sub: "Species" },
          { label: "Peak Hour", value: "14:00", color: "#f59e0b", sub: "Intensity" },
        ].map(({ label, value, color, sub }) => (
          <div
            key={label}
            className="px-5 py-4 rounded-2xl flex-shrink-0 min-w-[140px]"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{label}</div>
            <div className="text-lg font-black tracking-tight" style={{ color }}>{value}</div>
            <div className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-[240px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {activeTab === "trend" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DAILY_DATA} barCategoryGap="35%">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#328E6E" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#328E6E" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="8 8" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", paddingBottom: 20, color: "rgba(255,255,255,0.3)" }}
                  />
                  <Bar dataKey="caterpillar" name="Caterpillar" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="grasshopper" name="Grasshopper" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rat" name="Rat" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === "hourly" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HOURLY_DATA}>
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
                        data={PEST_DIST}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {PEST_DIST.map((entry, index) => (
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
                  {PEST_DIST.map((p) => (
                    <div key={p.name} className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/2 border border-white/5 min-w-[160px]">
                      <div className="w-3 h-3 rounded-full" style={{ background: p.color, boxShadow: `0 0 15px ${p.color}` }} />
                      <div>
                        <div className="text-[10px] font-black text-white uppercase tracking-widest">{p.name}</div>
                        <div className="text-lg font-black mt-0.5" style={{ color: p.color }}>{p.value}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
