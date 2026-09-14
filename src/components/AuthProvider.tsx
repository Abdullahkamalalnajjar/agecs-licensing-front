"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter, usePathname } from "next/navigation";
import { client } from "@/client/client.gen";
import { postIdentityTokenRefreshToken } from "@/client";

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

  // ── Proactive refresh: refresh token 60s before it expires ──
  const proactiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleProactiveRefresh = (token: string) => {
    if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.exp) return;
      const expiresInMs = decoded.exp * 1000 - Date.now() - 60_000; // 60s before expiry
      if (expiresInMs <= 0) return;
      proactiveTimerRef.current = setTimeout(() => doRefresh(), expiresInMs);
    } catch { /* ignore */ }
  };

  const doRefresh = async (): Promise<string | null> => {
    const accessToken = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!accessToken || !refreshToken) {
      logout();
      return null;
    }
    
    const currentAuth = client.getConfig().auth;
    client.setConfig({ auth: undefined });
    
    let res;
    try {
      res = await postIdentityTokenRefreshToken({
        body: { accessToken, refreshToken },
        throwOnError: false,
      });
    } catch {
       /* fall through */
    } finally {
      client.setConfig({ auth: currentAuth });
    }
    
    if (res) {
      const data = res.data as any;
      if (data?.isSuccess && data?.value?.accessToken) {
        const newToken: string = data.value.accessToken;
        const newRefresh: string | undefined = data.value.refreshToken;
        localStorage.setItem("token", newToken);
        if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
        client.setConfig({ auth: newToken });
        scheduleProactiveRefresh(newToken);
        return newToken;
      }
    }
    logout();
    return null;
  };

  // Schedule proactive refresh whenever user/token changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) scheduleProactiveRefresh(token);
    return () => {
      if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
    };
  }, [user]);

  // ── Reactive refresh: 401 interceptor ────────────────────────
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
      // Prevent infinite loops if the refresh token endpoint itself returns 401
      if (response.status === 401 && !request.url.includes("/identity/token/refresh-token")) {
        const refreshToken = localStorage.getItem("refreshToken");
        const accessToken = localStorage.getItem("token");

        if (!refreshToken || !accessToken) {
          logout();
          return response;
        }

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            // Bypass the client's auth header for the refresh request by specifying an empty Authorization header.
            // Using postIdentityTokenRefreshToken directly will use the expired token if client.setConfig({auth}) is set,
            // which causes API Gateways (like port 5003) to return 401 before hitting the refresh endpoint.
            const currentAuth = client.getConfig().auth;
            client.setConfig({ auth: undefined });
            
            let res;
            try {
              res = await postIdentityTokenRefreshToken({
                body: { accessToken, refreshToken },
                throwOnError: false,
              });
            } finally {
              client.setConfig({ auth: currentAuth });
            }
            
            const data = res.data as any;

            if (data?.isSuccess && data?.value?.accessToken) {
              const newToken: string = data.value.accessToken;
              const newRefresh: string | undefined = data.value.refreshToken;
              localStorage.setItem("token", newToken);
              if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
              client.setConfig({ auth: newToken });
              scheduleProactiveRefresh(newToken);
              onRefreshed(newToken);
              isRefreshing = false;

              // To safely retry the request, we must clone it BEFORE it's consumed, or recreate it.
              // Since hey-api gives us a Request object that might be consumed, we recreate it using RequestInit.
              // We can't perfectly recreate POST bodies if consumed, but for most GET requests this is fine.
              const newHeaders = new Headers(request.headers);
              newHeaders.set("Authorization", `Bearer ${newToken}`);
              
              // Note: If original request had a body, it was consumed. Retrying it via fetch() might fail for POSTs.
              // For robustness in SPA, we often let the component retry or reload. But we attempt a GET retry or empty POST retry:
              try {
                  const retryRequest = new Request(request.url, {
                    method: request.method,
                    headers: newHeaders,
                    // Cannot copy body from a consumed Request, so we omit it. This means POST retries might fail,
                    // but they won't hang the app, and the user can just click the action again.
                  });
                  return await fetch(retryRequest);
              } catch (retryErr) {
                  return response; // Return original 401 if retry fails to construct
              }
            }

            logout();
          } catch {
            logout();
          } finally {
            isRefreshing = false;
          }
        } else {
          // Queue: wait until current refresh finishes then retry
          return new Promise((resolve) => {
            subscribeTokenRefresh(async (newToken) => {
              const newHeaders = new Headers(request.headers);
              newHeaders.set("Authorization", `Bearer ${newToken}`);
              try {
                const retryRequest = new Request(request.url, {
                  method: request.method,
                  headers: newHeaders,
                });
                resolve(await fetch(retryRequest));
              } catch {
                resolve(response);
              }
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
