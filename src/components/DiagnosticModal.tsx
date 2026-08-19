"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getApiLicensesAdminByIdDiagnostic } from "@/client";

interface DiagnosticModalProps {
  licenseId: string;
  isOpen: boolean;
  onClose: () => void;
}

function InfoRow({ label, value, mono, badge }: { label: string; value: any; mono?: boolean; badge?: "success" | "danger" | "warning" | "info" }) {
  const badgeColor = badge === "success" ? { bg: "var(--success-dim)", color: "var(--success)" }
    : badge === "danger"  ? { bg: "var(--danger-dim)",  color: "var(--danger)"  }
    : badge === "warning" ? { bg: "var(--warning-dim)", color: "var(--warning)" }
    : badge === "info"    ? { bg: "var(--info-dim)",    color: "var(--info)"    }
    : null;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
        {label}
      </span>
      {badge && badgeColor ? (
        <span style={{ padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700, background: badgeColor.bg, color: badgeColor.color }}>
          {String(value)}
        </span>
      ) : (
        <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)", fontFamily: mono ? "var(--font-mono)" : undefined, textAlign: "right", wordBreak: "break-all" }}>
          {value === null || value === undefined ? <span style={{ color: "var(--text-muted)" }}>—</span> : String(value)}
        </span>
      )}
    </div>
  );
}

export default function DiagnosticModal({ licenseId, isOpen, onClose }: DiagnosticModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDiagnostic = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getApiLicensesAdminByIdDiagnostic({ path: { id: licenseId }, throwOnError: false });
      const raw = (res.data as any);
      const value = raw?.value || raw;
      if (value) {
        setData(value);
      } else {
        setError("Failed to fetch diagnostic data.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [licenseId]);

  useEffect(() => {
    if (isOpen) fetchDiagnostic();
  }, [isOpen, fetchDiagnostic]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container medium" style={{ maxWidth: 580, overflow: "hidden" }}>

        {/* Header */}
        <div className="modal-header" style={{ background: "linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--radius-md)",
              background: "var(--warning-dim)", color: "var(--warning)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: "1.1rem", margin: 0 }}>Diagnostic Report</h2>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Full license status and health information</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              type="button"
              title="Refresh"
              onClick={fetchDiagnostic}
              disabled={loading}
              className="btn-ghost"
              style={{ padding: "0.35rem", display: "flex" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}>
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
            <button type="button" className="modal-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem", maxHeight: "70vh", overflowY: "auto" }}>

          {error && (
            <div className="alert-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[80, 60, 70, 50, 90, 65].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: 16, width: `${w}%`, borderRadius: 4 }} />
              ))}
            </div>
          ) : data ? (
            <>
              {/* Overview */}
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                  Overview
                </div>
                <InfoRow label="Provider" value={data.provider} />
                <InfoRow label="JanDrozd ID" value={data.janDrozdId} mono />
                <InfoRow label="Status" value={data.isActive ? "Active" : "Inactive"} badge={data.isActive ? "success" : "danger"} />
                <InfoRow label="Trial" value={data.isTrial ? "Yes" : "No"} badge={data.isTrial ? "warning" : undefined} />
                <InfoRow label="Created At" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : null} />
                <InfoRow label="Updated At" value={data.updatedAt ? new Date(data.updatedAt).toLocaleString() : null} />
              </div>

              {/* Customer & Product */}
              {(data.customer || data.product) && (
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1rem 1.25rem" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                    Customer & Product
                  </div>
                  {data.customer && (
                    <>
                      <InfoRow label="Client Name" value={data.customer.name} />
                      <InfoRow label="Client Email" value={data.customer.email} />
                    </>
                  )}
                  {data.product && (
                    <>
                      <InfoRow label="Product" value={data.product.name} />
                      <InfoRow label="Version" value={data.product.version} />
                    </>
                  )}
                </div>
              )}

              {/* Hardware IDs & Stats */}
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                  Hardware IDs & Stats
                </div>
                {data.stats && (
                  <>
                    <InfoRow label="Seats Used" value={`${data.stats.usedCount ?? 0} / ${data.stats.licenseCount ?? 1}`} />
                    <InfoRow label="Migrations Used" value={`${data.stats.migrationCount ?? 0} / ${data.stats.migrationLimit ?? 1}`} />
                  </>
                )}
                {data.hardwareIds && Array.isArray(data.hardwareIds) && data.hardwareIds.length > 0 && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Registered Devices</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {data.hardwareIds.map((hwid: string, i: number) => (
                        <div key={i} style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          padding: "0.4rem 0.75rem",
                          background: "var(--bg-surface)",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border)",
                          color: "var(--accent-light)",
                          wordBreak: "break-all",
                        }}>
                          {hwid}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              <p className="empty-state-title">No diagnostic data</p>
              <p className="empty-state-sub">Unable to retrieve data for this license</p>
            </div>
          )}

        </div>

        <div className="modal-footer" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
}
