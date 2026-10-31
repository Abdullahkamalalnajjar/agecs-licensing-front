"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { client } from "@/client/client.gen";
import { postIdentityTokenRefreshToken, getIdentityMyPermissions, getIdentityCurrentUser } from "@/client";
import { isStaff as hasStaffPermission } from "@/lib/permissions";

// The generated client starts with a placeholder base URL; set the API's once for the whole app, so calls made
// before a page configures the client (like loading the user's permissions) don't go to the wrong address.
// The session lives in HttpOnly cookies the API sets (page scripts can't read them), so every call sends
// cookies, plus the header the API requires on cookie requests that change something (CSRF protection).
client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003",
  credentials: "include",
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

// Not secrets: whether this browser has a session (so guests don't try to refresh one) and when its access token expires.
const SESSION_KEY = "signedIn";
const EXPIRES_KEY = "sessionExpiresAt";

const storage = {
  get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
  remove: (key: string) => { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

/** Whether this browser is signed in (its session cookie can't be read from script, so this flag tracks it). */
export function hasSession() {
  return storage.get(SESSION_KEY) === "1";
}

// Tokens from before the session moved to cookies.
storage.remove("token");
storage.remove("refreshToken");

const roleOf = (roles: unknown): Role => {
  let role = Array.isArray(roles) ? roles[0] : roles;
  // Tokens issued before NormalUser was merged into User still say NormalUser until they expire.
  if (!role || role === "NormalUser") role = "User";
  return role as Role;
};

const API_URL = () => process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

export type Role = "Admin" | "Sales" | "Student" | "User" | string;

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  /**
   * From GET /identity/my-permissions (the account's current permissions, the same ones the API checks);
   * drives which sections and buttons are shown. Empty until loaded.
   */
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** After a successful sign-in: the API has set the session cookies; the token is only read for the user's details. */
  login: (token: string, refreshToken?: string, expiresOnUtc?: string) => void;
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

/** `can(P.heroSlides.update)`: whether the signed-in user has that permission. */
export function usePermissions() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  // Admin has every permission on the API, so the UI never locks it out, even if the permissions list is
  // missing or out of date (e.g. an older API, or the request failed).
  const isAdmin = user?.role === "Admin";
  const has = (permission: string) => isAdmin || permissions.includes(permission);
  return {
    permissions,
    can: has,
    /**
     * Whether a field of a section can be edited: the section's full edit ("products:update") or that field's own
     * permission ("products:update:description"). Field keys are the ones in the API's permission catalog.
     */
    canField: (section: string, field: string) => has(`${section}:update`) || has(`${section}:update:${field}`),
    /** Whether anything in the section can be edited (full edit or at least one field), e.g. to show an Edit button. */
    canUpdateAny: (section: string) => has(`${section}:update`) || permissions.some((p) => p.startsWith(`${section}:update:`)),
    /** Has at least one dashboard section (Admin, Editor, Sales, or a role given section permissions). */
    isStaff: isAdmin || hasStaffPermission(permissions),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // The permissions of the signed-in user id they were loaded for (null until loaded).
  const [loaded, setLoaded] = useState<{ userId: string; permissions: string[] } | null>(null);
  const router = useRouter();
  const proactiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshingRef = useRef<Promise<boolean> | null>(null);

  const clearSession = () => {
    storage.remove(SESSION_KEY);
    storage.remove(EXPIRES_KEY);
    if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
    setUser(null);
  };

  const logout = () => {
    // Ends the session on the API and clears its cookies; the UI signs out either way.
    client.post({ url: "/identity/logout", throwOnError: false }).catch(() => {});
    clearSession();
    router.push("/login");
  };

  // ── Proactive refresh: 60s before the access token expires ──
  const scheduleProactiveRefresh = (expiresOnUtc?: string | null) => {
    if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
    const expiresAt = expiresOnUtc ? Date.parse(expiresOnUtc) : NaN;
    if (!Number.isFinite(expiresAt)) return;
    storage.set(EXPIRES_KEY, new Date(expiresAt).toISOString());
    const delay = expiresAt - Date.now() - 60_000;
    proactiveTimerRef.current = setTimeout(() => { doRefresh(); }, Math.max(delay, 0));
  };

  /** Renews the session cookies; one refresh at a time, shared by everyone waiting on it. */
  const doRefresh = (): Promise<boolean> => {
    if (!refreshingRef.current) {
      refreshingRef.current = (async () => {
        try {
          // An empty body: the API takes both tokens from the session cookies.
          const res = await postIdentityTokenRefreshToken({ body: {}, throwOnError: false });
          const data = res.data as any;
          if (data?.isSuccess) {
            scheduleProactiveRefresh(data.value?.expiresOnUtc);
            return true;
          }
        } catch { /* fall through */ }
        return false;
      })().finally(() => { refreshingRef.current = null; });
    }
    return refreshingRef.current;
  };

  // Load the signed-in user from the API (the session cookie can't be read here).
  useEffect(() => {
    if (!hasSession()) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getIdentityCurrentUser({ throwOnError: false })
      .then((res) => {
        if (cancelled) return;
        const me = res.data?.isSuccess ? res.data.value : null;
        if (me?.userId) {
          setUser({ id: me.userId, email: me.email ?? "", role: roleOf(me.roles), permissions: [] });
          scheduleProactiveRefresh(storage.get(EXPIRES_KEY));
        } else if (res.response?.status === 401) {
          clearSession();
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // Once per page load; login() sets the user itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (token: string, _refreshToken?: string, expiresOnUtc?: string) => {
    storage.set(SESSION_KEY, "1");
    try {
      const decoded: any = jwtDecode(token);
      let email = decoded.email || decoded.unique_name || "";
      if (Array.isArray(email)) email = email[0];
      setUser({
        id: decoded.sub || decoded.nameid || "",
        email,
        role: roleOf(decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]),
        permissions: [],
      });
      scheduleProactiveRefresh(expiresOnUtc ?? (decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null));
    } catch (err) {
      console.error("Failed to decode token", err);
    }
    setLoading(false);
  };

  useEffect(() => () => { if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current); }, []);

  // ── Reactive refresh: on a 401, renew the session once and retry ──
  useEffect(() => {
    const interceptorId = client.interceptors.response.use(async (response, request) => {
      const isAuthCall = /\/identity\/(token\/|logout)/.test(request.url);
      if (response.status !== 401 || isAuthCall || !hasSession()) return response;

      if (await doRefresh()) {
        // The original body may already be consumed, so a retried POST is sent without it; GETs retry fine,
        // and an action that fails this way can just be clicked again.
        try {
          return await fetch(new Request(request.url, { method: request.method, headers: request.headers, credentials: "include" }));
        } catch {
          return response;
        }
      }

      logout();
      return response;
    });
    return () => { client.interceptors.response.eject(interceptorId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Permissions come from the API rather than the token: the API recomputes them on every request, so a token
  // issued under older permissions shows exactly what the account can do now.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getIdentityMyPermissions({ baseUrl: API_URL(), throwOnError: false })
      .then((res) => { if (!cancelled) setLoaded({ userId, permissions: res.data?.isSuccess ? res.data.value ?? [] : [] }); })
      .catch(() => { if (!cancelled) setLoaded({ userId, permissions: [] }); });
    return () => { cancelled = true; };
  }, [userId]);

  const permissionsPending = !!userId && loaded?.userId !== userId;
  const userWithPermissions = user && loaded?.userId === user.id ? { ...user, permissions: loaded.permissions } : user;

  return (
    <AuthContext.Provider value={{ user: userWithPermissions, loading: loading || permissionsPending, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
