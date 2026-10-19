"use client";

import { useState } from "react";
import type { LicenseDto } from "@/client/types.gen";

type Props = {
  isOpen: boolean;
  name: string;
  licenses: LicenseDto[];
  productName: (l: LicenseDto) => string;
  onClose: () => void;
  onDetails: (l: LicenseDto) => void;
  onHwids: (licenseId: string) => void;
  onMigrate: (licenseId: string) => void;
  onDiagnostic: (licenseId: string) => void;
};

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Lifetime";

/**
 * The serials inside a package. Devices, migration and diagnostics belong to each serial (each is its own
 * JanDrozd customer), so those actions are here per license; edits, renewals, revoke and delete apply to the
 * whole package from the licenses table.
 */
export default function PackageLicensesModal({ isOpen, name, licenses, productName, onClose, onDetails, onHwids, onMigrate, onDiagnostic }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  if (!isOpen) return null;

  const copy = (l: LicenseDto) => {
    navigator.clipboard.writeText(l.serial || "");
    setCopiedId(l.id ?? null);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container medium" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ margin: 0 }}>{name}</h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Package · {licenses.length} serial{licenses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {licenses.map((l) => (
            <div key={l.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--bg-elevated)", padding: "0.85rem 1rem", display: "flex", flexDirection: "column", gap: "0.55rem", opacity: l.isActive === false ? 0.65 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{productName(l)}</span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {l.isActive === false ? "Revoked · " : ""}Expires {l.willExpire === false ? "never" : fmtDate(l.expiryDate)}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <code style={{ flex: 1, minWidth: 0, background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", padding: "0.45rem 0.7rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 700, wordBreak: "break-all", userSelect: "all" }}>
                  {l.serial || "N/A"}
                </code>
                <button type="button" className="btn-ghost" onClick={() => copy(l)} disabled={!l.serial}>{copiedId === l.id ? "Copied!" : "Copy"}</button>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                <button type="button" className="btn-ghost pr-btn-sm" onClick={() => onDetails(l)}>Details</button>
                <button type="button" className="btn-ghost pr-btn-sm" onClick={() => onHwids(l.id!)}>Devices (HWIDs)</button>
                <button type="button" className="btn-ghost pr-btn-sm" onClick={() => onMigrate(l.id!)}>Migrate HWID</button>
                <button type="button" className="btn-ghost pr-btn-sm" onClick={() => onDiagnostic(l.id!)}>Diagnostic</button>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
