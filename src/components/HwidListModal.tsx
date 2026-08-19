"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getApiLicensesAdminByIdHwids, postApiLicensesAdminByIdHwids, deleteApiLicensesAdminByIdHwidsByHwid } from "@/client";

interface HwidListModalProps {
  licenseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function HwidListModal({ licenseId, isOpen, onClose }: HwidListModalProps) {
  const [hwids, setHwids] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newHwid, setNewHwid] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchHwids = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getApiLicensesAdminByIdHwids({ path: { id: licenseId }, throwOnError: false });
      const raw = (res.data as any);
      const value = raw?.value || raw;
      if (value) {
        setHwids(value.hwids || []);
        setSource(value.source || "");
      } else {
        setError("Failed to fetch HWIDs");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [licenseId]);

  useEffect(() => {
    if (isOpen) {
      fetchHwids();
    }
  }, [isOpen, fetchHwids]);

  const handleAddHwid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHwid.trim()) return;
    setAdding(true);
    try {
      const res = await postApiLicensesAdminByIdHwids({
        path: { id: licenseId },
        body: { hwid: newHwid.trim() },
        throwOnError: false,
      });
      if ((res.data as any)?.isSuccess || res.response?.status === 204 || res.response?.status === 200) {
        setNewHwid("");
        fetchHwids();
      } else {
        setError((res.data as any)?.errors?.map((e: any) => e.description).filter(Boolean).join(", ") || "Failed to add HWID.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveHwid = async (hwid: string) => {
    if (!confirm("Remove this Hardware ID from the license?")) return;
    try {
      const res = await deleteApiLicensesAdminByIdHwidsByHwid({ path: { id: licenseId, hwid }, throwOnError: false });
      if ((res.data as any)?.isSuccess || res.response?.status === 204 || res.response?.status === 200) {
        fetchHwids();
      } else {
        setError((res.data as any)?.errors?.map((e: any) => e.description).filter(Boolean).join(", ") || "Failed to remove HWID.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  const handleCopy = (hwid: string) => {
    navigator.clipboard.writeText(hwid);
    setCopied(hwid);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container medium" style={{ maxWidth: 560, overflow: "hidden" }}>

        {/* Header */}
        <div className="modal-header" style={{ background: "linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--radius-md)",
              background: "var(--accent-dim)", color: "var(--accent-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                <rect x="9" y="9" width="6" height="6"/>
                <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
                <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
                <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
                <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: "1.1rem", margin: 0 }}>
                Hardware IDs
                {source && <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.5rem" }}>via {source}</span>}
              </h2>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {loading ? "Loading…" : `${hwids.length} device${hwids.length !== 1 ? "s" : ""} registered`}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {error && (
            <div className="alert-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
              <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
            </div>
          )}

          {/* Add new HWID */}
          <form onSubmit={handleAddHwid} style={{ display: "flex", gap: "0.6rem" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Add new Hardware ID (HWID)…"
              value={newHwid}
              onChange={e => setNewHwid(e.target.value)}
              required
              style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={adding || !newHwid.trim()}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}
            >
              {adding ? (
                <span className="spinner" style={{ width: 14, height: 14 }} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              )}
              Add HWID
            </button>
          </form>

          {/* HWID List */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 52, borderRadius: "var(--radius-md)" }} />
              ))}
            </div>
          ) : hwids.length === 0 ? (
            <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                <rect x="9" y="9" width="6" height="6"/>
              </svg>
              <p className="empty-state-title">No Hardware IDs registered</p>
              <p className="empty-state-sub">Add the first HWID using the input above</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 300, overflowY: "auto" }}>
              {hwids.map((hwid, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  transition: "background 0.15s ease",
                }}>
                  {/* Index badge */}
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "var(--accent-dim)", color: "var(--accent-light)",
                    fontSize: "0.7rem", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>

                  {/* HWID text */}
                  <span style={{
                    flex: 1,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.78rem",
                    color: "var(--text-primary)",
                    wordBreak: "break-all",
                    lineHeight: 1.4,
                  }}>
                    {hwid}
                  </span>

                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(hwid)}
                    title="Copy HWID"
                    style={{
                      flexShrink: 0,
                      width: 28, height: 28,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      color: copied === hwid ? "var(--success)" : "var(--text-muted)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {copied === hwid ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveHwid(hwid)}
                    title="Remove HWID"
                    style={{
                      flexShrink: 0,
                      width: 28, height: 28,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "var(--danger-dim)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      color: "var(--danger)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              ))}
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
