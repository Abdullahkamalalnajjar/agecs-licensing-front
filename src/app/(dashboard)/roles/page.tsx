"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getIdentityRoles, postIdentityRoles, putIdentityRolesByRoleId, deleteIdentityRolesByRoleId } from "@/client";
import { client } from "@/client/client.gen";
import type { RoleDto } from "@/client/types.gen";
import { usePermissions } from "@/components/AuthProvider";
import RolePermissionsModal from "@/components/RolePermissionsModal";
import { P } from "@/lib/permissions";

const errorText = (data: unknown, fallback: string) => {
  const d = data as { errors?: unknown; title?: string } | undefined;
  if (Array.isArray(d?.errors)) return d.errors.map((e: { description?: string }) => e.description).filter(Boolean).join(", ") || fallback;
  if (d?.errors && typeof d.errors === "object") return Object.values(d.errors as Record<string, string[]>).flat().join(" ") || fallback;
  return d?.title || fallback;
};

/**
 * Lists the identity roles and lets an admin add, rename and delete their own roles.
 * Built-in roles (isSystem) can be renamed, after a warning, but not deleted: the code checks them by name.
 */
export default function RolesPage() {
  const { can, canField } = usePermissions();
  const canCreate = can(P.roles.create);
  const canRename = canField("roles", "name");
  const canDelete = can(P.roles.delete);
  const canViewPermissions = can(P.roles.read);
  const canEditPermissions = canField("roles", "permissions");
  const [permissionsRole, setPermissionsRole] = useState<RoleDto | null>(null);
  const router = useRouter();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    client.setConfig({ baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003", auth: token });

    setLoading(true);
    try {
      const res = await getIdentityRoles({ throwOnError: false });
      if (res.data?.isSuccess) setRoles(res.data.value ?? []);
      else setError(res.response?.status === 403 ? "You don't have permission to manage roles." : errorText(res.error ?? res.data, "Failed to load roles."));
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const addRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setError("");
    try {
      const res = await postIdentityRoles({ body: { name }, throwOnError: false });
      if (res.error || !res.data?.isSuccess) { setError(errorText(res.error ?? res.data, "Failed to add the role.")); return; }
      setNewName("");
      fetchRoles();
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to add the role.");
    } finally {
      setAdding(false);
    }
  };

  const saveRename = async (role: RoleDto) => {
    const name = editName.trim();
    if (!name || name === role.name) { setEditingId(null); return; }
    if (role.isSystem && !confirm(
      `"${role.name}" is a built-in role. The app checks it by name, so after renaming it its users lose the access that comes with "${role.name}" until the code is updated. Rename it anyway?`
    )) return;
    setBusyId(role.id!);
    setError("");
    try {
      const res = await putIdentityRolesByRoleId({ path: { roleId: role.id! }, body: { name }, throwOnError: false });
      if (res.error || !res.data?.isSuccess) { setError(errorText(res.error ?? res.data, "Failed to rename the role.")); return; }
      setEditingId(null);
      fetchRoles();
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to rename the role.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteRole = async (role: RoleDto) => {
    setBusyId(role.id!);
    setError("");
    try {
      const res = await deleteIdentityRolesByRoleId({ path: { roleId: role.id! }, throwOnError: false });
      if (res.error || !res.data?.isSuccess) { setError(errorText(res.error ?? res.data, "Failed to delete the role.")); return; }
      setConfirmDeleteId(null);
      fetchRoles();
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to delete the role.");
    } finally {
      setBusyId(null);
    }
  };

  const customCount = roles.filter((r) => !r.isSystem).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Roles</h1>
          <p className="page-subtitle">
            {loading ? "Loading…" : `${roles.length} role${roles.length !== 1 ? "s" : ""} · ${customCount} custom`}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {canCreate && <form onSubmit={addRole} style={{ display: "flex", gap: "0.6rem", marginBottom: "0.5rem", maxWidth: 520 }}>
        <input
          className="form-input"
          placeholder="New role name, e.g. Support"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={256}
          aria-label="New role name"
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-primary" disabled={adding || !newName.trim()}>
          {adding ? "Adding…" : "Add role"}
        </button>
      </form>}
      <p style={{ margin: "0 0 1.25rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
        A new role starts with no permissions: set them with 🔑, then assign the role to users from the Users page. Built-in roles can&apos;t be deleted, and renaming one affects its users&apos; access.
      </p>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 3 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "20px", width: j === 0 ? "140px" : "80px" }} /></td>
                  ))}
                </tr>
              ))
            ) : roles.length === 0 ? (
              <tr><td colSpan={3}><div className="empty-state"><p className="empty-state-title">No roles found</p></div></td></tr>
            ) : (
              roles.map((role) => {
                const busy = busyId === role.id;
                const isEditing = editingId === role.id;
                return (
                  <tr key={role.id}>
                    <td className="fw-medium">
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editName}
                          autoFocus
                          maxLength={256}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); saveRename(role); }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          aria-label={`New name for ${role.name}`}
                          style={{ maxWidth: 260 }}
                        />
                      ) : role.name}
                    </td>
                    <td>
                      {role.isSystem
                        ? <span className="badge badge-neutral" title="Used by the system by name; can't be deleted">Built-in</span>
                        : <span className="badge badge-success">Custom</span>}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="table-actions">
                          <button type="button" className="btn-primary" onClick={() => saveRename(role)} disabled={busy || !editName.trim()}>
                            {busy ? "Saving…" : "Save"}
                          </button>
                          <button type="button" className="btn-ghost" onClick={() => setEditingId(null)} disabled={busy}>Cancel</button>
                        </div>
                      ) : confirmDeleteId === role.id ? (
                        <div className="table-actions">
                          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Delete {role.name}?</span>
                          <button type="button" className="btn-danger-ghost" onClick={() => deleteRole(role)} disabled={busy}>
                            {busy ? "Deleting…" : "Delete"}
                          </button>
                          <button type="button" className="btn-ghost" onClick={() => setConfirmDeleteId(null)} disabled={busy}>Cancel</button>
                        </div>
                      ) : (
                        <div className="table-actions">
                          {canViewPermissions && (
                            <button
                              type="button"
                              onClick={() => setPermissionsRole(role)}
                              title="Permissions"
                              aria-label={`Permissions for ${role.name}`}
                              style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 34, height: 34, borderRadius: "var(--radius-md)",
                                border: "1px solid var(--border-strong)", background: "var(--bg-elevated)",
                                color: "var(--text-secondary)", cursor: "pointer",
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" /></svg>
                            </button>
                          )}
                          {canRename && <button
                            type="button"
                            className="btn-ghost"
                            style={{ color: "var(--accent-light)", borderColor: "var(--accent-border)" }}
                            onClick={() => { setEditingId(role.id!); setEditName(role.name ?? ""); setConfirmDeleteId(null); }}
                          >
                            Rename
                          </button>}
                          {canDelete && !role.isSystem && (
                            <button type="button" className="btn-danger-ghost" onClick={() => { setConfirmDeleteId(role.id!); setEditingId(null); }}>
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {permissionsRole && (
        <RolePermissionsModal role={permissionsRole} canEdit={canEditPermissions} onClose={() => setPermissionsRole(null)} />
      )}
    </div>
  );
}
