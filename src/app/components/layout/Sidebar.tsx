import React, { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, HardDrive, History, BarChart3, Settings,
  ChevronLeft, ChevronRight, Users, LogOut, Shield
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import logoImage from "../../../assets/logo-2.png";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
  bg: "#E1EEBC",
};

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/devices", label: "Perangkat", icon: HardDrive },
  { path: "/history", label: "Detection History", icon: History },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings, adminOnly: true },
  { path: "/users", label: "User Management", icon: Users, adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen flex flex-col relative z-20 flex-shrink-0"
      style={{
        background: "linear-gradient(180deg, #0d2b1f 0%, #1a4a30 60%, #0d2b1f 100%)",
        borderRight: "1px solid rgba(144,198,124,0.12)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-4 py-5 relative"
        style={{ borderBottom: "1px solid rgba(144,198,124,0.1)" }}
      >
        <motion.div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
            boxShadow: `0 0 20px ${C.primary}40`,
          }}
        >
          <img src={logoImage} alt="Lokatani Guard Logo" className="w-6 h-6 object-contain" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="ml-3 overflow-hidden"
            >
              <div className="text-white" style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>Lokatani Guard</div>
              <div className="text-xs" style={{ color: C.accent, fontWeight: 500 }}>AI Pest Detection</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all z-30"
          style={{
            background: C.primary,
            border: `2px solid rgba(144,198,124,0.3)`,
            color: "white",
            boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
          }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* System Status Indicator */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mt-3 rounded-xl px-3 py-2"
            style={{ background: "rgba(50,142,110,0.15)", border: "1px solid rgba(50,142,110,0.25)" }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: "#4ade80" }}
              />
              <span className="text-xs" style={{ color: C.accent, fontWeight: 600 }}>System Online</span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>All sensors active</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/");
          return (
            <NavLink key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 3 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group cursor-pointer"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${C.primary}40, ${C.secondary}20)`
                    : "transparent",
                  borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "rgba(144,198,124,0.08)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <div className="relative flex-shrink-0">
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isActive ? C.accent : "rgba(255,255,255,0.5)" }}
                  />
                  {item.badge && !collapsed && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                      style={{ background: "#ef4444", fontSize: 9, fontWeight: 700 }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm whitespace-nowrap flex-1"
                      style={{
                        color: isActive ? "white" : "rgba(255,255,255,0.6)",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.adminOnly && !collapsed && (
                  <Shield className="w-3 h-3 flex-shrink-0" style={{ color: C.accent + "80" }} />
                )}
                {/* Tooltip for collapsed */}
                {collapsed && (
                  <div
                    className="absolute left-full ml-3 px-2 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                    style={{
                      background: "#1a4a30",
                      border: "1px solid rgba(144,198,124,0.2)",
                      color: "white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div
        className="px-3 py-4"
        style={{ borderTop: "1px solid rgba(144,198,124,0.1)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
              fontWeight: 700,
            }}
          >
            {user?.avatar?.startsWith('http') ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.avatar
            )}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div className="text-sm text-white truncate" style={{ fontWeight: 600 }}>
                  {user?.name}
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: user?.role === "admin" ? C.accent : "rgba(255,255,255,0.4)" }}
                >
                  {user?.role === "admin" ? "Administrator" : "Monitor User"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={logout}
                className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
