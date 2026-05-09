import React from "react";
import { BarChart3 } from "lucide-react";
import { AnalyticsPanel } from "../components/dashboard/AnalyticsPanel";
import { StatusCards } from "../components/dashboard/StatusCards";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const C = { primary: "#328E6E", secondary: "#67AE6E", accent: "#90C67C" };

const WEEKLY_DATA = [
  { week: "W1 Feb", total: 18 }, { week: "W2 Feb", total: 24 },
  { week: "W3 Feb", total: 15 }, { week: "W4 Feb", total: 31 },
  { week: "W1 Mar", total: 27 }, { week: "W2 Mar", total: 22 },
  { week: "W3 Mar", total: 19 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "#0d2b1f", border: "1px solid rgba(144,198,124,0.2)", fontFamily: "'Inter', sans-serif" }}>
      <div className="text-xs text-white mb-1" style={{ fontWeight: 600 }}>{label}</div>
      <div className="text-xs" style={{ color: C.accent }}>Total: <strong>{payload[0].value}</strong> deteksi</div>
    </div>
  );
};

const SUMMARY_CARDS = [
  { label: "Total Deteksi", value: "125", sub: "7 minggu terakhir", color: C.accent },
  { label: "Caterpillar", value: "70", sub: "56% dari total", color: "#ef4444" },
  { label: "Grasshopper", value: "55", sub: "44% dari total", color: "#f59e0b" },
];

export function AnalyticsPage() {
  return (
    <div className="px-4 lg:px-6 py-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>Analytics & Reports</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Analisis mendalam deteksi hama sistem hidroponik</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {SUMMARY_CARDS.map((stat, i) => (
          
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-4"
            style={{ background: "rgba(13,43,31,0.8)", border: `1px solid ${stat.color}25` }}
          >
            <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{stat.label}</div>
            <div className="text-2xl text-white" style={{ fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Weekly trend */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(13,43,31,0.8)", border: "1px solid rgba(144,198,124,0.15)" }}>
        <h3 className="text-sm text-white mb-4" style={{ fontWeight: 600 }}>Tren Deteksi Mingguan</h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={WEEKLY_DATA}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.primary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke={C.accent} strokeWidth={2} fill="url(#wGrad)" dot={{ fill: C.accent, r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AnalyticsPanel />
    </div>
  );
}
