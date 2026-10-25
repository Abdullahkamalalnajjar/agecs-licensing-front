"use client";

import { useState } from "react";
import type { PermissionSection } from "@/client/types.gen";

const COLUMNS = ["read", "create", "update", "delete"] as const;
const COLUMN_LABELS: Record<(typeof COLUMNS)[number], string> = { read: "View", create: "Create", update: "Edit", delete: "Delete" };

/** Every permission a catalog section offers (its actions and fields). */
export const sectionPermissions = (section: PermissionSection) =>
  [...(section.actions ?? []), ...(section.fields ?? [])].map((a) => a.permission).filter((p): p is string => !!p);

const viewOf = (section: PermissionSection) => section.actions?.find((a) => a.key === "read")?.permission ?? null;

/**
 * The permission catalog as a table: per section View / Create / Edit / Delete / Other, and under Edit a "Fields"
 * expander for the fields that can be edited on their own. `allChecked` shows everything ticked (Admin).
 */
export default function PermissionGrid({
  catalog, selected, onChange, editable, allChecked = false, fieldsNote = "The user can change only the ticked fields:",
}: {
  catalog: PermissionSection[];
  selected: string[];
  onChange: (next: string[]) => void;
  editable: boolean;
  allChecked?: boolean;
  fieldsNote?: string;
}) {
  const [openFields, setOpenFields] = useState<string | null>(null);

  const has = (permission?: string | null) => !!permission && (allChecked || selected.includes(permission));

  // Any action or field needs the section to be visible; hiding the section takes everything in it away.
  const toggle = (section: PermissionSection, permission: string, on: boolean) => {
    const view = viewOf(section);
    if (permission === view && !on) { onChange(selected.filter((p) => !sectionPermissions(section).includes(p))); return; }
    const next = on ? [...selected, permission, ...(view ? [view] : [])] : selected.filter((p) => p !== permission);
    onChange(Array.from(new Set(next)));
  };

  const box = (section: PermissionSection, permission: string, label: string, disabled = false) => (
    <input type="checkbox" checked={has(permission)} disabled={!editable || disabled} title={permission} aria-label={label}
      onChange={(e) => toggle(section, permission, e.target.checked)}
      style={{ width: 16, height: 16, cursor: editable && !disabled ? "pointer" : "default" }} />
  );

  return (
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
                      {fullEdit ? "Edit is ticked, so every field can be changed. Untick Edit to choose fields." : fieldsNote}
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
  );
}
