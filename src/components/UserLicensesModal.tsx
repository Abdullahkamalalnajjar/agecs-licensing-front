"use client";

import { useEffect, useState } from "react";
import { getApiLicensesUsersByUserId } from "@/client";
import type { AppUserDto, LicenseDto } from "@/client/types.gen";
import LicenseDetailsModal from "./LicenseDetailsModal";
import "./user-licenses-modal.css";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

type Status = { label: string; tone: "active" | "expired" | "revoked" | "trial" };

const statusOf = (l: LicenseDto): Status => {
  if (!l.isActive) return { label: "Revoked", tone: "revoked" };
  if (l.isExpired) return { label: "Expired", tone: "expired" };
  if (l.isTrial) return { label: "Trial", tone: "trial" };
  return { label: "Active", tone: "active" };
};

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : null;

/** Admin view of one user's licenses (GET /api/licenses/users/{userId}); click a license for its full details. */
export default function UserLicensesModal({ user, onClose }: { user: AppUserDto; onClose: () => void }) {
  const [licenses, setLicenses] = useState<LicenseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<LicenseDto | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user.userId) return;
    let cancelled = false;
    getApiLicensesUsersByUserId({ baseUrl, path: { userId: user.userId }, throwOnError: false })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.isSuccess) setLicenses(res.data.value ?? []);
        else setError(res.data?.errors?.map((e) => e.description).filter(Boolean).join(", ") || "Failed to load licenses.");
      })
      .catch((err: unknown) => { if (!cancelled) setError((err instanceof Error && err.message) || "Failed to load licenses."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user.userId]);

  const copySerial = (license: LicenseDto) => {
    if (!license.serial) return;
    navigator.clipboard.writeText(license.serial);
    setCopiedId(license.id ?? null);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const activeCount = licenses.filter((l) => statusOf(l).tone === "active" || statusOf(l).tone === "trial").length;

  return (
    <>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-container wide ul-modal">
          <div className="modal-header">
            <div>
              <h2 className="modal-title" style={{ margin: 0 }}>Licenses</h2>
              <p className="ul-sub">{user.email}</p>
            </div>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className="modal-body">
            {error && <div className="alert-error">{error}</div>}

            {loading ? (
              <div className="ul-list">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
              </div>
            ) : !error && licenses.length === 0 ? (
              <div className="ul-empty">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <p>This user has no licenses.</p>
              </div>
            ) : (
              <>
                {!error && (
                  <p className="ul-summary">
                    {licenses.length} license{licenses.length === 1 ? "" : "s"} · {activeCount} active
                  </p>
                )}
                <div className="ul-list">
                  {licenses.map((license) => {
                    const status = statusOf(license);
                    const expiry = license.willExpire === false ? "Lifetime" : fmtDate(license.expiryDate) ?? "No expiry";
                    const devices = license.clients?.length ?? 0;
                    return (
                      <div key={license.id} className="ul-row">
                        <button type="button" className="ul-main" onClick={() => setSelected(license)} title="View license details">
                          <span className="ul-product">{license.productName || "Unknown product"}</span>
                          <span className="ul-meta">
                            <span>{license.type || (license.isTrial ? "trial" : "basic")}</span>
                            <span>Expires: {expiry}</span>
                            <span>Devices: {devices}/{license.licenseCount ?? 1}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          className="ul-serial"
                          onClick={() => copySerial(license)}
                          title={license.serial ? "Copy serial" : undefined}
                          disabled={!license.serial}
                        >
                          {copiedId === license.id ? "Copied!" : license.serial || "No serial"}
                        </button>

                        <span className={`ul-status is-${status.tone}`}>{status.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      <LicenseDetailsModal license={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
