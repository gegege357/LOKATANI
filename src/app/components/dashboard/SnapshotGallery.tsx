import React, { useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Images, X, ZoomIn } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

const SNAPSHOTS = [
  {
    id: "s1", pest: "Caterpillar", confidence: 94.2, time: "14:22",
    image: "https://images.unsplash.com/photo-1763745364956-fec424842235?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
    color: "#ef4444",
  },
  {
    id: "s2", pest: "Grasshopper", confidence: 88.7, time: "13:45",
    image: "https://images.unsplash.com/photo-1727850248657-29d04eceacca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
    color: "#f59e0b",
  },
  {
    id: "s3", pest: "Caterpillar", confidence: 91.5, time: "12:30",
    image: "https://images.unsplash.com/photo-1744451472267-ae65e6e51096?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
    color: "#ef4444",
  },
  {
    id: "s4", pest: "Grasshopper", confidence: 83.9, time: "09:52",
    image: "https://images.unsplash.com/photo-1623413649787-d7c0c07b4f3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
    color: "#f59e0b",
  },
];

export function SnapshotGallery() {
  const [selected, setSelected] = useState<typeof SNAPSHOTS[0] | null>(null);

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
            <Images className="w-5 h-5 text-[#90C67C]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase opacity-90">Detection Snapshots</h3>
            <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Asset Gallery</div>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5">
          <span className="text-[10px] font-black text-[#90C67C] uppercase tracking-widest">
            {SNAPSHOTS.length} Assets
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {SNAPSHOTS.map((snap, i) => (
          <motion.div
            key={snap.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            onClick={() => setSelected(snap)}
            className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-2xl"
            style={{
              aspectRatio: "1/1",
              border: `1px solid rgba(255, 255, 255, 0.05)`,
            }}
          >
            <ImageWithFallback
              src={snap.image}
              alt={snap.pest}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center"
              style={{ background: "rgba(13, 43, 31, 0.4)", backdropFilter: "blur(2px)" }}
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Label */}
            <div
              className="absolute bottom-0 left-0 right-0 p-3"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-white text-[10px] font-black uppercase tracking-tight">{snap.pest}</span>
                <span className="text-[10px] font-black" style={{ color: snap.color }}>{snap.confidence}%</span>
              </div>
              <div className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">{snap.time} • Camera Link</div>
            </div>

            {/* Bounding box hint */}
            <div
              className="absolute border-2 rounded opacity-40 group-hover:opacity-100 transition-opacity"
              style={{
                top: "20%", left: "15%", width: "45%", height: "45%",
                borderColor: snap.color,
                boxShadow: `0 0 15px ${snap.color}40`,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      {ReactDOM.createPortal(
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative rounded-3xl overflow-hidden w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
                style={{ maxWidth: 500, border: `1px solid rgba(255, 255, 255, 0.1)` }}
              >
                <ImageWithFallback src={selected.image} alt={selected.pest} className="w-full" />
                
                {/* Info Panel in Lightbox */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none">
                  <div className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex flex-col gap-1">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Live Inference</span>
                    <span className="text-lg font-black text-white tracking-tight">{selected.pest}</span>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-center">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-1">Match</span>
                    <span className="text-lg font-black" style={{ color: selected.color }}>{selected.confidence}%</span>
                  </div>
                </div>

                {/* Bounding box */}
                <div
                  className="absolute border-2 rounded-lg"
                  style={{
                    top: "20%", left: "15%", width: "45%", height: "45%",
                    borderColor: selected.color,
                    boxShadow: `0 0 30px ${selected.color}60`,
                  }}
                />

                <button
                  onClick={() => setSelected(null)}
                  className="absolute bottom-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all pointer-events-auto"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
