"use client";
import { useState } from "react";
import {
  putApiFamiliesById, deleteApiFamiliesById, putApiFamiliesReorder,
  putApiCompaniesById, deleteApiCompaniesById, putApiCompaniesReorder,
} from "@/client";
import type { CompanyDto, FamilyDto } from "@/client/types.gen";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { createCompany, createFamily, setCatalogLists, useCatalog } from "@/lib/catalog";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

const errorText = (data: unknown, fallback: string) =>
  (data as { errors?: { description?: string | null }[] | null } | undefined)?.errors
    ?.map((e) => e.description)
    .filter(Boolean)
    .join(", ") || fallback;

const arrowBtn: React.CSSProperties = { padding: "0 6px", minHeight: "20px", lineHeight: 1, fontSize: "0.7rem" };

export default function CatalogPage() {
  const { user } = useAuth();
  const isAdmin = user != null && user.role !== "Student" && user.role !== "NormalUser";
  const { families, companies, loaded, error } = useCatalog();

  if (user && !isAdmin) {
    return <div className="alert-error">You don&apos;t have access to this page.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Families &amp; Companies</h1>
          <p className="page-subtitle">
            Used in the product form and filters. Companies also build the site&apos;s product menu and home page sections, in this order.
          </p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
        <FamiliesCard families={families} loaded={loaded} />
        <CompaniesCard companies={companies} loaded={loaded} />
      </div>
    </div>
  );
}

/** Swaps an item with its neighbour, saves the full order, and rolls back on failure. */
function useReorder<T extends { id?: string }>(
  list: T[],
  apply: (next: T[]) => void,
  save: (ids: string[]) => Promise<{ data?: { isError?: boolean } | unknown; error?: unknown }>,
) {
  const { error: toastError } = useToast();
  const [busy, setBusy] = useState(false);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const previous = list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    apply(next);
    try {
      setBusy(true);
      const res = await save(next.map((x) => x.id!).filter(Boolean));
      if (res.error || (res.data as { isError?: boolean } | undefined)?.isError) {
        apply(previous);
        toastError(errorText(res.data, "Failed to save the new order."));
      }
    } catch (err) {
      apply(previous);
      toastError((err instanceof Error && err.message) || "Failed to save the new order.");
    } finally {
      setBusy(false);
    }
  };

  return { move, busy };
}

function MoveButtons({ index, count, busy, onMove, label }: { index: number; count: number; busy: boolean; onMove: (i: number, d: -1 | 1) => void; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <button type="button" className="btn-ghost" style={arrowBtn} onClick={() => onMove(index, -1)} disabled={busy || index === 0} aria-label={`Move ${label} up`}>▲</button>
      <button type="button" className="btn-ghost" style={arrowBtn} onClick={() => onMove(index, 1)} disabled={busy || index === count - 1} aria-label={`Move ${label} down`}>▼</button>
    </div>
  );
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onAdd(name.trim());
      setName("");
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
      <input className="form-input" placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>{saving ? "Adding…" : "Add"}</button>
    </form>
  );
}

const cardStyle: React.CSSProperties = { padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--bg-elevated)" };
const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderTop: "1px solid var(--border)" };
const countStyle: React.CSSProperties = { fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" };

/* ---------------- Families ---------------- */

function FamiliesCard({ families, loaded }: { families: FamilyDto[]; loaded: boolean }) {
  const { success, error: toastError } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { move, busy } = useReorder(
    families,
    (next) => setCatalogLists({ families: next }),
    (ids) => putApiFamiliesReorder({ baseUrl, body: { familyIds: ids }, throwOnError: false }),
  );

  const add = async (name: string) => {
    try {
      await createFamily(name);
      success(`Family "${name}" added.`);
    } catch (err) {
      toastError((err instanceof Error && err.message) || "Failed to add family.");
    }
  };

  const saveEdit = async (family: FamilyDto) => {
    const res = await putApiFamiliesById({ baseUrl, path: { id: family.id! }, body: { name: editName }, throwOnError: false });
    if (res.error || res.data?.isError || !res.data?.value) {
      toastError(errorText(res.data, "Failed to rename family."));
      return;
    }
    const updated = res.data.value;
    setCatalogLists({ families: families.map((f) => (f.id === updated.id ? updated : f)) });
    setEditingId(null);
    success("Family renamed.");
  };

  const remove = async (family: FamilyDto) => {
    if (!confirm(`Delete family "${family.name}"?`)) return;
    const res = await deleteApiFamiliesById({ baseUrl, path: { id: family.id! }, throwOnError: false });
    if (res.error || res.data?.isError) {
      toastError(errorText(res.data ?? res.error, "Failed to delete family."));
      return;
    }
    setCatalogLists({ families: families.filter((f) => f.id !== family.id) });
    success("Family deleted.");
  };

  return (
    <section style={cardStyle}>
      <h2 style={{ fontSize: "1rem", margin: "0 0 1rem" }}>Families</h2>
      <AddRow placeholder="New family name, e.g. SES" onAdd={add} />
      {!loaded ? (
        <div className="skeleton" style={{ height: "120px" }} />
      ) : families.length === 0 ? (
        <p style={countStyle}>No families yet.</p>
      ) : (
        families.map((family, index) => (
          <div key={family.id} style={rowStyle}>
            <MoveButtons index={index} count={families.length} busy={busy} onMove={move} label={family.name || ""} />
            {editingId === family.id ? (
              <>
                <input className="form-input" value={editName} autoFocus onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(family); if (e.key === "Escape") setEditingId(null); }} />
                <button type="button" className="btn-primary" onClick={() => saveEdit(family)} disabled={!editName.trim()}>Save</button>
                <button type="button" className="btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontWeight: 600 }}>{family.name}</span>
                <span style={countStyle}>{family.productCount ?? 0} product{family.productCount === 1 ? "" : "s"}</span>
                <button type="button" className="btn-ghost" onClick={() => { setEditingId(family.id!); setEditName(family.name || ""); }}>Rename</button>
                <button
                  type="button"
                  className="btn-danger-ghost"
                  onClick={() => remove(family)}
                  disabled={(family.productCount ?? 0) > 0}
                  title={(family.productCount ?? 0) > 0 ? "Move its products to another family first" : undefined}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))
      )}
    </section>
  );
}

/* ---------------- Companies ---------------- */

type CompanyForm = { name: string; icon: string; tagline: string; headline: string; description: string };

function CompaniesCard({ companies, loaded }: { companies: CompanyDto[]; loaded: boolean }) {
  const { success, error: toastError } = useToast();
  const [editing, setEditing] = useState<CompanyDto | null>(null);
  const [form, setForm] = useState<CompanyForm>({ name: "", icon: "", tagline: "", headline: "", description: "" });
  const [saving, setSaving] = useState(false);
  const { move, busy } = useReorder(
    companies,
    (next) => setCatalogLists({ companies: next }),
    (ids) => putApiCompaniesReorder({ baseUrl, body: { companyIds: ids }, throwOnError: false }),
  );

  const add = async (name: string) => {
    try {
      const created = await createCompany(name);
      success(`Company "${name}" added — add its site text next.`);
      openEdit(created);
    } catch (err) {
      toastError((err instanceof Error && err.message) || "Failed to add company.");
    }
  };

  const openEdit = (company: CompanyDto) => {
    setEditing(company);
    setForm({
      name: company.name || "",
      icon: company.icon || "",
      tagline: company.tagline || "",
      headline: company.headline || "",
      description: company.description || "",
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.id) return;
    setSaving(true);
    try {
      const res = await putApiCompaniesById({ baseUrl, path: { id: editing.id }, body: form, throwOnError: false });
      if (res.error || res.data?.isError || !res.data?.value) {
        toastError(errorText(res.data, "Failed to save company."));
        return;
      }
      const updated = res.data.value;
      setCatalogLists({ companies: companies.map((c) => (c.id === updated.id ? updated : c)) });
      setEditing(null);
      success("Company saved.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (company: CompanyDto) => {
    if (!confirm(`Delete company "${company.name}"?`)) return;
    const res = await deleteApiCompaniesById({ baseUrl, path: { id: company.id! }, throwOnError: false });
    if (res.error || res.data?.isError) {
      toastError(errorText(res.data ?? res.error, "Failed to delete company."));
      return;
    }
    setCatalogLists({ companies: companies.filter((c) => c.id !== company.id) });
    success("Company deleted.");
  };

  return (
    <section style={cardStyle}>
      <h2 style={{ fontSize: "1rem", margin: "0 0 1rem" }}>Companies</h2>
      <AddRow placeholder="New company name" onAdd={add} />
      {!loaded ? (
        <div className="skeleton" style={{ height: "120px" }} />
      ) : companies.length === 0 ? (
        <p style={countStyle}>No companies yet.</p>
      ) : (
        companies.map((company, index) => (
          <div key={company.id} style={rowStyle}>
            <MoveButtons index={index} count={companies.length} busy={busy} onMove={move} label={company.name || ""} />
            <span style={{ fontSize: "1.1rem", width: "1.5rem", textAlign: "center" }}>{company.icon || "📦"}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 600 }}>{company.name}</span>
              {company.headline && (
                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {company.headline}
                </span>
              )}
            </span>
            <span style={countStyle}>{company.productCount ?? 0} product{company.productCount === 1 ? "" : "s"}</span>
            <button type="button" className="btn-ghost" onClick={() => openEdit(company)}>Edit</button>
            <button
              type="button"
              className="btn-danger-ghost"
              onClick={() => remove(company)}
              disabled={(company.productCount ?? 0) > 0}
              title={(company.productCount ?? 0) > 0 ? "Move its products to another company first" : undefined}
            >
              Delete
            </button>
          </div>
        ))
      )}

      {editing && (
        <div className="modal-overlay">
          <div className="modal-container medium">
            <div className="modal-header">
              <h2 className="modal-title">Edit {editing.name}</h2>
              <button type="button" className="modal-close" onClick={() => setEditing(null)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="modal-body">
              <form id="companyForm" onSubmit={saveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "1rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="companyName">Name</label>
                    <input id="companyName" className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="companyIcon">Menu icon</label>
                    <input id="companyIcon" className="form-input" maxLength={16} placeholder="e.g. 🏗️" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  The fields below are the home page section for this company. Left empty, it shows the company name and &quot;{form.name || "Name"} Products&quot;.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="companyTagline">Tagline (small label above the title)</label>
                  <input id="companyTagline" className="form-input" maxLength={200} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="companyHeadline">Headline</label>
                  <input id="companyHeadline" className="form-input" maxLength={300} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="companyDescription">Description</label>
                  <textarea id="companyDescription" className="form-input" rows={4} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
              <button type="submit" form="companyForm" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
