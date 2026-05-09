import React from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

const C = { primary: "#328E6E", secondary: "#67AE6E", accent: "#90C67C" };

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, userName }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 384,
            borderRadius: 24,
            overflow: "hidden",
            background: "rgba(13,43,31,0.95)",
            border: "1px solid rgba(239,68,68,0.3)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.15)" }}
              >
                <AlertTriangle className="w-7 h-7" style={{ color: "#ef4444" }} />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h3 className="text-white text-lg mb-2" style={{ fontWeight: 700 }}>
                Hapus Pengguna?
              </h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Apakah Anda yakin ingin menghapus <span style={{ color: C.accent, fontWeight: 600 }}>{userName}</span>?
                <br />
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl text-sm text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(239,68,68,0.4)",
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
