import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Shield, Key, CheckCircle, Eye, EyeOff,
  LogOut, Monitor, Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useUserManagement } from "../../context/UserManagementContext";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "profile" | "security";
}

function GoogleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function ProfileModal({ isOpen, onClose, initialTab = "profile" }: ProfileModalProps) {
  const { user, logout } = useAuth();
  const { updateUser } = useUserManagement();

  const [activeTab, setActiveTab] = useState<"profile" | "security">(initialTab);
  const [editName, setEditName] = useState(user?.name || "");
  const [nameSaved, setNameSaved] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const isGoogleUser = !!user?.googleId;

  // Sync tab when prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Sync name when user changes
  useEffect(() => {
    setEditName(user?.name || "");
  }, [user?.name]);

  // =========================================================================
  // [SECURITY: Profile Data Sanitization]
  // Membuang injeksi karakter miring (seperti kode program luar) sebelum diparse 
  // ke backend, menjaga konsistensi database dan integritas identitas.
  // =========================================================================
  const sanitize = (str: string) => str.replace(/[<>'";()]/g, "").trim();

  const handleSaveName = () => {
    const cleanName = sanitize(editName);
    if (user && cleanName && cleanName !== user.name) {
      updateUser(user.id, { name: cleanName });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    }
  };

  const handleChangePassword = () => {
    setPasswordError("");
    const cleanCurrentPassword = sanitize(currentPassword);
    const cleanNewPassword = sanitize(newPassword);
    const cleanConfirmPassword = sanitize(confirmPassword);

    if (!cleanCurrentPassword) { setPasswordError("Masukkan password saat ini yang valid"); return; }
    if (cleanNewPassword.length < 6) { setPasswordError("Password baru minimal 6 karakter (tanpa simbol terlarang)"); return; }
    if (cleanNewPassword !== cleanConfirmPassword) { setPasswordError("Konfirmasi password tidak cocok"); return; }
    
    // Mock success — in production this would call an API
    setPasswordSaved(true);
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const TABS = [
    { id: "profile" as const, label: "Profil Saya", icon: User },
    { id: "security" as const, label: "Keamanan", icon: Shield },
  ];

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
    fontFamily: "'Inter', sans-serif",
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(5px)",
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 16px",
              fontFamily: "'Inter', sans-serif",
              pointerEvents: "none",
            }}
          >
            <div
              className="rounded-3xl overflow-hidden flex flex-col w-full max-w-md"
              style={{
                background: "rgba(10,38,26,0.99)",
                backdropFilter: "blur(40px)",
                border: "1px solid rgba(144,198,124,0.2)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(144,198,124,0.05)",
                maxHeight: "calc(100vh - 48px)",
                pointerEvents: "auto",
              }}
            >
              {/* Header bar */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid rgba(144,198,124,0.1)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}
                  >
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>
                    Pengaturan Akun
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                >
                  <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-6 pt-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-sm transition-all"
                    style={{
                      color: activeTab === id ? C.accent : "rgba(255,255,255,0.4)",
                      background: activeTab === id ? "rgba(144,198,124,0.08)" : "transparent",
                      fontWeight: activeTab === id ? 600 : 400,
                      borderBottom: activeTab === id ? `2px solid ${C.accent}` : "2px solid transparent",
                      fontSize: 13,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="px-6 py-6 overflow-y-auto flex-1" style={{ minHeight: 0 }}>
                {/* ── PROFILE TAB ── */}
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-5"
                  >
                    {/* Avatar + info */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white overflow-hidden flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                          fontWeight: 700,
                          fontSize: 22,
                          boxShadow: `0 8px 24px ${C.primary}60`,
                        }}
                      >
                        {user?.avatar?.startsWith("http") ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(user?.name || "?")
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white truncate" style={{ fontWeight: 700, fontSize: 16 }}>
                          {user?.name}
                        </div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {user?.email}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span
                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: user?.role === "admin" ? `${C.primary}30` : "rgba(255,255,255,0.08)",
                              color: user?.role === "admin" ? C.accent : "rgba(255,255,255,0.5)",
                              fontWeight: 600,
                              fontSize: 10,
                            }}
                          >
                            {user?.role === "admin" ? (
                              <Shield className="w-2.5 h-2.5" />
                            ) : (
                              <User className="w-2.5 h-2.5" />
                            )}
                            {user?.role === "admin" ? "Administrator" : "Monitor User"}
                          </span>
                          {isGoogleUser && (
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: "rgba(66,133,244,0.15)",
                                color: "rgba(130,175,255,0.9)",
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              <GoogleIcon size={10} />
                              Google
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit name */}
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: C.accent, fontWeight: 600 }}>
                        Nama Tampilan
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                          style={inputStyle}
                          onFocus={(e) => (e.target.style.borderColor = C.accent)}
                          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                        />
                        <button
                          onClick={handleSaveName}
                          className="px-4 py-2.5 rounded-xl text-sm text-white transition-all flex items-center gap-1.5"
                          style={{
                            background: nameSaved
                              ? "rgba(74,222,128,0.2)"
                              : `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                            fontWeight: 600,
                            fontSize: 12,
                            minWidth: 76,
                            border: nameSaved ? "1px solid rgba(74,222,128,0.3)" : "none",
                            color: nameSaved ? "#4ade80" : "white",
                          }}
                        >
                          {nameSaved ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Tersimpan
                            </>
                          ) : (
                            "Simpan"
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Read-only fields */}
                    <div className="space-y-3">
                      {[
                        { label: "Email", value: user?.email ?? "" },
                        {
                          label: "Metode Login",
                          value: isGoogleUser ? "Google OAuth" : "Email & Password",
                          prefix: isGoogleUser ? <GoogleIcon size={13} /> : <Key className="w-3.5 h-3.5" />,
                        },
                      ].map(({ label, value, prefix }) => (
                        <div key={label}>
                          <label
                            className="block text-xs mb-1.5"
                            style={{ color: "rgba(255,255,255,0.35)", fontWeight: 600 }}
                          >
                            {label}
                          </label>
                          <div
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.45)",
                            }}
                          >
                            {prefix}
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Logout */}
                    <button
                      onClick={() => { logout(); onClose(); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.18)",
                        color: "rgba(239,68,68,0.75)",
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.16)";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                        e.currentTarget.style.color = "rgba(239,68,68,0.75)";
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar dari Sistem
                    </button>
                  </motion.div>
                )}

                {/* ── SECURITY TAB ── */}
                {activeTab === "security" && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    {/* Google managed notice OR password form */}
                    {isGoogleUser ? (
                      <div
                        className="rounded-2xl p-5 flex items-start gap-3.5"
                        style={{
                          background: "rgba(66,133,244,0.08)",
                          border: "1px solid rgba(66,133,244,0.2)",
                        }}
                      >
                        <GoogleIcon size={20} />
                        <div>
                          <div className="text-sm text-white" style={{ fontWeight: 600 }}>
                            Akun Dikelola Google
                          </div>
                          <div className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                            Keamanan akun Anda dikelola sepenuhnya oleh Google. Untuk mengubah
                            password atau pengaturan keamanan, kunjungi pengaturan akun Google Anda.
                          </div>
                          <a
                            href="https://myaccount.google.com/security"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2.5 text-xs transition-colors"
                            style={{ color: "rgba(130,175,255,0.85)", fontWeight: 600 }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(130,175,255,1)")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(130,175,255,0.85)")}
                          >
                            Buka Pengaturan Google →
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex items-center gap-2.5 mb-4">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ background: `${C.primary}30` }}
                          >
                            <Key className="w-3 h-3" style={{ color: C.accent }} />
                          </div>
                          <div className="text-sm text-white" style={{ fontWeight: 600 }}>
                            Ubah Password
                          </div>
                        </div>

                        <div className="space-y-4">
                          {(
                            [
                              {
                                label: "Password Saat Ini",
                                val: currentPassword,
                                setter: setCurrentPassword,
                                show: showCurrent,
                                toggle: setShowCurrent,
                              },
                              {
                                label: "Password Baru",
                                val: newPassword,
                                setter: setNewPassword,
                                show: showNew,
                                toggle: setShowNew,
                              },
                              {
                                label: "Konfirmasi Password Baru",
                                val: confirmPassword,
                                setter: setConfirmPassword,
                                show: showConfirm,
                                toggle: setShowConfirm,
                              },
                            ] as {
                              label: string;
                              val: string;
                              setter: React.Dispatch<React.SetStateAction<string>>;
                              show: boolean;
                              toggle: React.Dispatch<React.SetStateAction<boolean>>;
                            }[]
                          ).map(({ label, val, setter, show, toggle }) => (
                            <div key={label}>
                              <label
                                className="block text-xs mb-1.5"
                                style={{ color: C.accent, fontWeight: 600 }}
                              >
                                {label}
                              </label>
                              <div className="relative">
                                <input
                                  type={show ? "text" : "password"}
                                  value={val}
                                  onChange={(e) => setter(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                                  style={inputStyle}
                                  onFocus={(e) => (e.target.style.borderColor = C.accent)}
                                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                                />
                                <button
                                  type="button"
                                  onClick={() => toggle(!show)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                  style={{ color: "rgba(255,255,255,0.3)" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                                >
                                  {show ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {passwordError && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 text-xs rounded-xl px-3 py-2"
                            style={{
                              background: "rgba(239,68,68,0.12)",
                              color: "#fca5a5",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }}
                          >
                            {passwordError}
                          </motion.div>
                        )}

                        {passwordSaved && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 text-xs rounded-xl px-3 py-2 flex items-center gap-2"
                            style={{
                              background: "rgba(74,222,128,0.12)",
                              color: "#4ade80",
                              border: "1px solid rgba(74,222,128,0.2)",
                            }}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Password berhasil diubah!
                          </motion.div>
                        )}

                        <button
                          onClick={handleChangePassword}
                          className="mt-4 w-full py-2.5 rounded-xl text-sm text-white transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                            fontWeight: 600,
                            boxShadow: `0 6px 20px ${C.primary}40`,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                        >
                          Perbarui Password
                        </button>
                      </div>
                    )}

                    {/* Active session */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: `${C.primary}30` }}
                        >
                          <Monitor className="w-3 h-3" style={{ color: C.accent }} />
                        </div>
                        <div className="text-sm text-white" style={{ fontWeight: 600 }}>
                          Sesi Aktif
                        </div>
                      </div>
                      <div
                        className="rounded-xl p-4 flex items-center justify-between"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Monitor className="w-4 h-4" style={{ color: C.accent }} />
                          <div>
                            <div className="text-xs text-white" style={{ fontWeight: 600 }}>
                              Browser Saat Ini
                            </div>
                            <div
                              className="text-xs mt-0.5 flex items-center gap-1"
                              style={{ color: "rgba(255,255,255,0.35)" }}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              Login baru saja
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "#4ade80" }}
                          />
                          <span
                            style={{ color: "#4ade80", fontWeight: 700, fontSize: 9 }}
                          >
                            AKTIF
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}s
    </AnimatePresence>,
    document.body
  );
}
