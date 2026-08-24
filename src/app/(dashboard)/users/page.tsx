"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  getIdentityUsers,
  getIdentityUsersDeleted,
  deleteIdentityByUserId,
  putIdentityUsersByUserIdRole,
  putIdentityUsersByUserIdRestore
} from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import { AppUserDto } from "@/client/types.gen";

// ============================================================
// CONSTANTS & ROLE DEFINITIONS
// ============================================================
interface RoleConfig {
  name: string;
  label: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: string;
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  SuperAdmin: {
    name: "SuperAdmin",
    label: "Super Admin",
    description: "Full uncontrolled system & database privileges",
    badgeBg: "rgba(168, 85, 247, 0.12)",
    badgeText: "#c084fc",
    badgeBorder: "rgba(168, 85, 247, 0.3)",
    icon: "👑",
  },
  SystemAdmin: {
    name: "SystemAdmin",
    label: "System Admin",
    description: "Infrastructure, security & server controls",
    badgeBg: "rgba(99, 102, 241, 0.12)",
    badgeText: "#818cf8",
    badgeBorder: "rgba(99, 102, 241, 0.3)",
    icon: "⚡",
  },
  Admin: {
    name: "Admin",
    label: "Administrator",
    description: "Can manage products, licenses, users and tickets",
    badgeBg: "rgba(59, 130, 246, 0.12)",
    badgeText: "#60a5fa",
    badgeBorder: "rgba(59, 130, 246, 0.3)",
    icon: "🛡️",
  },
  Sales: {
    name: "Sales",
    label: "Sales Manager",
    description: "Can generate promo codes, review orders & licenses",
    badgeBg: "rgba(6, 182, 212, 0.12)",
    badgeText: "#22d3ee",
    badgeBorder: "rgba(6, 182, 212, 0.3)",
    icon: "💼",
  },
  Support: {
    name: "Support",
    label: "Support Agent",
    description: "Can review & respond to user support tickets",
    badgeBg: "rgba(20, 184, 166, 0.12)",
    badgeText: "#2dd4bf",
    badgeBorder: "rgba(20, 184, 166, 0.3)",
    icon: "🎧",
  },
  Student: {
    name: "Student",
    label: "Student",
    description: "Discounted student access & student licenses",
    badgeBg: "rgba(245, 158, 11, 0.12)",
    badgeText: "#fbbf24",
    badgeBorder: "rgba(245, 158, 11, 0.3)",
    icon: "🎓",
  },
  NormalUser: {
    name: "NormalUser",
    label: "Standard Customer",
    description: "Standard account for purchasing and managing personal licenses",
    badgeBg: "rgba(148, 163, 184, 0.12)",
    badgeText: "#94a3b8",
    badgeBorder: "rgba(148, 163, 184, 0.25)",
    icon: "👤",
  },
};

const ALL_ROLES = Object.keys(ROLE_CONFIGS);

// ============================================================
// AVATAR COMPONENT
// ============================================================
function UserAvatar({ email, size = 40 }: { email?: string; size?: number }) {
  const cleanEmail = email || "User";
  const initials = cleanEmail.slice(0, 2).toUpperCase();
  
  const hash = [...cleanEmail].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue1 = (hash * 37) % 360;
  const hue2 = (hue1 + 40) % 360;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-md, 10px)",
        background: `linear-gradient(135deg, hsl(${hue1}, 70%, 45%), hsl(${hue2}, 85%, 35%))`,
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        letterSpacing: "0.04em",
        flexShrink: 0,
        boxShadow: `0 4px 12px hsl(${hue1}, 70%, 25%, 0.4)`,
        border: "1px solid rgba(255, 255, 255, 0.15)",
        userSelect: "none"
      }}
    >
      {initials}
    </div>
  );
}

// ============================================================
// MAIN USERS PAGE COMPONENT
// ============================================================
export default function UsersPage() {
  const router = useRouter();

  // Data state
  const [activeUsers, setActiveUsers] = useState<AppUserDto[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<AppUserDto[]>([]);
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters & search
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"email-asc" | "email-desc" | "city">("email-asc");

  // Modals state
  const [roleModalUser, setRoleModalUser] = useState<AppUserDto | null>(null);
  const [detailsModalUser, setDetailsModalUser] = useState<AppUserDto | null>(null);
  const [confirmBanUser, setConfirmBanUser] = useState<AppUserDto | null>(null);
  const [confirmRestoreUser, setConfirmRestoreUser] = useState<AppUserDto | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const setupClient = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return false;
    }
    client.setConfig({
      baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
      auth: token,
    });
    return true;
  }, [router]);

  const fetchAllUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      if (!setupClient()) return;

      const [activeRes, deletedRes] = await Promise.all([
        getIdentityUsers({ throwOnError: false }),
        getIdentityUsersDeleted({ throwOnError: false }),
      ]);

      if (activeRes.data) {
        const raw = activeRes.data as any;
        setActiveUsers(Array.isArray(raw?.value) ? raw.value : (Array.isArray(raw) ? raw : []));
      } else if (activeRes.error) {
        setError("Failed to fetch active users.");
      }

      if (deletedRes.data) {
        const raw = deletedRes.data as any;
        setDeletedUsers(Array.isArray(raw?.value) ? raw.value : (Array.isArray(raw) ? raw : []));
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while loading users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setupClient]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveRole = async () => {
    if (!roleModalUser?.userId || !selectedNewRole) return;
    setActionLoading(true);
    try {
      if (!setupClient()) return;
      const res = await putIdentityUsersByUserIdRole({
        path: { userId: roleModalUser.userId },
        body: { role: selectedNewRole },
        throwOnError: false,
      });

      if ((res.data as any)?.isSuccess || res.response?.status === 200) {
        showToast(`Role for ${roleModalUser.email} updated to ${selectedNewRole}!`, "success");
        setRoleModalUser(null);
        fetchAllUsers(true);
      } else {
        const errMsg = (res.data as any)?.errors?.[0]?.description || "Failed to update user role.";
        showToast(errMsg, "error");
      }
    } catch {
      showToast("Error updating role. Please check connection.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteBan = async () => {
    if (!confirmBanUser?.userId) return;
    setActionLoading(true);
    try {
      if (!setupClient()) return;
      const res = await deleteIdentityByUserId({
        path: { userId: confirmBanUser.userId },
        throwOnError: false,
      });

      if ((res.data as any)?.isSuccess || res.response?.status === 200 || res.response?.status === 204) {
        showToast(`Account for ${confirmBanUser.email} has been banned & suspended.`, "success");
        setConfirmBanUser(null);
        fetchAllUsers(true);
      } else {
        const errMsg = (res.data as any)?.errors?.[0]?.description || "Failed to ban user.";
        showToast(errMsg, "error");
      }
    } catch {
      showToast("Error banning user.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!confirmRestoreUser?.userId) return;
    setActionLoading(true);
    try {
      if (!setupClient()) return;
      const res = await putIdentityUsersByUserIdRestore({
        path: { userId: confirmRestoreUser.userId },
        throwOnError: false,
      });

      if ((res.data as any)?.isSuccess || res.response?.status === 200 || res.response?.status === 204) {
        showToast(`Account for ${confirmRestoreUser.email} has been restored successfully!`, "success");
        setConfirmRestoreUser(null);
        fetchAllUsers(true);
      } else {
        const errMsg = (res.data as any)?.errors?.[0]?.description || "Failed to restore user.";
        showToast(errMsg, "error");
      }
    } catch {
      showToast("Error restoring user.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const currentList = viewMode === "active" ? activeUsers : deletedUsers;

  const filteredUsers = useMemo(() => {
    return currentList.filter(user => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        (user.email || "").toLowerCase().includes(q) ||
        (user.city || "").toLowerCase().includes(q) ||
        (user.phoneNumber || "").toLowerCase().includes(q) ||
        (user.roles || []).some(r => r.toLowerCase().includes(q));

      const matchesRole = selectedRole === "all" || (user.roles || []).includes(selectedRole);

      return matchesSearch && matchesRole;
    }).sort((a, b) => {
      if (sortBy === "email-asc") return (a.email || "").localeCompare(b.email || "");
      if (sortBy === "email-desc") return (b.email || "").localeCompare(a.email || "");
      if (sortBy === "city") return (a.city || "").localeCompare(b.city || "");
      return 0;
    });
  }, [currentList, search, selectedRole, sortBy]);

  const totalActive = activeUsers.length;
  const totalDeleted = deletedUsers.length;
  const totalStaff = activeUsers.filter(u => 
    u.roles?.some(r => ["SuperAdmin", "SystemAdmin", "Admin", "Sales", "Support"].includes(r))
  ).length;
  const totalStudents = activeUsers.filter(u => u.roles?.includes("Student")).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem 1.5rem",
            borderRadius: "var(--radius-lg)",
            background: toastMessage.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
            color: "#ffffff",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(12px)",
            fontWeight: 600,
            fontSize: "0.9rem",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          <span>{toastMessage.type === "success" ? "✓" : "⚠"}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, rgba(var(--accent-rgb, 25, 73, 161), 0.08) 0%, rgba(var(--bg-surface-rgb, 13, 15, 26), 0) 100%)",
          padding: "1.5rem 1.75rem",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 24px -8px rgba(0,0,0,0.05)",
          backdropFilter: "blur(8px)",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-lg)",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-light)",
              boxShadow: "0 4px 14px var(--accent-glow)",
              fontSize: "1.5rem"
            }}
          >
            👥
          </div>
          <div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
              User Management
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: "0.2rem 0 0 0", fontWeight: 500 }}>
              Control account privileges, user roles, security access & account suspensions.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => fetchAllUsers(true)}
            disabled={refreshing || loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-strong)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: refreshing ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "var(--shadow-sm)"
            }}
            onMouseEnter={(e) => { if (!refreshing) e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { if (!refreshing) e.currentTarget.style.borderColor = "var(--border-strong)"; }}
          >
            <span style={{ display: "inline-block", animation: refreshing ? "spin 0.8s linear infinite" : "none" }}>↻</span>
            {refreshing ? "Refreshing…" : "Sync Data"}
          </button>
        </div>
      </div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div className="alert-error" style={{ borderRadius: "var(--radius-lg)", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontWeight: 500 }}>{error}</span>
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.7, padding: 4, display: "flex" }}>✕</button>
        </div>
      )}

      {/* ── STATS CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
        {[
          {
            label: "Active Users",
            value: totalActive,
            color: "var(--success, #10b981)",
            dim: "var(--success-dim, rgba(16, 185, 129, 0.12))",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
              </svg>
            ),
            onClick: () => setViewMode("active"),
            isActive: viewMode === "active",
          },
          {
            label: "Suspended / Banned",
            value: totalDeleted,
            color: "var(--danger, #ef4444)",
            dim: "var(--danger-dim, rgba(239, 68, 68, 0.12))",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            ),
            onClick: () => setViewMode("deleted"),
            isActive: viewMode === "deleted",
          },
          {
            label: "Staff & Admins",
            value: totalStaff,
            color: "#a855f7",
            dim: "rgba(168, 85, 247, 0.12)",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            ),
            onClick: () => { setViewMode("active"); setSelectedRole("Admin"); },
            isActive: false,
          },
          {
            label: "Students Registered",
            value: totalStudents,
            color: "#f59e0b",
            dim: "rgba(245, 158, 11, 0.12)",
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            ),
            onClick: () => { setViewMode("active"); setSelectedRole("Student"); },
            isActive: false,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={stat.onClick}
            style={{
              background: "var(--bg-surface)",
              border: stat.isActive ? `2px solid ${stat.color}` : "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "1.4rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              transition: "all 0.25s ease",
              position: "relative",
              overflow: "hidden",
              boxShadow: stat.isActive ? `0 8px 24px ${stat.dim}` : "var(--shadow-sm)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 12px 28px ${stat.dim}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = stat.isActive ? `0 8px 24px ${stat.dim}` : "var(--shadow-sm)";
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "120px",
                height: "120px",
                background: `radial-gradient(circle, ${stat.color}20 0%, transparent 70%)`,
                transform: "translate(30%, -30%)",
                pointerEvents: "none",
                borderRadius: "50%"
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "var(--radius-md)",
                  background: stat.dim,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: stat.color,
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${stat.color}25`
                }}
              >
                {loading ? <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 6 }} /> : stat.icon}
              </div>
              {stat.isActive && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    padding: "0.2rem 0.6rem",
                    borderRadius: 99,
                    background: stat.color,
                    color: "#ffffff"
                  }}
                >
                  Selected Tab
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.03em" }}>
                {loading ? <div className="skeleton" style={{ width: 60, height: 32, borderRadius: 6 }} /> : stat.value}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: "1.25rem 1.5rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.25rem",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-lg)",
            padding: "0.35rem",
            border: "1px solid var(--border)"
          }}
        >
          <button
            onClick={() => setViewMode("active")}
            style={{
              padding: "0.45rem 1.1rem",
              borderRadius: "calc(var(--radius-lg) - 0.25rem)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: viewMode === "active" ? "var(--bg-surface)" : "transparent",
              color: viewMode === "active" ? "var(--accent-light)" : "var(--text-secondary)",
              boxShadow: viewMode === "active" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <span>✓</span>
            <span>Active Users</span>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "0.1rem 0.45rem",
                borderRadius: 99,
                background: viewMode === "active" ? "var(--accent-dim)" : "transparent",
                color: viewMode === "active" ? "var(--accent-light)" : "var(--text-muted)"
              }}
            >
              {activeUsers.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode("deleted")}
            style={{
              padding: "0.45rem 1.1rem",
              borderRadius: "calc(var(--radius-lg) - 0.25rem)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: viewMode === "deleted" ? "var(--bg-surface)" : "transparent",
              color: viewMode === "deleted" ? "var(--danger)" : "var(--text-secondary)",
              boxShadow: viewMode === "deleted" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <span>⊘</span>
            <span>Banned / Deleted</span>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "0.1rem 0.45rem",
                borderRadius: 99,
                background: viewMode === "deleted" ? "var(--danger-dim)" : "transparent",
                color: viewMode === "deleted" ? "var(--danger)" : "var(--text-muted)"
              }}
            >
              {deletedUsers.length}
            </span>
          </button>
        </div>

        <div style={{ flex: 1, minWidth: 260, position: "relative", display: "flex", alignItems: "center" }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "absolute", left: "1rem", color: "var(--text-muted)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="form-input"
            placeholder="Search by email, city, phone or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: "2.75rem",
              paddingRight: search ? "2.5rem" : "1rem",
              fontSize: "0.9rem",
              width: "100%",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "0.75rem",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center"
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="form-input"
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "var(--radius-lg)",
              fontSize: "0.85rem",
              fontWeight: 600,
              minWidth: 150,
              background: "var(--bg-elevated)",
              cursor: "pointer"
            }}
          >
            <option value="all">All Roles ({currentList.length})</option>
            {ALL_ROLES.map((role) => {
              const count = currentList.filter(u => u.roles?.includes(role)).length;
              return (
                <option key={role} value={role}>
                  {ROLE_CONFIGS[role]?.label || role} ({count})
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="form-input"
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "var(--radius-lg)",
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "var(--bg-elevated)",
              cursor: "pointer"
            }}
          >
            <option value="email-asc">Sort: Email (A-Z)</option>
            <option value="email-desc">Sort: Email (Z-A)</option>
            <option value="city">Sort: City</option>
          </select>
        </div>

        {(search || selectedRole !== "all") && (
          <button
            onClick={() => { setSearch(""); setSelectedRole("all"); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--danger)",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              padding: "0.25rem 0.5rem"
            }}
          >
            Reset Filters
          </button>
        )}

        {!loading && (
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, padding: "0 0.5rem", whiteSpace: "nowrap", marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: viewMode === "active" ? "var(--success)" : "var(--danger)", display: "inline-block", boxShadow: "0 0 8px currentColor" }} />
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
          </div>
        )}
      </div>

      {/* ── USERS DATA TABLE ── */}
      <div
        className="data-table-wrapper"
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          background: "var(--bg-surface)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          overflow: "hidden"
        }}
      >
        <table className="data-table" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ width: "32%", padding: "1rem 1.5rem" }}>User / Identity</th>
              <th style={{ width: "18%", padding: "1rem 1.25rem" }}>Location & City</th>
              <th style={{ width: "18%", padding: "1rem 1.25rem" }}>Phone Number</th>
              <th style={{ width: "18%", padding: "1rem 1.25rem" }}>Role & Access</th>
              <th style={{ width: "14%", padding: "1rem 1.5rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1.2rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "var(--radius-md)" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", width: "70%" }}>
                        <div className="skeleton" style={{ width: "80%", height: 16 }} />
                        <div className="skeleton" style={{ width: "40%", height: 12 }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1.2rem 1.25rem" }}><div className="skeleton" style={{ width: "60%", height: 16 }} /></td>
                  <td style={{ padding: "1.2rem 1.25rem" }}><div className="skeleton" style={{ width: "70%", height: 16 }} /></td>
                  <td style={{ padding: "1.2rem 1.25rem" }}><div className="skeleton" style={{ width: "50%", height: 24, borderRadius: 99 }} /></td>
                  <td style={{ padding: "1.2rem 1.5rem", textAlign: "right" }}><div className="skeleton" style={{ width: 80, height: 32, marginLeft: "auto", borderRadius: "var(--radius-md)" }} /></td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "4.5rem 2rem", textAlign: "center" }}>
                  <div className="empty-state">
                    <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                      {search ? "🔍" : (viewMode === "active" ? "👥" : "🛡️")}
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      No {viewMode === "active" ? "active" : "banned"} users found
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto" }}>
                      {search 
                        ? `No users matched "${search}". Try searching by another keyword or reset the filters.`
                        : (viewMode === "active" 
                            ? "No active registered users in the database currently." 
                            : "Good news! There are currently no suspended or deleted user accounts.")}
                    </div>
                    {search && (
                      <button
                        className="btn-primary"
                        onClick={() => { setSearch(""); setSelectedRole("all"); }}
                        style={{ marginTop: "1rem" }}
                      >
                        Clear Search & Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const primaryRole = user.roles?.[0] || "NormalUser";
                const roleConfig = ROLE_CONFIGS[primaryRole] || ROLE_CONFIGS.NormalUser;
                const isUserDeleted = viewMode === "deleted";

                return (
                  <tr
                    key={user.userId}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s ease",
                      background: "transparent"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* User Profile Info */}
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                        <UserAvatar email={user.email || undefined} size={42} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                              {user.email || "No Email"}
                            </span>
                            {isUserDeleted && (
                              <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.4rem", borderRadius: 4, background: "var(--danger-dim)", color: "var(--danger)", fontWeight: 700 }}>
                                BANNED
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                              ID: {user.userId ? `${user.userId.slice(0, 10)}…` : "—"}
                            </span>
                            {user.userId && (
                              <button
                                onClick={() => handleCopy(user.userId!, `user-${user.userId}`)}
                                title="Copy full User ID"
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: "0 2px",
                                  cursor: "pointer",
                                  color: copiedId === `user-${user.userId}` ? "var(--success)" : "var(--text-muted)",
                                  fontSize: "0.75rem"
                                }}
                              >
                                {copiedId === `user-${user.userId}` ? "✓" : "📋"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* City / Location */}
                    <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      {user.city ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          <span>📍</span>
                          <span>{user.city}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>Not specified</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      {user.phoneNumber ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                          <span>📞</span>
                          <span>{user.phoneNumber}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>No phone</span>
                      )}
                    </td>

                    {/* Role & Permissions Badge */}
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-start" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            background: roleConfig.badgeBg,
                            color: roleConfig.badgeText,
                            border: `1px solid ${roleConfig.badgeBorder}`,
                            boxShadow: `0 2px 6px ${roleConfig.badgeBg}`
                          }}
                        >
                          <span>{roleConfig.icon}</span>
                          <span>{roleConfig.label}</span>
                        </span>
                        {user.roles && user.roles.length > 1 && (
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", paddingLeft: "0.2rem" }}>
                            +{user.roles.length - 1} more role(s)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                        <button
                          onClick={() => setDetailsModalUser(user)}
                          title="View Full Profile Details"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 34,
                            height: 34,
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border-strong)",
                            background: "var(--bg-elevated)",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            transition: "all 0.18s ease"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                        >
                          👁
                        </button>

                        {viewMode === "active" ? (
                          <>
                            <button
                              onClick={() => {
                                setRoleModalUser(user);
                                setSelectedNewRole(user.roles?.[0] || "NormalUser");
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                padding: "0.45rem 0.85rem",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--accent-border)",
                                background: "var(--accent-dim)",
                                color: "var(--accent-light)",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.18s ease"
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#ffffff"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent-dim)"; e.currentTarget.style.color = "var(--accent-light)"; }}
                            >
                              <span>✏</span>
                              <span>Role</span>
                            </button>

                            <button
                              onClick={() => setConfirmBanUser(user)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                padding: "0.45rem 0.85rem",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid rgba(239, 68, 68, 0.25)",
                                background: "var(--danger-dim)",
                                color: "var(--danger)",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.18s ease"
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--danger)"; e.currentTarget.style.color = "#ffffff"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--danger-dim)"; e.currentTarget.style.color = "var(--danger)"; }}
                            >
                              <span>⊘</span>
                              <span>Ban</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmRestoreUser(user)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.45rem 1rem",
                              borderRadius: "var(--radius-md)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              background: "var(--success-dim)",
                              color: "var(--success)",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.18s ease",
                              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--success)"; e.currentTarget.style.color = "#ffffff"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--success-dim)"; e.currentTarget.style.color = "var(--success)"; }}
                          >
                            <span>↩</span>
                            <span>Restore Access</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {!loading && filteredUsers.length > 0 && (
          <div
            style={{
              padding: "1rem 1.5rem",
              background: "var(--bg-elevated)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.82rem",
              color: "var(--text-secondary)"
            }}
          >
            <div>
              Showing <strong style={{ color: "var(--text-primary)" }}>{filteredUsers.length}</strong> of{" "}
              <strong style={{ color: "var(--text-primary)" }}>{currentList.length}</strong> {viewMode} user accounts
            </div>
            <div>
              System Time: <span style={{ fontFamily: "var(--font-mono)" }}>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: EDIT USER ROLE ── */}
      {roleModalUser && (
        <div className="modal-overlay" onClick={() => !actionLoading && setRoleModalUser(null)}>
          <div
            className="modal-container"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "1.5rem 1.75rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <UserAvatar email={roleModalUser.email || undefined} size={42} />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Update User Role
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {roleModalUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                disabled={actionLoading}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                Select Assigned Permission Role:
              </div>

              {ALL_ROLES.map((roleKey) => {
                const conf = ROLE_CONFIGS[roleKey];
                const isSelected = selectedNewRole === roleKey;
                return (
                  <div
                    key={roleKey}
                    onClick={() => setSelectedNewRole(roleKey)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.85rem",
                      padding: "0.9rem 1.1rem",
                      borderRadius: "var(--radius-lg)",
                      border: isSelected ? `2px solid ${conf.badgeText}` : "1px solid var(--border)",
                      background: isSelected ? conf.badgeBg : "var(--bg-elevated)",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      position: "relative"
                    }}
                  >
                    <div style={{ fontSize: "1.4rem", marginTop: 2 }}>{conf.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.92rem", color: isSelected ? conf.badgeText : "var(--text-primary)" }}>
                          {conf.label}
                        </span>
                        {isSelected && (
                          <span style={{ fontSize: "0.8rem", color: conf.badgeText, fontWeight: 800 }}>✓ Selected</span>
                        )}
                      </div>
                      <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {conf.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                padding: "1.25rem 1.75rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                background: "var(--bg-elevated)",
                borderBottomLeftRadius: "var(--radius-xl)",
                borderBottomRightRadius: "var(--radius-xl)"
              }}
            >
              <button
                className="btn-ghost"
                onClick={() => setRoleModalUser(null)}
                disabled={actionLoading}
                style={{ padding: "0.6rem 1.25rem", borderRadius: "var(--radius-md)" }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveRole}
                disabled={actionLoading || !selectedNewRole}
                style={{ padding: "0.6rem 1.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {actionLoading && <span className="spinner" style={{ width: 14, height: 14 }} />}
                {actionLoading ? "Updating…" : "Apply Role Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: USER DETAILS ── */}
      {detailsModalUser && (
        <div className="modal-overlay" onClick={() => setDetailsModalUser(null)}>
          <div
            className="modal-container"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "1.5rem 1.75rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <UserAvatar email={detailsModalUser.email || undefined} size={46} />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    User Account Profile
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {detailsModalUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModalUser(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ background: "var(--bg-elevated)", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.6rem", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>User Unique ID</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <code style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                      {detailsModalUser.userId}
                    </code>
                    <button
                      onClick={() => handleCopy(detailsModalUser.userId || "", "modal-uid")}
                      style={{ background: "none", border: "none", cursor: "pointer", color: copiedId === "modal-uid" ? "var(--success)" : "var(--accent)", fontSize: "0.8rem" }}
                    >
                      {copiedId === "modal-uid" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Email Address</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{detailsModalUser.email}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>City / Location</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{detailsModalUser.city || "—"}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.6rem" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Phone Number</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{detailsModalUser.phoneNumber || "—"}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                  Assigned Identity Roles
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {detailsModalUser.roles && detailsModalUser.roles.length > 0 ? (
                    detailsModalUser.roles.map(r => {
                      const conf = ROLE_CONFIGS[r] || ROLE_CONFIGS.NormalUser;
                      return (
                        <div
                          key={r}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.35rem 0.85rem",
                            borderRadius: "var(--radius-sm)",
                            background: conf.badgeBg,
                            color: conf.badgeText,
                            border: `1px solid ${conf.badgeBorder}`,
                            fontWeight: 700,
                            fontSize: "0.8rem"
                          }}
                        >
                          <span>{conf.icon}</span>
                          <span>{conf.label}</span>
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No specific roles assigned.</span>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "1.25rem 1.75rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "flex-end",
                background: "var(--bg-elevated)",
                borderBottomLeftRadius: "var(--radius-xl)",
                borderBottomRightRadius: "var(--radius-xl)"
              }}
            >
              <button
                className="btn-primary"
                onClick={() => setDetailsModalUser(null)}
                style={{ padding: "0.6rem 1.5rem", borderRadius: "var(--radius-md)" }}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM BAN USER ── */}
      {confirmBanUser && (
        <div className="modal-overlay" onClick={() => !actionLoading && setConfirmBanUser(null)}>
          <div
            className="modal-container"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--danger-dim)",
                  color: "var(--danger)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  boxShadow: "0 4px 16px rgba(239, 68, 68, 0.25)"
                }}
              >
                ⊘
              </div>
              <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>
                Ban User Account?
              </h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Are you sure you want to suspend and ban <strong style={{ color: "var(--text-primary)" }}>{confirmBanUser.email}</strong>? 
                The user will lose immediate access to all active software licenses and API services.
              </p>

              <div
                style={{
                  width: "100%",
                  background: "var(--bg-elevated)",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  textAlign: "left"
                }}
              >
                💡 <em>Note: This performs a soft-deletion. You can restore this account at any time from the <strong>Banned / Deleted</strong> tab.</em>
              </div>
            </div>

            <div
              style={{
                padding: "1.25rem 1.75rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                background: "var(--bg-elevated)",
                borderBottomLeftRadius: "var(--radius-xl)",
                borderBottomRightRadius: "var(--radius-xl)"
              }}
            >
              <button
                className="btn-ghost"
                onClick={() => setConfirmBanUser(null)}
                disabled={actionLoading}
                style={{ padding: "0.6rem 1.25rem", borderRadius: "var(--radius-md)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBan}
                disabled={actionLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--danger)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)"
                }}
              >
                {actionLoading && <span className="spinner" style={{ width: 14, height: 14 }} />}
                {actionLoading ? "Suspending…" : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM RESTORE USER ── */}
      {confirmRestoreUser && (
        <div className="modal-overlay" onClick={() => !actionLoading && setConfirmRestoreUser(null)}>
          <div
            className="modal-container"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--success-dim)",
                  color: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.25)"
                }}
              >
                ↩
              </div>
              <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>
                Restore User Access?
              </h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Do you want to re-activate the account for <strong style={{ color: "var(--text-primary)" }}>{confirmRestoreUser.email}</strong>? 
                Their permissions and account state will be restored immediately.
              </p>
            </div>

            <div
              style={{
                padding: "1.25rem 1.75rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                background: "var(--bg-elevated)",
                borderBottomLeftRadius: "var(--radius-xl)",
                borderBottomRightRadius: "var(--radius-xl)"
              }}
            >
              <button
                className="btn-ghost"
                onClick={() => setConfirmRestoreUser(null)}
                disabled={actionLoading}
                style={{ padding: "0.6rem 1.25rem", borderRadius: "var(--radius-md)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                disabled={actionLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--success)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)"
                }}
              >
                {actionLoading && <span className="spinner" style={{ width: 14, height: 14 }} />}
                {actionLoading ? "Restoring…" : "Confirm Restore"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANIMATION KEYFRAMES ── */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
