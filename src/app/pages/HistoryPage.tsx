import React from "react";
import { History } from "lucide-react";
import { DetectionHistory } from "../components/dashboard/DetectionHistory";
import { SnapshotGallery } from "../components/dashboard/SnapshotGallery";

const C = { primary: "#328E6E", secondary: "#67AE6E", accent: "#90C67C" };

export function HistoryPage() {
  return (
    <div className="px-4 lg:px-6 py-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
          <History className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>Detection History</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Log semua deteksi hama yang tercatat sistem</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DetectionHistory />
        </div>
        <div>
          <SnapshotGallery />
        </div>
      </div>
    </div>
  );
}
