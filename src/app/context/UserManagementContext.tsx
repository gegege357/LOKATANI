import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User, UserRole } from "./AuthContext";
import { supabase } from "../../lib/supabase";

interface ManagedUser extends User {
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
  password?: string; // untuk user non-Google
}

interface UserManagementContextType {
  users: ManagedUser[];
  addUser: (user: Omit<ManagedUser, "id" | "createdAt" | "lastLogin" | "status">) => Promise<void>;
  updateUser: (id: string, updates: Partial<ManagedUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => ManagedUser | undefined;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  syncGoogleUser: (googleUser: User) => void;
}

const UserManagementContext = createContext<UserManagementContextType | null>(null);

export function UserManagementProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      setUsers(data as ManagedUser[]);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  // Load users from Backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (userData: Omit<ManagedUser, "id" | "createdAt" | "lastLogin" | "status">) => {
    try {
      const newUser = {
        ...userData,
        id: `user_${Date.now()}`,
        status: "active",
        lastLogin: "Belum pernah",
        createdAt: new Date().toISOString().split("T")[0]
      };
      
      const { data, error } = await supabase.from("users").insert([newUser]).select().single();
      if (error) throw error;
      
      if (data) {
        setUsers((prev) => [...prev, data as ManagedUser]);
      }
    } catch (err) {
      console.error("Failed to add user", err);
    }
  };

  const updateUser = async (id: string, updates: Partial<ManagedUser>) => {
    try {
      const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().single();
      if (error) throw error;
      
      if (data) {
        setUsers(users.map((u) => (u.id === id ? (data as ManagedUser) : u)));
      }
    } catch (err) {
      console.error("Failed to update user", err);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  const getUserById = (id: string) => {
    return users.find((u) => u.id === id);
  };

  const updateUserRole = async (id: string, role: UserRole) => {
    await updateUser(id, { role });
  };

  const syncGoogleUser = (googleUser: User) => {
     // Reload to make sure we have latest user list
     fetchUsers();
  };

  return (
    <UserManagementContext.Provider
      value={{
        users,
        addUser,
        updateUser,
        deleteUser,
        getUserById,
        updateUserRole,
        syncGoogleUser,
      }}
    >
      {children}
    </UserManagementContext.Provider>
  );
}

export function useUserManagement() {
  const ctx = useContext(UserManagementContext);
  if (!ctx) throw new Error("useUserManagement must be used within UserManagementProvider");
  return ctx;
}
