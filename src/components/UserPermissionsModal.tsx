"use client";

import { useEffect, useState } from "react";
import {
  getIdentityUsersByUserIdPermissionDetails, putIdentityUsersByUserIdPermissions, deleteIdentityUsersByUserIdPermissions,
  getIdentityPermissionCatalog,
} from "@/client";
import type { AppUserDto, PermissionSection } from "@/client/types.gen";
import { useToast } from "@/components/ToastProvider";

const SELF = "users:self:read";
const COLUMNS = ["read", "create", "update", "delete"] as const;
const COLUMN_LABELS: Record<(typeof COLUMNS)[number], string> = { read: "View", create: "Create", update: "Edit", delete: "Delete" };

type ApiError = { errors?: { description?: string }[]; title?: string } | undefined;
const errorText = (data: unknown, fallback: string) =>
  (data as ApiError)?.errors?.map((e) => e.description).filter(Boolean).join(", ") || (data as ApiError)?.title || fallback;

/**
 * A user's exact permissions, built from the API's permission catalog: per section View / Create / Edit / Delete,
 * and under each section the fields that can be edited on their own (Edit covers all of them). It starts from the
 * role's defaults; saving gives this user exactly what's ticked, "Reset to role defaults" goes back.
 * Admin always has everything. Changes apply on the user's next request.
 */
export default function UserPermissionsModal({ user, canEdit, onClose }: { user: AppUserDto; canEdit: boolean; onClose: () => void }) {
  const [catalog, setCatalog] = useState<PermissionSection[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [roleDefaults, setRoleDefaults] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [original, setOriginal] = useState<string[]>([]);
  const [openFields, setOpenFields] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { success } = useToast();

  useEffect(() => {
    if (!user.userId) return;
    Promise.all([
      getIdentityPermissionCatalog({ throwOnError: false }),
      getIdentityUsersByUserIdPermissionDetails({ path: { userId: user.userId }, throwOnError: false }),
    ])
      .then(([catalogRes, detailsRes]) => {
        if (!catalogRes.data?.isSuccess || !detailsRes.data?.isSuccess) { setError("Couldn't load this user's permissions."); return; }
        setCatalog(catalogRes.data.value ?? []);
        const v = detailsRes.data.value ?? {};
        setRoles(v.roles ?? []);
        setIsAdmin(!!v.isAdmin);
        setIsCustom(!!v.isCustom);
        setRoleDefaults(v.rolePermissions ?? []);
        setSelected(v.permissions ?? []);
        setOriginal(v.permissions ?? []);
      })
      .catch(() => setError("Couldn't load this user's permissions."))
      .finally(() => setLoading(false));
  }, [user.userId]);

  const editable = canEdit && !isAdmin && !saving;
  const has = (permission?: string | null) => !!permission && (isAdmin || selected.includes(permission));

  const sectionPermissions = (section: PermissionSection) =>
    [...(section.actions ?? []), ...(section.fields ?? [])].map((a) => a.permission).filter((p): p is string => !!p);
  const viewOf = (section: PermissionSection) => section.actions?.find((a) => a.key === "read")?.permission ?? null;

  // Any action or field needs the section to be visible; hiding the section takes everything in it away.
  const toggle = (section: PermissionSection, permission: string, on: boolean) => {
    const view = viewOf(section);
    setSelected((prev) => {
      if (permission === view && !on) return prev.filter((p) => !sectionPermissions(section).includes(p));
      const next = on ? [...prev, permission, ...(view ? [view] : [])] : prev.filter((p) => p !== permission);
      return Array.from(new Set(next));
    });
  };

  const sameSet = (a: string[], b: string[]) => [...new Set(a)].sort().join() === [...new Set(b)].sort().join();
  const changed = !sameSet(selected, original);
  const matchesRole = sameSet(selected.filter((p) => p !== SELF), roleDefaults.filter((p) => p !== SELF));

  const save = async () => {
    if (!user.userId) return;
    setSaving(true);
    setError("");
    try {
      // Only permissions the API knows (the catalog's and the role's); anything else is a leftover old name.
      const known = new Set([...catalog.flatMap(sectionPermissions), ...roleDefaults]);
      const body = selected.filter((p) => p !== SELF && known.has(p));
      const res = await putIdentityUsersByUserIdPermissions({ path: { userId: user.userId }, body, throwOnError: false });
      if (res.error || !(res.data as { isSuccess?: boolean } | undefined)?.isSuccess) {
        setError(errorText(res.data ?? res.error, "Couldn't save the permissions."));
        return;
      }
      success(`Permissions saved for ${user.email}.`);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const resetToRole = async () => {
    if (!user.userId) return;
    setSaving(true);
    setError("");
    try {
      const res = await deleteIdentityUsersByUserIdPermissions({ path: { userId: user.userId }, throwOnError: false });
      if (res.error || !res.data?.isSuccess) {
        setError(errorText(res.data ?? res.error, "Couldn't reset the permissions."));
        return;
      }
      success(`${user.email} is back to the ${roles.join(", ")} defaults.`);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const box = (section: PermissionSection, permission: string, label: string, disabled = false) => (
    <input type="checkbox" checked={has(permission)} disabled={!editable || disabled} title={permission} aria-label={label}
      onChange={(e) => toggle(section, permission, e.target.checked)}
      style={{ width: 16, height: 16, cursor: editable && !disabled ? "pointer" : "default" }} />
  );

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="modal-container medium" style={{ maxWidth: 820 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ margin: 0 }}>Permissions</h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {user.email} · role: {roles.join(", ") || "—"}
              {isCustom && !isAdmin && <span className="badge badge-warning" style={{ marginLeft: "0.5rem" }}>Customized</span>}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} disabled={saving} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert-error" role="alert">{error}</div>}
          <p style={{ margin: "0 0 0.85rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {isAdmin
              ? "Admin always has every permission. Change the user's role to limit what they can do."
              : "Starts from the role's defaults. Edit lets the user change everything in a section; untick it and open Fields to allow only some fields."}
          </p>

          {loading ? (
            <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-md)" }} />
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    {COLUMNS.map((c) => <th key={c} style={{ textAlign: "center" }}>{COLUMN_LABELS[c]}</th>)}
                    <th>Other</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((section) => {
                    const fields = section.fields ?? [];
                    const update = section.actions?.find((a) => a.key === "update")?.permission;
                    const fullEdit = has(update);
                    const fieldCount = fields.filter((f) => has(f.permission)).length;
                    const extras = (section.actions ?? []).filter((a) => !COLUMNS.includes(a.key as (typeof COLUMNS)[number]));
                    const open = openFields === section.key;
                    return [
                      <tr key={section.key}>
                        <td className="fw-medium" style={{ whiteSpace: "nowrap" }}>{section.label}</td>
                        {COLUMNS.map((c) => {
                          const action = section.actions?.find((a) => a.key === c);
                          return (
                            <td key={c} style={{ textAlign: "center" }}>
                              {action?.permission ? (
                                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" }}>
                                  {box(section, action.permission, `${section.label}: ${COLUMN_LABELS[c]}`)}
                                  {c === "update" && fields.length > 0 && (
                                    <button type="button" onClick={() => setOpenFields(open ? null : section.key ?? null)}
                                      style={{ border: "none", background: "none", padding: 0, fontSize: "0.7rem", color: "var(--accent)", cursor: "pointer", whiteSpace: "nowrap" }}>
                                      Fields{!fullEdit && fieldCount > 0 ? ` (${fieldCount})` : ""} {open ? "▴" : "▾"}
                                    </button>
                                  )}
                                </div>
                              ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                            </td>
                          );
                        })}
                        <td>
                          {extras.map((a) => a.permission && (
                            <label key={a.key} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", marginRight: "0.75rem" }}>
                              {box(section, a.permission, `${section.label}: ${a.label}`)}
                              {a.label}
                            </label>
                          ))}
                        </td>
                      </tr>,
                      open && (
                        <tr key={`${section.key}-fields`}>
                          <td colSpan={6} style={{ background: "var(--bg-elevated)" }}>
                            <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                              {fullEdit ? "Edit is ticked, so every field can be changed. Untick Edit to choose fields." : "The user can change only the ticked fields:"}
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.25rem" }}>
                              {fields.map((f) => f.permission && (
                                <label key={f.key} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", opacity: fullEdit ? 0.6 : 1 }}>
                                  <input type="checkbox" checked={fullEdit || has(f.permission)} disabled={!editable || fullEdit} title={f.permission}
                                    onChange={(e) => toggle(section, f.permission!, e.target.checked)} style={{ width: 15, height: 15 }} />
                                  {f.label}
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <div>
            {canEdit && !isAdmin && (isCustom || !matchesRole) && (
              <button type="button" className="btn-ghost" disabled={saving || loading}
                // Saved custom permissions are dropped on the server; unsaved changes just go back to the role's.
                onClick={isCustom ? resetToRole : () => setSelected(Array.from(new Set([...roleDefaults, SELF])))}
                title="Forget this user's custom permissions and use the role's defaults">
                Reset to role defaults
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>{canEdit && !isAdmin ? "Cancel" : "Close"}</button>
            {canEdit && !isAdmin && (
              <button type="button" className="btn-primary" onClick={save} disabled={loading || saving || !changed}>
                {saving ? "Saving..." : "Save permissions"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
