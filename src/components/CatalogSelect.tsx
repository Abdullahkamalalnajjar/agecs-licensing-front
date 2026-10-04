"use client";

import { useState } from "react";
import { createCompany, createFamily, useCatalog } from "@/lib/catalog";

const ADD_NEW = "__add_new__";

type CatalogSelectProps = {
  kind: "family" | "company";
  id?: string;
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
};

/**
 * Dropdown of product families or companies, with an inline "+ Add new…" option that creates one and selects it.
 */
export default function CatalogSelect({ kind, id, value, onChange, required }: CatalogSelectProps) {
  const { families, companies, loaded } = useCatalog();
  const options = kind === "family" ? families : companies;
  const label = kind === "family" ? "family" : "company";

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      const created = kind === "family" ? await createFamily(name) : await createCompany(name);
      if (created.id) onChange(created.id);
      setAdding(false);
      setNewName("");
    } catch (err) {
      setError((err instanceof Error && err.message) || `Failed to add ${label}.`);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setAdding(false);
    setNewName("");
    setError("");
  };

  if (adding) {
    return (
      <div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            id={id}
            type="text"
            className="form-input"
            placeholder={`New ${label} name`}
            value={newName}
            autoFocus
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              // Enter would submit the surrounding product form.
              if (e.key === "Enter") { e.preventDefault(); save(); }
              if (e.key === "Escape") { e.preventDefault(); cancel(); }
            }}
          />
          <button type="button" className="btn-primary" onClick={save} disabled={saving || !newName.trim()}>
            {saving ? "Adding…" : "Add"}
          </button>
          <button type="button" className="btn-ghost" onClick={cancel} disabled={saving}>
            Cancel
          </button>
        </div>
        {error && <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "var(--danger)" }}>{error}</p>}
      </div>
    );
  }

  return (
    <select
      id={id}
      className="form-input"
      value={value}
      required={required}
      disabled={!loaded}
      onChange={(e) => (e.target.value === ADD_NEW ? setAdding(true) : onChange(e.target.value))}
      style={{ appearance: "auto" }}
    >
      <option value="" disabled>{loaded ? `Select ${label}…` : "Loading…"}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
      <option value={ADD_NEW}>+ Add new {label}…</option>
    </select>
  );
}
