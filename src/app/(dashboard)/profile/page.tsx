"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import StudentUpgradeModal from "@/components/StudentUpgradeModal";

const roleConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  SuperAdmin: { label: "Super Admin", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "👑" },
  Admin: { label: "Administrator", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", icon: "🛡️" },
  Sales: { label: "Sales", color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: "📊" },
  Student: { label: "Student", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: "🎓" },
  NormalUser: { label: "Normal User", color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: "👤" },
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const handleUpgradeSuccess = () => {
    setShowUpgradeModal(false);
    window.location.reload();
  };

  const rc = roleConfig[user.role] || roleConfig.NormalUser;
  const initials = user.email.substring(0, 2).toUpperCase();

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dashboard-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and account settings.</p>
        </div>
      </div>

      {/* Profile Hero Card */}
      <div style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        marginTop: "1.5rem",
      }}>
        {/* Banner gradient */}
        <div style={{
          height: "140px",
          background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 50%, #6366f1 100%)",
          position: "relative",
        }}>
          {/* Decorative dots */}
          <div style={{ position: "absolute", top: "20px", right: "24px", display: "flex", gap: "6px", opacity: 0.3 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: "white" }} />
            ))}
          </div>
          <div style={{ position: "absolute", bottom: "20px", left: "24px", display: "flex", gap: "6px", opacity: 0.2 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: "white" }} />
            ))}
          </div>
        </div>

        {/* Avatar + info */}
        <div style={{ padding: "0 2rem 2rem", position: "relative" }}>
          {/* Avatar overlapping the banner */}
          <div style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.25rem",
            fontWeight: "800",
            color: "white",
            border: "4px solid var(--bg-surface)",
            marginTop: "-50px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            letterSpacing: "1px",
          }}>
            {initials}
          </div>

          <div style={{ marginTop: "1rem" }}>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
              wordBreak: "break-all",
            }}>
              {user.email}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: "600",
                color: rc.color,
                background: rc.bg,
                border: `1px solid ${rc.color}33`,
              }}>
                <span>{rc.icon}</span> {rc.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1rem",
        marginTop: "1.5rem",
      }}>
        {/* Account ID card */}
        <div style={{
          padding: "1.25rem",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="m7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={{ fontSize: "0.8rem", fontWeight: "500", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Account ID</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <code style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              background: "var(--bg-elevated)",
              padding: "0.35rem 0.6rem",
              borderRadius: "var(--radius-sm)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {user.id}
            </code>
            <button
              onClick={copyId}
              title="Copy ID"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "0.35rem 0.5rem",
                cursor: "pointer",
                color: copied ? "var(--success)" : "var(--text-muted)",
                fontSize: "0.75rem",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Role card */}
        <div style={{
          padding: "1.25rem",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span style={{ fontSize: "0.8rem", fontWeight: "500", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Account Role</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>{rc.icon}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "600", color: rc.color }}>{rc.label}</span>
          </div>
        </div>

        {/* Email card */}
        <div style={{
          padding: "1.25rem",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <span style={{ fontSize: "0.8rem", fontWeight: "500", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email Address</span>
          </div>
          <span style={{
            fontSize: "0.95rem",
            fontWeight: "500",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {user.email}
          </span>
        </div>
      </div>

      {/* Actions Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: user.role === "NormalUser" ? "1fr 1fr" : "1fr",
        gap: "1rem",
        marginTop: "1.5rem",
      }}>
        {/* Session Card */}
        <div style={{
          padding: "1.5rem",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>Session</h3>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            You are currently logged in. Signing out will end your current session and require you to log in again.
          </p>
          <div>
            <button
              onClick={logout}
              className="btn-danger-ghost"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Upgrade Card */}
        {user.role === "NormalUser" && (
          <div style={{
            padding: "1.5rem",
            background: "linear-gradient(145deg, rgba(59,130,246,0.08), rgba(99,102,241,0.06))",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--accent-border)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Subtle decorative element */}
            <div style={{
              position: "absolute",
              top: "-20px",
              right: "-20px",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "radial-gradient(circle, var(--accent-dim), transparent)",
              opacity: 0.5,
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}>
              <span style={{ fontSize: "1.25rem" }}>🎓</span>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>Upgrade to Student</h3>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6, position: "relative" }}>
              Verify your <strong>.edu</strong> email address to unlock exclusive student discounts and special license pricing.
            </p>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>

      {showUpgradeModal && (
        <StudentUpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={handleUpgradeSuccess}
        />
      )}
    </div>
  );
}
