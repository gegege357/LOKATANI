import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Lock, Shield, Eye, EyeOff } from "lucide-react";
import { useUserManagement } from "../../context/UserManagementContext";
import { UserRole } from "../../context/AuthContext";

const C = { primary: "#328E6E", secondary: "#67AE6E", accent: "#90C67C" };

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editUserId?: string | null;
}

export function UserModal({ isOpen, onClose, editUserId }: UserModalProps) {
  const { addUser, updateUser, getUserById } = useUserManagement();
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as UserRole,
    googleAuth: false,
  });

  const isEditMode = !!editUserId;
  const editUser = editUserId ? getUserById(editUserId) : null;

  useEffect(() => {
    if (isEditMode && editUser) {
      setFormData({
        name: editUser.name,
        email: editUser.email,
        password: editUser.password || "",
        role: editUser.role,
        googleAuth: !editUser.password, // jika tidak ada password, berarti Google auth
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        googleAuth: false,
      });
    }
  }, [isEditMode, editUser, editUserId]);

  // =========================================================================
  // [SECURITY: Anti-XSS & Anti-Injection]
  // Pembersihan karakter terlarang dari isian Form yang diketik admin sebelum 
  // direkam ke dalam database, menghindari User Baru bertipe <script>malicious</script>
  // =========================================================================
  const sanitize = (str: string) => str.replace(/[<>'";()]/g, "").trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanName = sanitize(formData.name);
    const cleanEmail = sanitize(formData.email);
    const cleanPassword = sanitize(formData.password);

    if (!cleanName || !cleanEmail || (!formData.googleAuth && !isEditMode && !cleanPassword)) {
      alert("Silakan isi semua kolom dengan karakter yang valid.");
      return;
    }
    
    if (isEditMode && editUserId) {
      // Update existing user
      updateUser(editUserId, {
        name: cleanName,
        email: cleanEmail,
        role: formData.role,
        ...(cleanPassword && !formData.googleAuth ? { password: cleanPassword } : {}),
      });
    } else {
      // Add new user
      addUser({
        name: cleanName,
        email: cleanEmail,
        role: formData.role,
        ...(formData.googleAuth ? {} : { password: cleanPassword }),
      });
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9997,
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
            maxWidth: 448,
            maxHeight: "calc(100vh - 48px)",
            display: "flex",
            flexDirection: "column",
            borderRadius: 24,
            overflow: "hidden",
            background: "rgba(13,43,31,0.95)",
            border: "1px solid rgba(144,198,124,0.2)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div className="px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-lg" style={{ fontWeight: 700 }}>
                  {isEditMode ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {isEditMode ? "Perbarui informasi pengguna" : "Buat akun pengguna baru untuk sistem"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: "rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>
          </div>

          {/* Form - scrollable */}
          <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
            <form action="#" onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Masukkan nama lengkap"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.accent;
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.accent;
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                  />
                </div>
              </div>

              {/* Google Auth Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <div>
                    <div className="text-xs text-white" style={{ fontWeight: 600 }}>Google OAuth</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>
                      {formData.googleAuth ? "Menggunakan login Google" : "Gunakan password manual"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, googleAuth: !formData.googleAuth })}
                  className="relative w-11 h-6 rounded-full transition-all"
                  style={{ background: formData.googleAuth ? C.primary : "rgba(255,255,255,0.1)" }}
                >
                  <motion.div
                    animate={{ x: formData.googleAuth ? 20 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
                  />
                </button>
              </div>

              {/* Password - hanya jika tidak Google Auth */}
              {!formData.googleAuth && (
                <div>
                  <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                    Password {isEditMode && "(kosongkan jika tidak ingin mengubah)"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!isEditMode}
                      placeholder="Masukkan password"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = C.accent;
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                      ) : (
                        <Eye className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Role Pengguna
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "admin", label: "Administrator", icon: Shield, desc: "Full access" },
                    { value: "user", label: "Monitor User", icon: User, desc: "View only" },
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: value as UserRole })}
                      className="p-3 rounded-xl transition-all text-left"
                      style={{
                        background: formData.role === value ? `${C.primary}30` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${formData.role === value ? C.accent : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <Icon
                        className="w-4 h-4 mb-2"
                        style={{ color: formData.role === value ? C.accent : "rgba(255,255,255,0.4)" }}
                      />
                      <div className="text-xs text-white mb-0.5" style={{ fontWeight: 600, fontSize: 11 }}>{label}</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
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
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm text-white transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                    fontWeight: 600,
                    boxShadow: `0 4px 12px ${C.primary}40`,
                  }}
                >
                  {isEditMode ? "Simpan Perubahan" : "Tambah Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
