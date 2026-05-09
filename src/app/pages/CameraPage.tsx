import React, { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Grid3X3, Maximize2, Settings2 } from "lucide-react";
import { LiveCamera } from "../components/dashboard/LiveCamera";
import { AIConfidenceMeter } from "../components/dashboard/AIConfidenceMeter";
import { ActivityTimeline } from "../components/dashboard/ActivityTimeline";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

const CAMERAS = ["CAM-01 Zone A", "CAM-02 Zone B", "CAM-03 Zone C", "CAM-04 Zone D"];

export function CameraPage() {
  const [activeCamera, setActiveCamera] = useState(0);
  const [viewMode, setViewMode] = useState<"single" | "grid">("single");

  return (
    <div className="px-4 lg:px-6 py-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>Live Camera Monitor</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>4 kamera aktif • AI Detection enabled</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("single")}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: viewMode === "single" ? `${C.primary}40` : "rgba(255,255,255,0.05)", border: `1px solid ${viewMode === "single" ? C.primary + "60" : "rgba(255,255,255,0.08)"}` }}
          >
            <Maximize2 className="w-3.5 h-3.5" style={{ color: viewMode === "single" ? C.accent : "rgba(255,255,255,0.4)" }} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: viewMode === "grid" ? `${C.primary}40` : "rgba(255,255,255,0.05)", border: `1px solid ${viewMode === "grid" ? C.primary + "60" : "rgba(255,255,255,0.08)"}` }}
          >
            <Grid3X3 className="w-3.5 h-3.5" style={{ color: viewMode === "grid" ? C.accent : "rgba(255,255,255,0.4)" }} />
          </button>
        </div>
      </div>

      {/* Camera tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {CAMERAS.map((cam, i) => (
          <button
            key={cam}
            onClick={() => setActiveCamera(i)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-all"
            style={{
              background: activeCamera === i ? `${C.primary}30` : "rgba(255,255,255,0.04)",
              border: `1px solid ${activeCamera === i ? C.primary + "60" : "rgba(255,255,255,0.08)"}`,
              color: activeCamera === i ? C.accent : "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontWeight: activeCamera === i ? 600 : 400,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? "#ef4444" : "#4ade80" }} />
            {cam}
          </button>
        ))}
      </div>

      {viewMode === "single" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <LiveCamera />
          </div>
          <div className="flex flex-col gap-4">
            <AIConfidenceMeter />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAMERAS.map((cam, i) => (
            <motion.div
              key={cam}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(144,198,124,0.15)", background: "rgba(13,43,31,0.8)" }}
            >
              <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(144,198,124,0.08)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? "#ef4444" : "#4ade80" }} />
                  <span className="text-xs text-white" style={{ fontWeight: 600 }}>{cam}</span>
                </div>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>LIVE</span>
              </div>
              <div
                className="w-full relative"
                style={{ aspectRatio: "16/9", background: "#050e09" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1772075529477-326466ae250d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
                  alt={cam}
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  {i === 0 && (
                    <div className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: "rgba(239,68,68,0.7)" }}>
                      PEST DETECTED
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <ActivityTimeline />
      </div>
    </div>
  );
}
