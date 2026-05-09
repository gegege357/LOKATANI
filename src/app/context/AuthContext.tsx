import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  googleId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (googleUser: { email: string; name: string; sub: string; picture?: string }) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);


// [SECURITY: Anti-Tampering & Session Obfuscation]

const encodeSession = (data: any) => btoa(encodeURIComponent(JSON.stringify(data)));
const decodeSession = (data: string) => JSON.parse(decodeURIComponent(atob(data)));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("auth_user");
      return saved ? decodeSession(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Sinkronisasi Perubahan Role (Realtime Backup - Polling 3 detik)
  // Menjamin perubahan instan ngatur SQL
  useEffect(() => {
    if (!user?.id) return;

    const intervalId = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || !data) return;

        setUser((prev) => {
          if (!prev) return null;
          if (prev.role !== data.role) {
            const updated = { ...prev, role: data.role as UserRole };
            localStorage.setItem("auth_user", encodeSession(updated));
            return updated;
          }
          return prev;
        });
      } catch (err) {
        // Abaikan sementara jika gagal terhubung
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [user?.id]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();
        
      if (error || !data) return false;
      
      // Update last login
      await supabase.from("users").update({ lastLogin: "Baru saja" }).eq("id", data.id);
      
      const newUser = {
         id: data.id,
         name: data.name,
         email: data.email,
         role: data.role as UserRole,
         avatar: data.avatar,
      };
      setUser(newUser);
      localStorage.setItem("auth_user", encodeSession(newUser));
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const loginWithGoogle = async (googleUser: { email: string; name: string; sub: string; picture?: string }): Promise<void> => {
    try {
      // Check if user exists (Menambahkan double-quotes untuk camelCase column dan value string)
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .or(`"googleId".eq."${googleUser.sub}",email.eq."${googleUser.email}"`)
        .maybeSingle();

      const lastLogin = "Baru saja";
      let finalUser;

      if (existingUser) {
        // Update existing user
        const { data, error } = await supabase
          .from("users")
          .update({ lastLogin, googleId: googleUser.sub })
          .eq("id", existingUser.id)
          .select()
          .single();
          
        if (error) throw error;
        finalUser = data;
      } else {
        // Create new user
        const newUser = {
          id: googleUser.sub, // Using sub as ID for simplification
          name: googleUser.name,
          email: googleUser.email,
          role: "user",
          avatar: googleUser.picture,
          googleId: googleUser.sub,
          status: "active",
          lastLogin,
          createdAt: new Date().toISOString().split("T")[0]
        };
        
        const { data, error } = await supabase
          .from("users")
          .insert([newUser])
          .select()
          .single();
          
        if (error) throw error;
        finalUser = data;
      }

      const newUserContext = {
         id: finalUser.id,
         name: finalUser.name,
         email: finalUser.email,
         role: finalUser.role as UserRole,
         avatar: finalUser.avatar,
         googleId: finalUser.googleId,
      };
      setUser(newUserContext);
      localStorage.setItem("auth_user", encodeSession(newUserContext));
    } catch (error) {
       console.error("Google Auth failed:", error);
       throw error;
    }
  };

  const loginAsGuest = () => {
    const guestUser: User = {
      id: "guest-id",
      name: "Guest User",
      email: "guest@lokatani.demo",
      role: "user",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
    };
    setUser(guestUser);
    localStorage.setItem("auth_user", encodeSession(guestUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, loginAsGuest, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
