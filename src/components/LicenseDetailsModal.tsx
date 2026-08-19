"use client";

import React, { useState } from "react";

interface LicenseDetailsModalProps {
  license: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function LicenseDetailsModal({ license, isOpen, onClose }: LicenseDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !license) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(license.serial || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiryDate   = license.expiryDate ? new Date(license.expiryDate) : null;
  const daysLeft     = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86400000) : null;
  const isExpired    = daysLeft !== null && daysLeft <= 0;
  const expiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;

  const usedSeats  = license.usedCount   ?? 0;
  const totalSeats = license.licenseCount ?? 1;
  const usedMig    = license.migrationCount ?? 0;
  const totalMig   = license.migrationLimit ?? 1;
  const seatPct    = Math.min(100, (usedSeats / totalSeats) * 100);
  const migPct     = Math.min(100, (usedMig   / totalMig)   * 100);

  const avatarHue = ((license.name || "X").charCodeAt(0) * 7) % 360;
  const initials  = (license.name || license.email || "?").charAt(0).toUpperCase();

  /* ── helpers ── */
  const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      padding: "1rem 1.25rem",
      ...style,
    }}>
      {children}
    </div>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>
      {children}
    </div>
  );

  const Row = ({ label, value, color, mono }: { label: string; value: React.ReactNode; color?: string; mono?: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0", borderBottom: "1px solid var(--border)", gap: "1rem" }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: color || "var(--text-primary)", textAlign: "right", fontFamily: mono ? "var(--font-mono)" : undefined, wordBreak: "break-all" }}>
        {value}
      </span>
    </div>
  );

  const ProgressBar = ({ pct, color }: { pct: number; color: string }) => (
    <div style={{ height: 6, background: "var(--bg-surface)", borderRadius: 99, overflow: "hidden", marginTop: "0.35rem" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container medium" style={{ maxWidth: 600, overflow: "hidden" }}>

        {/* ── HEADER ─── */}
        <div style={{
          padding: "1.5rem 1.75rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          background: "linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)",
          position: "relative",
        }}>
          <button className="modal-close" onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem" }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `hsl(${avatarHue}, 60%, 35%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem", fontWeight: 700, color: "#fff",
              border: "3px solid var(--border-strong)", flexShrink: 0,
            }}>
              {initials}
            </div>

            {/* Identity */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {license.name || "Unknown Client"}
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {license.email || "No email"}
              </p>
            </div>

            {/* Status badges */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
              <span className={`badge ${license.isActive ? "badge-success" : "badge-danger"}`}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }}/>
                {license.isActive ? "Active" : "Inactive"}
              </span>
              {license.isTrial && <span className="badge badge-warning">Trial</span>}
            </div>
          </div>
        </div>

        {/* ── BODY ─── */}
        <div className="modal-body" style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Serial Key */}
          <Card style={{ borderColor: "var(--accent-border)", boxShadow: "0 2px 16px var(--accent-glow)" }}>
            <SectionLabel>Serial Key</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{
                flex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: "0.92rem",
                fontWeight: 700,
                color: "var(--accent-light)",
                letterSpacing: "0.04em",
                wordBreak: "break-all",
                lineHeight: 1.5,
              }}>
                {license.serial || "N/A"}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  border: copied ? "1px solid rgba(16,185,129,0.4)" : "1px solid var(--border-strong)",
                  background: copied ? "var(--success-dim)" : "var(--bg-surface)",
                  color: copied ? "var(--success)" : "var(--text-secondary)",
                  cursor: "pointer", fontSize: "0.78rem", fontWeight: 500,
                  transition: "all 0.2s ease", whiteSpace: "nowrap",
                }}
              >
                {copied ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</>
                )}
              </button>
            </div>
          </Card>

          {/* 2-col details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>

            {/* License Info */}
            <Card>
              <SectionLabel>License Info</SectionLabel>
              <Row label="Product"  value={license.productName || "—"} />
              <Row label="Type"     value={
                <span className={`badge ${license.type === "Edu" ? "badge-info" : license.type === "All" ? "badge-accent" : "badge-neutral"}`}>
                  {license.type || "Basic"}
                </span>
              } />
              <Row label="Added By" value={license.addedByName || "System"} />
              <Row label="HWID Salt" value={license.hwidSalt || "—"} mono />
            </Card>

            {/* Expiry */}
            <Card>
              <SectionLabel>Expiry</SectionLabel>
              <Row
                label="Expiry Date"
                value={expiryDate
                  ? expiryDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                  : "Lifetime"}
                color={isExpired ? "var(--danger)" : expiringSoon ? "var(--warning)" : expiryDate ? "var(--text-primary)" : "var(--success)"}
              />
              {daysLeft !== null && (
                <Row
                  label={isExpired ? "Expired" : "Remaining"}
                  value={isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                  color={isExpired ? "var(--danger)" : expiringSoon ? "var(--warning)" : "var(--text-secondary)"}
                />
              )}
              {!expiryDate && (
                <Row label="Status" value="Never expires" color="var(--success)" />
              )}
            </Card>
          </div>

          {/* Usage bars */}
          <Card>
            <SectionLabel>Usage</SectionLabel>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {/* Seats */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>Seats Used</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: seatPct >= 90 ? "var(--danger)" : seatPct >= 70 ? "var(--warning)" : "var(--text-primary)" }}>
                    {usedSeats} / {totalSeats}
                  </span>
                </div>
                <ProgressBar pct={seatPct} color={seatPct >= 90 ? "var(--danger)" : seatPct >= 70 ? "var(--warning)" : "var(--accent)"} />
              </div>

              {/* Migrations */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>Migrations Used</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: migPct >= 90 ? "var(--danger)" : migPct >= 70 ? "var(--warning)" : "var(--text-primary)" }}>
                    {usedMig} / {totalMig}
                  </span>
                </div>
                <ProgressBar pct={migPct} color={migPct >= 90 ? "var(--danger)" : migPct >= 70 ? "var(--warning)" : "var(--info)"} />
              </div>
            </div>
          </Card>

          {/* Registered HWIDs */}
          {license.clients && license.clients.length > 0 && (
            <Card>
              <SectionLabel>Registered Devices ({license.clients.length})</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: 180, overflowY: "auto" }}>
                {license.clients.map((c: any, i: number) => (
                  <div key={c.id || i} style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.4rem 0.75rem",
                    background: "var(--bg-surface)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                  }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-dim)", color: "var(--accent-light)", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-primary)", wordBreak: "break-all", flex: 1 }}>
                      {c.hwid || c}
                    </span>
                    {c.friendlyName && (
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>({c.friendlyName})</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>

        {/* ── FOOTER ─── */}
        <div className="modal-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.73rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {license.id ? `${license.id.substring(0, 20)}…` : ""}
          </span>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
}
