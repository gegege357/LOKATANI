import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, ChevronDown, LogOut, User, Shield, X, Clock, AlertTriangle, Info, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { ProfileModal } from "./ProfileModal";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
  bg: "#E1EEBC",
};

function formatRelTime(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  return `${Math.floor(diff / 3600)}j lalu`;
}

export function Header() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead, sendDigestEmail, emailSending } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<"profile" | "security">("profile");
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const severityIcon = (s: string) => {
    if (s === "critical") return <AlertTriangle className="w-3 h-3" style={{ color: "#ef4444" }} />;
    if (s === "warning") return <Zap className="w-3 h-3" style={{ color: "#f59e0b" }} />;
    return <Info className="w-3 h-3" style={{ color: C.accent }} />;
  };

  const severityColor = (s: string) => {
    if (s === "critical") return "rgba(239,68,68,0.15)";
    if (s === "warning") return "rgba(245,158,11,0.15)";
    return "rgba(144,198,124,0.15)";
  };

  return (
    <header
      className="flex items-center gap-4 px-6 h-16 flex-shrink-0 relative z-40"
      style={{
        background: "rgba(13,43,31,0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(144,198,124,0.1)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Page title area */}
      <div className="flex items-center gap-2 mr-auto">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          <Clock className="w-3.5 h-3.5" />
          <span id="live-time">{new Date().toLocaleString("id-ID", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ background: "#4ade80" }}
          />
          <span className="text-xs" style={{ color: C.accent, fontWeight: 600 }}>LIVE</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative hidden sm:block">
        <motion.div
          animate={{ width: searchFocus ? 260 : 220 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            placeholder="Cari deteksi, hama..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${searchFocus ? C.secondary + "50" : "rgba(255,255,255,0.08)"}`,
              color: "white",
              fontFamily: "'Inter', sans-serif",
              transition: "border-color 0.2s",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
            </button>
          )}
        </motion.div>
      </div>

      {/* Notification */}
      <div className="relative" ref={notifRef}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: showNotif ? `${C.primary}30` : "rgba(255,255,255,0.05)",
            border: `1px solid ${showNotif ? C.primary + "60" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          <Bell className="w-4 h-4" style={{ color: unreadCount > 0 ? C.accent : "rgba(255,255,255,0.5)" }} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white"
              style={{ background: "#ef4444", fontSize: 10, fontWeight: 700 }}
            >
              {unreadCount}
            </motion.span>
          )}
        </motion.button>

        <AnimatePresence>
          {showNotif && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-3 right-3 top-[68px] sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-80 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(13,43,31,0.98)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(144,198,124,0.2)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                zIndex: 9999,
              }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(144,198,124,0.1)" }}>
                <span className="text-sm text-white" style={{ fontWeight: 600 }}>Notifikasi</span>
                <div className="flex gap-3">
                  <button onClick={sendDigestEmail} disabled={emailSending} className="text-xs transition-colors" style={{ color: C.accent, fontWeight: 600 }}>
                    {emailSending ? "Mengirim..." : "Kirim ke Email"}
                  </button>
                  <button onClick={markAllRead} className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Tandai dibaca
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 5).map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => markRead(n.id)}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-all"
                    style={{
                      background: n.read ? "transparent" : severityColor(n.severity),
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : severityColor(n.severity))}
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                      {severityIcon(n.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white" style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{n.message}</div>
                      <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>{formatRelTime(n.timestamp)}</div>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: C.accent }} />}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile */}
      <div className="relative" ref={profileRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
          style={{
            background: showProfile ? `${C.primary}30` : "rgba(255,255,255,0.05)",
            border: `1px solid ${showProfile ? C.primary + "60" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, fontWeight: 700 }}
          >
            {user?.avatar?.startsWith('http') ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : user?.avatar ? (
              user.avatar
            ) : (
              user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs text-white" style={{ fontWeight: 600, lineHeight: 1.2 }}>{user?.name}</div>
            <div className="text-xs" style={{ color: user?.role === "admin" ? C.accent : "rgba(255,255,255,0.4)", fontSize: 10 }}>
              {user?.role === "admin" ? "Admin" : "User"}
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 hidden md:block" style={{ color: "rgba(255,255,255,0.3)" }} />
        </motion.button>

        <AnimatePresence>
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-3 right-3 top-[68px] sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-52 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(13,43,31,0.98)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(144,198,124,0.2)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                zIndex: 9999,
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(144,198,124,0.1)" }}>
                <div className="text-sm text-white" style={{ fontWeight: 600 }}>{user?.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{user?.email}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Shield className="w-3 h-3" style={{ color: C.accent }} />
                  <span className="text-xs" style={{ color: C.accent, fontWeight: 600 }}>
                    {user?.role === "admin" ? "Administrator" : "Monitor User"}
                  </span>
                </div>
              </div>
              {[
                { icon: User, label: "Profil Saya", tab: "profile" as const },
                { icon: Shield, label: "Keamanan", tab: "security" as const },
              ].map(({ icon: Icon, label, tab }) => (
                <button
                  key={label}
                  onClick={() => {
                    setProfileModalTab(tab);
                    setProfileModalOpen(true);
                    setShowProfile(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
              <div style={{ borderTop: "1px solid rgba(144,198,124,0.1)" }}>
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all"
                  style={{ color: "rgba(239,68,68,0.7)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(239,68,68,0.7)";
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialTab={profileModalTab}
      />
    </header>
  );
}
