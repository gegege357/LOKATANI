import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Maximize2, RefreshCw, AlertTriangle, Eye, Cpu, Signal } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

interface Detection {
  id: string;
  label: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const PEST_DETECTIONS: Detection[] = [
  { id: "d1", label: "Ulat", confidence: 94.2, x: 18, y: 22, w: 22, h: 20, color: "#ef4444" },
  { id: "d2", label: "Ulat", confidence: 87.6, x: 62, y: 45, w: 18, h: 15, color: "#ef4444" },
];

export function LiveCamera() {
  const [activeDetections, setActiveDetections] = useState<Detection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [fps, setFps] = useState(24);
  const [alertPest, setAlertPest] = useState<Detection | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameCount((f) => f + 1);
      setFps(22 + Math.floor(Math.random() * 5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simulate detection cycle
    const cycle = setInterval(() => {
      setIsDetecting(true);
      setTimeout(() => {
        const detected = PEST_DETECTIONS.slice(0, Math.floor(Math.random() * 3) + 1);
        setActiveDetections(detected);
        if (detected.length > 0) setAlertPest(detected[0]);
        setIsDetecting(false);
      }, 800);
    }, 4000);

    // Initial detection
    setTimeout(() => {
      setActiveDetections(PEST_DETECTIONS.slice(0, 2));
      setAlertPest(PEST_DETECTIONS[0]);
    }, 1500);

    return () => clearInterval(cycle);
  }, []);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(13,43,31,0.8)",
        border: "1px solid rgba(144,198,124,0.15)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(144,198,124,0.1)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${C.primary}30` }}>
            <Camera className="w-4 h-4" style={{ color: C.accent }} />
          </div>
          <div>
            <span className="text-sm text-white" style={{ fontWeight: 600 }}>Live Camera Feed</span>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#4ade80" }}
              />
              <span className="text-xs" style={{ color: C.accent, fontSize: 10 }}>LIVE • CAM-01 • Zone A</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
            <Cpu className="w-3 h-3" style={{ color: C.accent }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>AI v2.1</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
            <Signal className="w-3 h-3" style={{ color: "#4ade80" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{fps} fps</span>
          </div>
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.04)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${C.primary}30`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          >
            <Maximize2 className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="relative" style={{ aspectRatio: "16/9", background: "#050e09" }}>
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1772075529477-326466ae250d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoeWRyb3BvbmljJTIwZ3JlZW5ob3VzZSUyMGZhcm0lMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MzIyNTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Live Camera Feed"
          className="w-full h-full object-cover opacity-80"
        />

        {/* Dark overlay for night-vision look */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))",
            mixBlendMode: "multiply",
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(144,198,124,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(144,198,124,0.5) 1px, transparent 1px)`,
            backgroundSize: "10% 10%",
          }}
        />

        {/* Scanning line removed as requested */}

        {/* AI Processing indicator */}
        {/* Bounding Boxes and scanning overlay removed as requested */}

        {/* Camera info overlay */}
        <div
          className="absolute bottom-3 left-3 flex items-center gap-3"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div className="px-2 py-1 rounded-lg text-xs" style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)", fontSize: 10 }}>
            {new Date().toLocaleTimeString("id-ID")}
          </div>
          <div className="px-2 py-1 rounded-lg text-xs" style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)", fontSize: 10 }}>
            Frame #{frameCount.toString().padStart(4, "0")}
          </div>
        </div>

        {/* Detection count overlay */}
        {activeDetections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl"
            style={{
              background: "rgba(239,68,68,0.85)",
              backdropFilter: "blur(4px)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-white"
              />
              <span className="text-white text-xs" style={{ fontWeight: 700, fontSize: 10 }}>
                {activeDetections.length} PEST DETECTED
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Detection badges */}
      <div className="flex items-center gap-2 px-4 py-3 flex-wrap" style={{ borderTop: "1px solid rgba(144,198,124,0.08)" }}>
        <Eye className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Deteksi aktif:</span>
        {activeDetections.length === 0 ? (
          <span className="text-xs" style={{ color: "#4ade80", fontSize: 10 }}>Tidak ada hama terdeteksi</span>
        ) : (
          activeDetections.map((det) => (
            <span
              key={det.id}
              className="px-2 py-0.5 rounded-full text-white"
              style={{ background: det.color + "30", border: `1px solid ${det.color}50`, fontSize: 10, fontWeight: 600 }}
            >
              {det.label} • {det.confidence.toFixed(1)}%
            </span>
          ))
        )}
      </div>
    </div>
  );
}
