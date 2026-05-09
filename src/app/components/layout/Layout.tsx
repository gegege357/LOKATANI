import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, NavLink, useNavigate } from "react-router";
import { LayoutDashboard, HardDrive, History, BarChart3, Settings, Users, MoreHorizontal, X, Shield, ChevronRight } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "../../context/AuthContext";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
  bg: "#E1EEBC",
};

const MAIN_NAV = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/devices", label: "Perangkat", icon: HardDrive },
  { path: "/history", label: "History", icon: History },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
];

const ADMIN_MORE_NAV = [
  { path: "/users", label: "User Management", icon: Users, desc: "Kelola akun pengguna" },
  { path: "/settings", label: "Settings", icon: Settings, desc: "Konfigurasi sistem" },
];

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const moreRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin";

  // Active state termasuk More drawer items
  const isMoreActive = isAdmin && ADMIN_MORE_NAV.some(
    (item) => location.pathname === item.path
  );

  // Close more drawer jika klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    if (showMore) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMore]);

  // Close more drawer jika navigasi
  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0a2218", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Sidebar - hidden on mobile, collapsible on tablet */}
      <div className="hidden md:flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Scrollable content area */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0"
          style={{
            background: "linear-gradient(135deg, #0a2218 0%, #0d2b1f 50%, #091c13 100%)",
          }}
        >
          {/* Background pattern */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, rgba(50,142,110,0.05) 0%, transparent 50%),
                                radial-gradient(circle at 80% 80%, rgba(103,174,110,0.04) 0%, transparent 50%)`,
              zIndex: 0,
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(144,198,124,0.02) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(144,198,124,0.02) 1px, transparent 1px)`,
              backgroundSize: "80px 80px",
              zIndex: 0,
            }}
          />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div ref={moreRef} className="fixed bottom-0 left-0 right-0 md:hidden" style={{ zIndex: 40 }}>

        {/* More Drawer (admin only) — muncul di atas nav bar */}
        {isAdmin && showMore && (
          <div
            className="mx-3 mb-2 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(10,30,20,0.98)",
              border: "1px solid rgba(144,198,124,0.2)",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(144,198,124,0.1)" }}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" style={{ color: C.accent }} />
                <span className="text-xs" style={{ color: C.accent, fontWeight: 700 }}>
                  Menu Admin
                </span>
              </div>
              <button
                onClick={() => setShowMore(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>

            {/* Menu items */}
            <div className="p-2 flex flex-col gap-1">
              {ADMIN_MORE_NAV.map(({ path, label, icon: Icon, desc }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => { navigate(path); setShowMore(false); }}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all text-left"
                    style={{
                      background: isActive
                        ? `rgba(50,142,110,0.2)`
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? "rgba(144,198,124,0.3)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isActive ? `${C.primary}40` : "rgba(255,255,255,0.06)",
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{ color: isActive ? C.accent : "rgba(255,255,255,0.45)" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm"
                        style={{
                          color: isActive ? C.accent : "rgba(255,255,255,0.8)",
                          fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        {label}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {desc}
                      </div>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: isActive ? C.accent : "rgba(255,255,255,0.2)" }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom nav bar */}
        <nav
          className="flex"
          style={{
            background: "rgba(13,43,31,0.97)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(144,198,124,0.15)",
          }}
        >
          {/* 4 main items */}
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === "/dashboard" && location.pathname === "/");
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative"
                style={{ color: isActive ? C.accent : "rgba(255,255,255,0.3)" }}
              >
                {isActive && (
                  <div
                    className="absolute top-0 w-8 h-0.5 rounded-full"
                    style={{ background: C.accent }}
                  />
                )}
                <Icon className="w-5 h-5" />
                <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400 }}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* More button — admin only, untuk Users & Settings */}
          {isAdmin ? (
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative"
              style={{ color: (showMore || isMoreActive) ? C.accent : "rgba(255,255,255,0.3)" }}
            >
              {isMoreActive && !showMore && (
                <div
                  className="absolute top-0 w-8 h-0.5 rounded-full"
                  style={{ background: C.accent }}
                />
              )}
              {/* Badge dot jika salah satu active */}
              <div className="relative">
                <MoreHorizontal className="w-5 h-5" />
                {isMoreActive && (
                  <div
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                    style={{ background: C.accent }}
                  />
                )}
              </div>
              <span style={{ fontSize: 9, fontWeight: (showMore || isMoreActive) ? 600 : 400 }}>
                Lainnya
              </span>
            </button>
          ) : (
            /* User biasa: slot kosong / tidak tampil item ke-5 */
            null
          )}
        </nav>
      </div>
    </div>
  );
}
