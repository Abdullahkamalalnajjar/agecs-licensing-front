"use client";

import React, { useState } from "react";
import { postApiLicensesByIdRenew } from "@/client";

interface RenewLicenseModalProps {
  licenseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RenewLicenseModal({ licenseId, isOpen, onClose, onSuccess }: RenewLicenseModalProps) {
  const [period, setPeriod] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await postApiLicensesByIdRenew({
        path: { id: licenseId },
        body: { period },
        throwOnError: false,
      });

      if ((res.data as any)?.isSuccess || res.response?.status === 200 || res.response?.status === 204) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 1200);
      } else {
        setError((res.data as any)?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to renew license.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setSuccess(false);
    onClose();
  };

  const presets = [1, 3, 6, 12];

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !loading) handleClose(); }}>
      <div className="modal-container" style={{ maxWidth: 420, overflow: "hidden" }}>

        {/* Header */}
        <div className="modal-header" style={{ background: "linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--radius-md)",
              background: "var(--success-dim)", color: "var(--success)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: "1.1rem", margin: 0 }}>Renew License</h2>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Extend the license expiry date</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={handleClose} disabled={loading}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

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
                License renewed successfully!
              </div>
            )}

            {/* Quick presets */}
            <div>
              <label className="form-label">Renewal Period</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {presets.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "var(--radius-md)",
                      border: period === p ? "1px solid var(--accent)" : "1px solid var(--border-strong)",
                      background: period === p ? "var(--accent-dim)" : "var(--bg-elevated)",
                      color: period === p ? "var(--accent-light)" : "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {p}mo
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={120}
                  value={period}
                  onChange={e => setPeriod(parseInt(e.target.value) || 1)}
                  required
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>months</span>
              </div>
            </div>

            {/* Summary */}
            <div style={{
              padding: "0.875rem 1rem",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
            }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>+{period} {period === 1 ? "month" : "months"}</span> will be added to the current expiry date.
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
                <><span className="spinner" style={{ width: 15, height: 15 }} />Renewing…</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  Renew License
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
