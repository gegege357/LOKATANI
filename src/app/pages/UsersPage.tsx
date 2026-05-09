import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, User, Plus, Edit2, Trash2, Filter } from "lucide-react";
import { useUserManagement } from "../context/UserManagementContext";
import { useAuth } from "../context/AuthContext";
import { UserModal } from "../components/users/UserModal";
import { DeleteConfirmModal } from "../components/users/DeleteConfirmModal";

const C = { primary: "#328E6E", secondary: "#67AE6E", accent: "#90C67C" };

export function UsersPage() {
  const { users } = useUserManagement();
  const { user: currentUser } = useAuth();
  const { deleteUser } = useUserManagement();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId: string | null; userName: string }>({
    isOpen: false,
    userId: null,
    userName: "",
  });
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");

  const isAdmin = currentUser?.role === "admin";

  const filteredUsers = filterRole === "all" ? users : users.filter(u => u.role === filterRole);

  const handleEdit = (userId: string) => {
    setEditUserId(userId);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditUserId(null);
    setIsModalOpen(true);
  };

  const handleDelete = (userId: string) => {
    deleteUser(userId);
  };

  const openDeleteConfirm = (userId: string, userName: string) => {
    setDeleteConfirm({ isOpen: true, userId, userName });
  };

  return (
    <div className="px-4 lg:px-6 py-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>User Management</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Kelola pengguna dan hak akses sistem</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, fontWeight: 600 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 6px 16px ${C.primary}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah User
          </button>
        )}
      </div>

      {/* Role legend + filter - stacked on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Admin", icon: Shield, color: C.accent, desc: "Full access + kontrol sistem" },
            { label: "User", icon: User, color: "rgba(255,255,255,0.5)", desc: "View only + monitoring" },
          ].map(({ label, icon: Icon, color, desc }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Icon className="w-4 h-4" style={{ color }} />
              <div>
                <div className="text-xs text-white" style={{ fontWeight: 600, fontSize: 11 }}>{label}</div>
                <div className="text-xs hidden sm:block" style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
          <div className="flex items-center gap-1">
            {(["all", "admin", "user"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterRole(f)}
                className="px-2.5 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: filterRole === f ? `${C.primary}30` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${filterRole === f ? C.primary + "60" : "rgba(255,255,255,0.08)"}`,
                  color: filterRole === f ? C.accent : "rgba(255,255,255,0.4)",
                  fontWeight: filterRole === f ? 600 : 400,
                  fontSize: 10,
                }}
              >
                {f === "all" ? "Semua" : f === "admin" ? "Admin" : "User"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(13,43,31,0.8)", border: "1px solid rgba(144,198,124,0.15)" }}>
        <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Daftar Pengguna ({filteredUsers.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Pengguna", "Email", "Role", "Status", "Login Terakhir", "Aksi"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: 9, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs"
                        style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, fontWeight: 700 }}
                      >
                        {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm text-white" style={{ fontWeight: 500, fontSize: 12 }}>{user.name}</div>
                        {!user.password && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>Google</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {user.role === "admin" ? (
                        <Shield className="w-3 h-3" style={{ color: C.accent }} />
                      ) : (
                        <User className="w-3 h-3" style={{ color: "rgba(255,255,255,0.4)" }} />
                      )}
                      <span
                        className="text-xs"
                        style={{
                          color: user.role === "admin" ? C.accent : "rgba(255,255,255,0.5)",
                          fontWeight: user.role === "admin" ? 600 : 400,
                          fontSize: 10,
                        }}
                      >
                        {user.role === "admin" ? "Administrator" : "Monitor User"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: user.status === "active" ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.08)",
                        color: user.status === "active" ? "#4ade80" : "rgba(255,255,255,0.3)",
                        fontWeight: 600, fontSize: 9,
                      }}
                    >
                      {user.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{user.lastLogin}</td>
                  <td className="px-4 py-3">
                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${C.primary}30`;
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <Edit2 className="w-3 h-3" style={{ color: C.accent }} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(user.id, user.name)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <Trash2 className="w-3 h-3" style={{ color: "#ef4444" }} />
                        </button>
                      </div>
                    )}
                    {!isAdmin && (
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditUserId(null);
        }}
        editUserId={editUserId}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, userId: null, userName: "" })}
        onConfirm={() => {
          if (deleteConfirm.userId) {
            handleDelete(deleteConfirm.userId);
          }
        }}
        userName={deleteConfirm.userName}
      />
    </div>
  );
}
