"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter, usePathname } from "next/navigation";

export type Role = "SuperAdmin" | "Admin" | "Sales" | "Student" | string;

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        
        // Extract role - might be in a different claim key depending on backend Identity config
        let role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (Array.isArray(role)) role = role[0]; // If multiple roles, just take the first for simplicity
        if (!role) role = "Student"; // Default fallback
        
        // Extract email - might be in array
        let email = decoded.email || decoded.unique_name || "";
        if (Array.isArray(email)) email = email[0];
        
        setUser({
          id: decoded.sub || decoded.nameid || "",
          email: email,
          role: role,
        });
      } catch (err) {
        console.error("Failed to decode token", err);
        localStorage.removeItem("token");
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [pathname]);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    try {
      const decoded: any = jwtDecode(token);
      let role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (Array.isArray(role)) role = role[0];
      if (!role) role = "Student";
      
      let email = decoded.email || decoded.unique_name || "";
      if (Array.isArray(email)) email = email[0];
      
      setUser({
        id: decoded.sub || decoded.nameid || "",
        email: email,
        role: role,
      });
    } catch (err) {
      console.error("Failed to decode token", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
