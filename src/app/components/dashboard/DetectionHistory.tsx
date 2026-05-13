import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, ChevronLeft, ChevronRight, Bug, Filter, Download } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import * as XLSX from "xlsx";
import { supabase } from "../../../lib/supabase";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

interface Detection {
  id: string;
  timestamp: string;
  pest: string;
  confidence: number;
  zone: string;
  camera: string;
  image: string;
  count: number;
  rcwl_validated: boolean;
}

const PEST_IMAGES: Record<string, string> = {
  Caterpillar: "https://images.unsplash.com/photo-1763745364956-fec424842235?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100",
  Grasshopper: "https://images.unsplash.com/photo-1727850248657-29d04eceacca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100",
  ulat: "https://images.unsplash.com/photo-1763745364956-fec424842235?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100", // Fallback for raspi
};

// DUMMY DATA FALLBACK
const DUMMY_DETECTIONS: Detection[] = [];



const PER_PAGE = 10;

const exportToExcel = (data: Detection[], filterType: string) => {
  const excelData = data.map((det) => ({
    "Timestamp": det.timestamp,
    "Hama": det.pest,
    "Confidence (%)": det.confidence,
    "Zona": det.zone,
    "Kamera": det.camera,

    "Gambar URL": det.image,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  const colWidths = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
    { wch: 30 },
  ];
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Detection History");

  const timestamp = new Date().toISOString().split('T')[0];
  const filterName = filterType === "all" ? "Semua" : filterType;
  const filename = `Detection_History_${filterName}_${timestamp}.xlsx`;

  XLSX.writeFile(wb, filename);
};

export function DetectionHistory() {
  const [page, setPage] = useState(0);
  const [filterPest, setFilterPest] = useState("all");
  const [detections, setDetections] = useState<Detection[]>(DUMMY_DETECTIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fungsi untuk mengubah data dari Supabase ke format tabel
    const mapSupabaseToDetection = (data: any): Detection => {
      // Format tanggal "2026-05-02T14:30:45.123Z" -> "02 May 2026 14:30:45"
      const date = new Date(data.timestamp);
      const formattedDate = date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit', second:'2-digit' }).replace(/,/g, '');

      return {
        id: data.id || Math.random().toString(),
        timestamp: formattedDate,
        pest: data.pest_type === "Caterpillar" ? "Ulat" : (data.pest_type || "Unknown"),
        confidence: data.confidence ? Math.round(data.confidence * 100) : 0, // 0.87 -> 87
        zone: data.camera_location || "Unknown Zone",
        camera: data.rpi_hostname || "Unknown Camera",
        count: data.count || 1,
        rcwl_validated: data.rcwl_validated || false,
        image: data.image_url || PEST_IMAGES[data.pest_type] || PEST_IMAGES.Caterpillar,
      };
    };

    const fetchDetections = async () => {
      try {
        const todayIso = new Date(new Date().setHours(0,0,0,0)).toISOString();
        const { data, error } = await supabase
          .from("pest_detection")
          .select("*")
          .eq("record_type", "detection")
          .gte("timestamp", todayIso)
          .neq("rpi_hostname", "USEP")
          .neq("pest_type", "Whitefly")
          .neq("pest_type", "Aphid")
          .neq("pest_type", "Grasshopper")
          .order("timestamp", { ascending: false });

        if (error) {
          console.warn("Table pest_detection not found or error.", error);
          setDetections([]);
        } else if (data && data.length > 0) {
          const mappedData = data.map(mapSupabaseToDetection);
          setDetections(mappedData);
        } else {
          setDetections([]); 
        }
      } catch (err) {
        console.warn("Fetch failed.", err);
        setDetections([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetections();

    // Subscribe to realtime inserts
    const channel = supabase
      .channel("pest_detection_history")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pest_detection" },
        (payload) => {
          const row = payload.new as any;
          const todayIso = new Date(new Date().setHours(0,0,0,0)).toISOString();
          
          // Only show detection records, not heartbeats, not Whitefly/Aphid/Grasshopper, not USEP, and only from today
          if (row.record_type !== "detection" || row.rpi_hostname === "USEP" || row.pest_type === "Whitefly" || row.pest_type === "Aphid" || row.pest_type === "Grasshopper" || row.timestamp < todayIso) return;
          const newDetection = mapSupabaseToDetection(row);
          setDetections((prev) => {
            return [newDetection, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = filterPest === "all" ? detections : detections.filter((d) => d.pest.toLowerCase() === filterPest.toLowerCase());
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  // Ambil list unik dari pests yang ada di data untuk tombol filter
  const uniquePests = ["all", ...Array.from(new Set(detections.map(d => d.pest)))];

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(50, 142, 110, 0.15)", border: "1px solid rgba(50, 142, 110, 0.2)" }}>
              <History className="w-5 h-5 text-[#90C67C]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase opacity-90">Detection History</h3>
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Logging & Audit</div>
            </div>
          </div>
          <button
            onClick={() => exportToExcel(filtered, filterPest)}
            className="h-10 px-4 rounded-xl flex items-center gap-2 transition-all hover:scale-105 group"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Download className="w-4 h-4 text-white/40 group-hover:text-[#90C67C] transition-colors" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">Export</span>
          </button>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/5 w-fit flex-wrap">
          {uniquePests.slice(0, 4).map((f) => ( // Batasi maksimal 4 tombol filter agar UI rapi
            <button
              key={f}
              onClick={() => { setFilterPest(f); setPage(0); }}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
              style={{
                background: filterPest.toLowerCase() === f.toLowerCase() ? "#328E6E" : "transparent",
                color: filterPest.toLowerCase() === f.toLowerCase() ? "white" : "rgba(255,255,255,0.3)",
                boxShadow: filterPest.toLowerCase() === f.toLowerCase() ? "0 4px 12px rgba(50, 142, 110, 0.3)" : "none",
              }}
            >
              {f === "all" ? "All Species" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr>
              {["Asset", "Inference Info", "Confidence"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-white/40 text-xs">Loading detections...</td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-white/40 text-xs">No data available</td>
              </tr>
            ) : (
              paged.map((det, i) => {

                return (
                  <motion.tr
                    key={det.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group"
                  >
                    <td className="py-2 pl-2 pr-4 bg-white/2 rounded-l-2xl border-y border-l border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                          <ImageWithFallback src={det.image} alt={det.pest} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white uppercase tracking-tight">
                            {det.pest} <span className="text-white/40 ml-1">({det.count})</span>
                          </div>
                          <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">{det.camera}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 bg-white/2 border-y border-white/5">
                      <div className="text-xs font-bold text-white/60">{det.timestamp.split(" ").slice(-1)[0]}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="text-[10px] text-white/20 font-medium">{det.zone}</div>
                        {det.rcwl_validated && (
                          <div className="px-1.5 py-0.5 rounded border border-[#4ade80]/30 bg-[#4ade80]/10 text-[8px] font-black text-[#4ade80] uppercase tracking-widest">RCWL</div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4 bg-white/2 rounded-r-2xl border-y border-r border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{det.confidence}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${det.confidence}%`,
                              background: det.confidence >= 90 ? "#4ade80" : det.confidence >= 75 ? "#f59e0b" : "#ef4444",
                              boxShadow: `0 0 10px ${det.confidence >= 90 ? "#4ade8040" : det.confidence >= 75 ? "#f59e0b40" : "#ef444440"}`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
          Showing <span className="text-white/40">{paged.length}</span> of <span className="text-white/40">{filtered.length}</span> inferences
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 text-white/40 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all duration-300"
                style={{
                  background: i === page ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  color: i === page ? "white" : "rgba(255, 255, 255, 0.2)",
                  border: `1px solid ${i === page ? "rgba(255, 255, 255, 0.1)" : "transparent"}`,
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1 || totalPages === 0}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 text-white/40 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

