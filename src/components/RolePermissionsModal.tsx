"use client";

import { useEffect, useState } from "react";
import {
  getIdentityRolesByRoleIdPermissions, putIdentityRolesByRoleIdPermissions, deleteIdentityRolesByRoleIdPermissions,
  getIdentityPermissionCatalog,
} from "@/client";
import type { PermissionSection, RoleDto } from "@/client/types.gen";
import { useToast } from "@/components/ToastProvider";
import PermissionGrid, { sectionPermissions } from "@/components/PermissionGrid";

type ApiError = { errors?: { description?: string }[]; title?: string } | undefined;
const errorText = (data: unknown, fallback: string) =>
  (data as ApiError)?.errors?.map((e) => e.description).filter(Boolean).join(", ") || (data as ApiError)?.title || fallback;

/**
 * A role's permissions: what its users get unless a user has their own custom permissions.
 * Saving sets exactly what's ticked; "Reset to defaults" goes back to the built-in defaults. Admin can't be changed.
 */
export default function RolePermissionsModal({ role, canEdit, onClose }: { role: RoleDto; canEdit: boolean; onClose: () => void }) {
  const [catalog, setCatalog] = useState<PermissionSection[]>([]);
  const [name, setName] = useState(role.name ?? "");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [defaults, setDefaults] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [original, setOriginal] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { success } = useToast();

  useEffect(() => {
    if (!role.id) return;
    Promise.all([
      getIdentityPermissionCatalog({ throwOnError: false }),
      getIdentityRolesByRoleIdPermissions({ path: { roleId: role.id }, throwOnError: false }),
    ])
      .then(([catalogRes, detailsRes]) => {
        if (!catalogRes.data?.isSuccess || !detailsRes.data?.isSuccess) { setError("Couldn't load this role's permissions."); return; }
        setCatalog(catalogRes.data.value ?? []);
        const v = detailsRes.data.value ?? {};
        if (v.name) setName(v.name);
        setIsAdmin(!!v.isAdmin);
        setIsCustom(!!v.isCustom);
        setUserCount(v.userCount ?? 0);
        setDefaults(v.defaultPermissions ?? []);
        setSelected(v.permissions ?? []);
        setOriginal(v.permissions ?? []);
      })
      .catch(() => setError("Couldn't load this role's permissions."))
      .finally(() => setLoading(false));
  }, [role.id]);

  const editable = canEdit && !isAdmin && !saving;
  const sameSet = (a: string[], b: string[]) => [...new Set(a)].sort().join() === [...new Set(b)].sort().join();
  const changed = !sameSet(selected, original);
  const matchesDefaults = sameSet(selected, defaults);

  const save = async () => {
    if (!role.id) return;
    setSaving(true);
    setError("");
    try {
      // Only permissions the API knows (the catalog's and the defaults); anything else is a leftover old name.
      const known = new Set([...catalog.flatMap(sectionPermissions), ...defaults]);
      const body = selected.filter((p) => known.has(p));
      const res = await putIdentityRolesByRoleIdPermissions({ path: { roleId: role.id }, body, throwOnError: false });
      if (res.error || !(res.data as { isSuccess?: boolean } | undefined)?.isSuccess) {
        setError(errorText(res.data ?? res.error, "Couldn't save the permissions."));
        return;
      }
      success(`Permissions saved for the ${name} role.`);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!role.id) return;
    setSaving(true);
    setError("");
    try {
      const res = await deleteIdentityRolesByRoleIdPermissions({ path: { roleId: role.id }, throwOnError: false });
      if (res.error || !res.data?.isSuccess) {
        setError(errorText(res.data ?? res.error, "Couldn't reset the permissions."));
        return;
      }
      success(`The ${name} role is back to its default permissions.`);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="modal-container medium" style={{ maxWidth: 820 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ margin: 0 }}>Permissions · {name}</h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {loading ? "Loading…" : `${userCount} user${userCount !== 1 ? "s" : ""}`}
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
              ? "Admin always has every permission."
              : "Users with this role get these permissions, unless a user has their own custom permissions."}
          </p>

          {loading ? (
            <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-md)" }} />
          ) : (
            <PermissionGrid catalog={catalog} selected={selected} onChange={setSelected} editable={editable} allChecked={isAdmin}
              fieldsNote="Users with this role can change only the ticked fields:" />
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <div>
            {canEdit && !isAdmin && (isCustom || !matchesDefaults) && (
              <button type="button" className="btn-ghost" disabled={saving || loading}
                // Saved changes are dropped on the server; unsaved changes just go back to the defaults.
                onClick={isCustom ? resetToDefaults : () => setSelected(defaults)}
                title="Forget this role's changes and use its built-in defaults">
                Reset to defaults
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
