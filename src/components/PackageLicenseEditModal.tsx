"use client";

import { useEffect, useState } from "react";
import { putApiLicensesPackageGroupsByPackageGroupId } from "@/client";
import type { LicenseDto } from "@/client/types.gen";
import { usePermissions } from "@/components/AuthProvider";

type Props = {
  isOpen: boolean;
  /** The package license entry (kind "package") from the licenses list. */
  packageLicense: LicenseDto | null;
  name: string;
  onClose: () => void;
  onSuccess: () => void;
};

/** Edits what a package's licenses share, applied to every one of them (PUT /api/licenses/package-groups/{id}). */
export default function PackageLicenseEditModal({ isOpen, packageLicense, name, onClose, onSuccess }: Props) {
  const packageGroupId = packageLicense?.id ?? null;
  const serialCount = packageLicense?.licenses?.length ?? 0;
  const [form, setForm] = useState({ name: "", email: "", hwidSalt: "", licenseCount: 1, migrationLimit: 1, isTrial: false, isActive: true });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const serials = packageLicense?.licenses ?? [];
  const [error, setError] = useState("");
  const { canField } = usePermissions();
  const canClient = canField("licenses", "client");

  useEffect(() => {
    if (!isOpen || !packageLicense) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: packageLicense.name || "",
      email: packageLicense.email || "",
      hwidSalt: packageLicense.hwidSalt || "",
      licenseCount: packageLicense.licenseCount || 1,
      migrationLimit: packageLicense.migrationLimit ?? 1,
      isTrial: !!packageLicense.isTrial,
      isActive: packageLicense.isActive !== false,
    });
    setError("");
  }, [isOpen, packageLicense]);

  if (!isOpen || !packageGroupId) return null;

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await putApiLicensesPackageGroupsByPackageGroupId({
        path: { packageGroupId },
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          hwidSalt: form.hwidSalt.trim(),
          licenseCount: Number(form.licenseCount) || 1,
          migrationLimit: Math.max(0, Number(form.migrationLimit) || 0),
          isTrial: form.isTrial,
          isActive: form.isActive,
        },
        throwOnError: false,
      });
      if (!res.data?.isSuccess) {
        const err = res.error as { title?: string; errors?: { description?: string }[] } | undefined;
        setError(res.data?.errors?.map((x) => x.description).filter(Boolean).join(", ")
          || err?.errors?.map?.((x) => x.description).filter(Boolean).join(", ") || err?.title || "Failed to update the package.");
        return;
      }
      const failed = res.data.value?.failed ?? [];
      if (failed.length > 0) {
        setError(`Saved, but these serials weren't updated: ${failed.map((f) => `${f.productName}: ${f.reason}`).join("; ")}`);
        onSuccess();
        return;
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to update the package.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="modal-container medium">
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ margin: 0 }}>Edit package</h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>{name} · applies to all {serialCount} serial{serialCount !== 1 ? "s" : ""}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} disabled={saving} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert-error" role="alert">{error}</div>}
          <form id="packageLicenseEditForm" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="plName">Client Name *</label>
                <input id="plName" className="form-input" required value={form.name} onChange={(e) => set({ name: e.target.value })} disabled={!canClient} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="plEmail">License Email</label>
                <input id="plEmail" type="email" className="form-input" value={form.email} onChange={(e) => set({ email: e.target.value })} disabled={!canClient} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="plSalt">Username (HWID salt) *</label>
              <input id="plSalt" className="form-input" required maxLength={500} spellCheck={false} style={{ fontFamily: "var(--font-mono)" }}
                value={form.hwidSalt} onChange={(e) => set({ hwidSalt: e.target.value })} disabled={!canClient} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="plSeats">License Count (Seats) *</label>
                <input id="plSeats" type="number" min={1} className="form-input" required value={form.licenseCount} onChange={(e) => set({ licenseCount: Number(e.target.value) })} disabled={!canField("licenses", "seats")} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="plMig">Migration Limit *</label>
                <input id="plMig" type="number" min={0} className="form-input" required value={form.migrationLimit} onChange={(e) => set({ migrationLimit: Number(e.target.value) })} disabled={!canField("licenses", "migrationLimit")} />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", cursor: "pointer" }}>
              <input type="checkbox" checked={form.isTrial} onChange={(e) => set({ isTrial: e.target.checked })} disabled={!canField("licenses", "trial")} style={{ width: 18, height: 18 }} />
              Trial licenses (Evaluation / Demo)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", cursor: "pointer" }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} disabled={!canField("licenses", "active")} style={{ width: 18, height: 18 }} />
              Licenses are active {form.isActive ? "" : "(revoked — the client can't use them)"}
            </label>
            <div>
              <p className="form-label" style={{ marginBottom: "0.5rem" }}>Serials in this package</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {serials.map((l) => (
                  <li key={l.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.55rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", opacity: l.isActive === false ? 0.65 : 1 }}>
                    <span style={{ minWidth: 0, flex: "0 0 auto", fontWeight: 600, fontSize: "0.85rem" }}>{l.productName || "Product"}</span>
                    <code style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", userSelect: "all" }} title={l.serial ?? undefined}>
                      {l.serial || "N/A"}
                    </code>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {l.willExpire === false || !l.expiryDate ? "Lifetime" : new Date(l.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <button type="button" className="btn-ghost pr-btn-sm" disabled={!l.serial}
                      onClick={() => {
                        navigator.clipboard.writeText(l.serial || "");
                        setCopiedId(l.id ?? null);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}>
                      {copiedId === l.id ? "Copied!" : "Copy"}
                    </button>
                  </li>
                ))}
              </ul>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Each serial keeps its own product and expiry date. Use Renew to extend them all.
              </p>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="packageLicenseEditForm" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}
