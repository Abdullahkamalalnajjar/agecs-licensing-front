"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter, usePathname } from "next/navigation";
import { client } from "@/client/client.gen";

export type Role = "SuperAdmin" | "Admin" | "Sales" | "Student" | "NormalUser" | string;

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, refreshToken?: string) => void;
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
        if (!role) role = "NormalUser"; // Default fallback
        
        // Extract email - might be in array
        let email = decoded.email || decoded.unique_name || "";
        if (Array.isArray(email)) email = email[0];
        
        setUser({
          id: decoded.sub || decoded.nameid || "",
          email: email,
          role: role,
        });

        // Set the client config globally
        client.setConfig({
          auth: token
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

  const login = (token: string, refreshToken?: string) => {
    localStorage.setItem("token", token);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    try {
      const decoded: any = jwtDecode(token);
      let role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (Array.isArray(role)) role = role[0];
      if (!role) role = "NormalUser";
      
      let email = decoded.email || decoded.unique_name || "";
      if (Array.isArray(email)) email = email[0];
      
      setUser({
        id: decoded.sub || decoded.nameid || "",
        email: email,
        role: role,
      });

      // Set the client config globally
      client.setConfig({
        auth: token
      });
    } catch (err) {
      console.error("Failed to decode token", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
    client.setConfig({ auth: undefined });
    router.push("/login");
  };

  useEffect(() => {
    let isRefreshing = false;
    let refreshSubscribers: ((token: string) => void)[] = [];

    const subscribeTokenRefresh = (cb: (token: string) => void) => {
      refreshSubscribers.push(cb);
    };

    const onRefreshed = (token: string) => {
      refreshSubscribers.forEach((cb) => cb(token));
      refreshSubscribers = [];
    };

    const interceptorId = client.interceptors.response.use(async (response, request) => {
      if (response.status === 401) {
        const refreshToken = localStorage.getItem("refreshToken");
        const token = localStorage.getItem("token");

        if (!refreshToken || !token) {
          logout();
          return response;
        }

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";
            const res = await fetch(`${baseUrl}/api/identity/token/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, refreshToken }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data?.isSuccess && data?.value?.accessToken) {
                const newToken = data.value.accessToken;
                const newRefreshToken = data.value.refreshToken;
                localStorage.setItem("token", newToken);
                if (newRefreshToken) {
                  localStorage.setItem("refreshToken", newRefreshToken);
                }
                
                client.setConfig({
                  headers: { Authorization: `Bearer ${newToken}` }
                });

                onRefreshed(newToken);
                isRefreshing = false;
                
                const newHeaders = new Headers(request.headers);
                newHeaders.set("Authorization", `Bearer ${newToken}`);
                const retryRequest = new Request(request.url, {
                  ...request,
                  headers: newHeaders,
                });
                return fetch(retryRequest);
              }
            }
            
            logout();
          } catch (e) {
            logout();
          } finally {
            isRefreshing = false;
          }
        } else {
          return new Promise((resolve) => {
            subscribeTokenRefresh(async (newToken) => {
              const newHeaders = new Headers(request.headers);
              newHeaders.set("Authorization", `Bearer ${newToken}`);
              const retryRequest = new Request(request.url, {
                ...request,
                headers: newHeaders,
              });
              resolve(fetch(retryRequest));
            });
          });
        }
      }
      return response;
    });

    return () => {
      client.interceptors.response.eject(interceptorId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
