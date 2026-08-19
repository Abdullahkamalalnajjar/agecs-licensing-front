"use client";

import React, { useState } from "react";
import { postApiLicensesAdminByIdMigrate } from "@/client";

interface MigrateHwidModalProps {
  licenseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MigrateHwidModal({ licenseId, isOpen, onClose, onSuccess }: MigrateHwidModalProps) {
  const [newHwid, setNewHwid] = useState("");
  const [reason, setReason] = useState("");
  const [overrideLimit, setOverrideLimit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await postApiLicensesAdminByIdMigrate({
        path: { id: licenseId },
        body: { newHwid, reason, overrideLimit },
        throwOnError: false,
      });

      if ((res.data as any)?.isSuccess || res.response?.status === 204 || res.response?.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 1200);
      } else {
        setError((res.data as any)?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to migrate license.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setNewHwid("");
    setReason("");
    setOverrideLimit(false);
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal-container" style={{ maxWidth: 480, overflow: "hidden" }}>

        {/* Header */}
        <div className="modal-header" style={{ background: "linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--radius-md)",
              background: "var(--info-dim)", color: "var(--info)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <polyline points="7 23 3 19 7 15"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: "1.1rem", margin: 0 }}>Migrate HWID</h2>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Transfer license to a new hardware device</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={handleClose} disabled={loading}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

            {error && (
              <div className="alert-error">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1rem", background: "var(--success-dim)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)", color: "var(--success)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                HWID migrated successfully!
              </div>
            )}

            {/* Info callout */}
            <div style={{
              padding: "0.75rem 1rem",
              background: "var(--info-dim)",
              border: "1px solid rgba(59,130,246,0.25)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8rem",
              color: "var(--info)",
              display: "flex",
              gap: "0.6rem",
              alignItems: "flex-start",
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              This will consume one migration slot and link the license to the new hardware device.
            </div>

            {/* New HWID */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Hardware ID (HWID) *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. BFEBFBFF000906EA-WD-WCC4N7..."
                value={newHwid}
                onChange={e => setNewHwid(e.target.value)}
                required
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}
              />
            </div>

            {/* Reason */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reason (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Motherboard replacement, new PC..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            {/* Override limit toggle */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              background: overrideLimit ? "var(--warning-dim)" : "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              border: overrideLimit ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }} onClick={() => setOverrideLimit(!overrideLimit)}>
              <input
                type="checkbox"
                id="overrideLimit"
                checked={overrideLimit}
                onChange={e => setOverrideLimit(e.target.checked)}
                onClick={e => e.stopPropagation()}
                style={{ width: 16, height: 16, accentColor: "var(--warning)", cursor: "pointer" }}
              />
              <div>
                <label htmlFor="overrideLimit" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: overrideLimit ? "var(--warning)" : "var(--text-primary)", cursor: "pointer", margin: 0 }}>
                  Override Migration Limit
                </label>
                <span style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
                  Bypass the max migration count for this license
                </span>
              </div>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={handleClose} disabled={loading}>Cancel</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || success}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 15, height: 15 }} />Migrating…</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                  Migrate HWID
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
