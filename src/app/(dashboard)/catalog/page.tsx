"use client";
import { useMemo, useState } from "react";
import {
  putApiFamiliesById, deleteApiFamiliesById, putApiFamiliesReorder,
  putApiCompaniesById, deleteApiCompaniesById, putApiCompaniesReorder,
} from "@/client";
import type { CompanyDto, FamilyDto } from "@/client/types.gen";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { createCompany, createFamily, setCatalogLists, useCatalog } from "@/lib/catalog";
import "../products/products.css";
import "./catalog.css";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

type Tab = "companies" | "families";

const errorText = (data: unknown, fallback: string) =>
  (data as { errors?: { description?: string | null }[] | null } | undefined)?.errors
    ?.map((e) => e.description)
    .filter(Boolean)
    .join(", ") || fallback;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const Svg = ({ children, size = 15 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const Icon = {
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  up: <polyline points="18 15 12 9 6 15" />,
  down: <polyline points="6 9 12 15 18 9" />,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" /></>,
  tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
};

function IconButton({ title, onClick, tone = "accent", disabled, children }: {
  title: string; onClick: () => void; tone?: "accent" | "green" | "danger"; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} aria-label={title} className={`pr-icon-btn pr-tone-${tone}`} onClick={onClick} disabled={disabled}>
      <Svg>{children}</Svg>
    </button>
  );
}

export default function CatalogPage() {
  const { user } = useAuth();
  const isAdmin = user != null && user.role !== "Student" && user.role !== "NormalUser";
  const { families, companies, loaded, error } = useCatalog();
  const [tab, setTab] = useState<Tab>("companies");
  const [creating, setCreating] = useState(false);

  const stats = useMemo(() => {
    const unused = companies.filter((c) => !c.productCount).length + families.filter((f) => !f.productCount).length;
    return {
      companies: companies.length,
      families: families.length,
      products: companies.reduce((n, c) => n + (c.productCount ?? 0), 0),
      unused,
    };
  }, [companies, families]);

  if (user && !isAdmin) {
    return <div className="alert-error">You don&apos;t have access to this page.</div>;
  }

  return (
    <div className="pr-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Families &amp; Companies</h1>
          <p className="page-subtitle">Organize products, and control the site&apos;s product menu and home page sections.</p>
        </div>
      </div>

      {error && <div className="alert-error pr-alert">{error}</div>}

      <div className="pr-stats">
        {([
          ["companies", "Companies", stats.companies, ""],
          ["families", "Families", stats.families, ""],
          [null, "Products", stats.products, "pr-stat-visible"],
          [null, "Unused", stats.unused, "pr-stat-hidden"],
        ] as const).map(([target, label, value, cls]) => (
          <button
            key={label}
            type="button"
            className={`pr-stat ${cls} ${target === tab ? "is-active" : ""}`}
            onClick={() => target && setTab(target)}
            style={target ? undefined : { cursor: "default" }}
            tabIndex={target ? 0 : -1}
          >
            <span className="pr-stat-label">{label}</span>
            <span className="pr-stat-value">{loaded ? value : "–"}</span>
          </button>
        ))}
      </div>

      <div className="ct-tabs">
        <div className="pr-segment" role="tablist" aria-label="List">
          <button type="button" role="tab" aria-selected={tab === "companies"} className={tab === "companies" ? "is-active" : ""} onClick={() => setTab("companies")}>
            Companies<span className="ct-tab-count">{companies.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === "families"} className={tab === "families" ? "is-active" : ""} onClick={() => setTab("families")}>
            Families<span className="ct-tab-count">{families.length}</span>
          </button>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
          <Svg>{Icon.plus}</Svg>
          {tab === "companies" ? "New company" : "New family"}
        </button>
      </div>

      {tab === "companies" ? (
        <CompaniesList companies={companies} loaded={loaded} creating={creating} onCloseCreate={() => setCreating(false)} onCreate={() => setCreating(true)} />
      ) : (
        <FamiliesList families={families} loaded={loaded} creating={creating} onCloseCreate={() => setCreating(false)} onCreate={() => setCreating(true)} />
      )}
    </div>
  );
}

/* ---------------- Shared pieces ---------------- */

/** Swaps an item with its neighbour, saves the full order, and rolls back on failure. */
function useReorder<T extends { id?: string }>(
  list: T[],
  apply: (next: T[]) => void,
  save: (ids: string[]) => Promise<{ data?: unknown; error?: unknown }>,
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

function OrderControl({ index, count, busy, onMove, label }: { index: number; count: number; busy: boolean; onMove: (i: number, d: -1 | 1) => void; label: string }) {
  return (
    <div className="ct-order">
      <span className="ct-order-num">{index + 1}</span>
      <div className="ct-order-btns">
        <button type="button" className="pr-icon-btn" onClick={() => onMove(index, -1)} disabled={busy || index === 0} aria-label={`Move ${label} up`} title="Move up">
          <Svg size={12}>{Icon.up}</Svg>
        </button>
        <button type="button" className="pr-icon-btn" onClick={() => onMove(index, 1)} disabled={busy || index === count - 1} aria-label={`Move ${label} down`} title="Move down">
          <Svg size={12}>{Icon.down}</Svg>
        </button>
      </div>
    </div>
  );
}

/** Delete button that turns into confirm / cancel in place, instead of a browser confirm() dialog. */
function DeleteControl({ label, productCount, onDelete }: { label: string; productCount: number; onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inUse = productCount > 0;

  if (confirming) {
    return (
      <span className="pr-confirm">
        <IconButton title={`Confirm delete ${label}`} tone="danger" disabled={deleting} onClick={async () => {
          setDeleting(true);
          try { await onDelete(); } finally { setDeleting(false); setConfirming(false); }
        }}>{Icon.check}</IconButton>
        <IconButton title="Cancel" onClick={() => setConfirming(false)} disabled={deleting}>{Icon.x}</IconButton>
      </span>
    );
  }

  return (
    <IconButton
      title={inUse ? `Can't delete: ${plural(productCount, "product")} still use it` : `Delete ${label}`}
      tone="danger"
      disabled={inUse}
      onClick={() => setConfirming(true)}
    >
      {Icon.trash}
    </IconButton>
  );
}

function CountPill({ count }: { count: number }) {
  return <span className={`ct-count ${count ? "" : "is-empty"}`}>{plural(count, "product")}</span>;
}

function EmptyState({ icon, title, sub, action, onAction }: { icon: React.ReactNode; title: string; sub: string; action: string; onAction: () => void }) {
  return (
    <div className="ct-empty">
      <span className="ct-empty-icon"><Svg size={24}>{icon}</Svg></span>
      <p className="ct-empty-title">{title}</p>
      <p className="ct-empty-sub">{sub}</p>
      <button type="button" className="btn-primary" onClick={onAction}><Svg>{Icon.plus}</Svg>{action}</button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="pr-panel ct-list">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="ct-row">
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 14, width: "30%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: "60%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const modalCloseIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

/* ---------------- Companies ---------------- */

type CompanyForm = { name: string; icon: string; tagline: string; headline: string; description: string };
const emptyCompanyForm: CompanyForm = { name: "", icon: "", tagline: "", headline: "", description: "" };

function CompaniesList({ companies, loaded, creating, onCloseCreate, onCreate }: {
  companies: CompanyDto[]; loaded: boolean; creating: boolean; onCloseCreate: () => void; onCreate: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [editing, setEditing] = useState<CompanyDto | null>(null);
  const { move, busy } = useReorder(
    companies,
    (next) => setCatalogLists({ companies: next }),
    (ids) => putApiCompaniesReorder({ baseUrl, body: { companyIds: ids }, throwOnError: false }),
  );

  const remove = async (company: CompanyDto) => {
    const res = await deleteApiCompaniesById({ baseUrl, path: { id: company.id! }, throwOnError: false });
    if (res.error || res.data?.isError) {
      toastError(errorText(res.data ?? res.error, "Failed to delete company."));
      return;
    }
    setCatalogLists({ companies: companies.filter((c) => c.id !== company.id) });
    success(`${company.name} deleted.`);
  };

  // Creating saves the name first (the API needs it), then the site text in the same submit.
  const save = async (form: CompanyForm) => {
    let target = editing;
    if (!target) target = await createCompany(form.name);
    const res = await putApiCompaniesById({ baseUrl, path: { id: target.id! }, body: form, throwOnError: false });
    if (res.error || res.data?.isError || !res.data?.value) throw new Error(errorText(res.data, "Failed to save company."));
    const updated = res.data.value;
    const current = editing ? companies : [...companies.filter((c) => c.id !== updated.id), updated];
    setCatalogLists({ companies: current.map((c) => (c.id === updated.id ? updated : c)) });
    success(editing ? `${updated.name} saved.` : `${updated.name} added.`);
  };

  if (!loaded) return <ListSkeleton />;

  return (
    <>
      <p className="ct-hint">The order here is the order of the site&apos;s product menu tabs and home page sections.</p>
      <div className="pr-panel ct-list">
        {companies.length === 0 ? (
          <EmptyState icon={Icon.building} title="No companies yet" sub="Companies group products on the site's menu and home page." action="New company" onAction={onCreate} />
        ) : (
          companies.map((company, index) => (
            <div key={company.id} className="ct-row">
              <OrderControl index={index} count={companies.length} busy={busy} onMove={move} label={company.name || ""} />
              <span className="ct-icon-tile">{company.icon || "📦"}</span>
              <div className="ct-main">
                <div className="ct-name-line">
                  <span className="ct-name">{company.name}</span>
                  {company.tagline && <span className="ct-tagline">{company.tagline}</span>}
                </div>
                <div className={`ct-sub ${company.headline ? "" : "is-missing"}`}>
                  {company.headline || "No home page text yet: the section shows the company name only"}
                </div>
              </div>
              <CountPill count={company.productCount ?? 0} />
              <div className="pr-actions">
                <IconButton title={`Edit ${company.name}`} onClick={() => setEditing(company)}>{Icon.edit}</IconButton>
                <DeleteControl label={company.name || ""} productCount={company.productCount ?? 0} onDelete={() => remove(company)} />
              </div>
            </div>
          ))
        )}
      </div>

      {(editing || creating) && (
        <CompanyModal
          company={editing}
          onClose={() => { setEditing(null); onCloseCreate(); }}
          onSave={save}
          onError={(msg) => toastError(msg)}
        />
      )}
    </>
  );
}

// Quick picks for the products-menu icon; any other emoji can be typed in the custom field.
const ICON_CHOICES = ["🏗️", "✏️", "📐", "🏢", "🧱", "🛠️", "⚙️", "💻", "🧩", "📊", "🚀", "📦"];
const DEFAULT_ICON = "📦";

function CharCount({ value, max }: { value: string; max: number }) {
  const near = value.length > max * 0.9;
  return <span className={`ct-char-count ${near ? "is-near" : ""}`}>{value.length}/{max}</span>;
}

function CompanyModal({ company, onClose, onSave, onError }: {
  company: CompanyDto | null; onClose: () => void; onSave: (form: CompanyForm) => Promise<void>; onError: (msg: string) => void;
}) {
  const [form, setForm] = useState<CompanyForm>(company ? {
    name: company.name || "",
    icon: company.icon || "",
    tagline: company.tagline || "",
    headline: company.headline || "",
    description: company.description || "",
  } : emptyCompanyForm);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<CompanyForm>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      onError((err instanceof Error && err.message) || "Failed to save company.");
    } finally {
      setSaving(false);
    }
  };

  const name = form.name.trim() || "Company";
  const icon = form.icon.trim() || DEFAULT_ICON;
  const customIcon = form.icon.trim() !== "" && !ICON_CHOICES.includes(form.icon.trim());

  return (
    <div className="modal-overlay">
      <div className="modal-container wide ct-company-modal">
        <div className="modal-header">
          <div className="ct-modal-heading">
            <span className="ct-icon-tile">{icon}</span>
            <div>
              <h2 className="modal-title">{company ? `Edit ${company.name}` : "New company"}</h2>
              <p className="ct-modal-sub">Shown in the site&apos;s products menu and as its own home page section.</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">{modalCloseIcon}</button>
        </div>
        <div className="modal-body">
          <form id="companyForm" onSubmit={submit} className="ct-modal-grid">
            <div className="ct-fields">
              <fieldset className="ct-fieldset">
                <legend className="ct-section-label">Basics</legend>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="companyName">Name</label>
                  <input id="companyName" className="form-input" required autoFocus maxLength={100} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. NanoCAD" />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <span className="form-label" id="companyIconLabel">Menu icon</span>
                  <div className="ct-icon-picker" role="radiogroup" aria-labelledby="companyIconLabel">
                    {ICON_CHOICES.map((choice) => {
                      const selected = icon === choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={`ct-icon-choice ${selected ? "is-selected" : ""}`}
                          onClick={() => set({ icon: choice })}
                        >
                          {choice}
                        </button>
                      );
                    })}
                    <input
                      className={`form-input ct-icon-custom ${customIcon ? "is-selected" : ""}`}
                      maxLength={16}
                      value={customIcon ? form.icon : ""}
                      onChange={(e) => set({ icon: e.target.value })}
                      placeholder="Other"
                      aria-label="Custom icon (any emoji)"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="ct-fieldset">
                <legend className="ct-section-label">Home page section</legend>
                <p className="ct-hint" style={{ margin: 0 }}>All optional. Empty fields fall back to the company name.</p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="ct-label-row">
                    <label className="form-label" htmlFor="companyTagline">Tagline</label>
                    <CharCount value={form.tagline} max={200} />
                  </div>
                  <input id="companyTagline" className="form-input" maxLength={200} value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Small label above the headline" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="ct-label-row">
                    <label className="form-label" htmlFor="companyHeadline">Headline</label>
                    <CharCount value={form.headline} max={300} />
                  </div>
                  <input id="companyHeadline" className="form-input" maxLength={300} value={form.headline} onChange={(e) => set({ headline: e.target.value })} placeholder={`${name} Products`} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="ct-label-row">
                    <label className="form-label" htmlFor="companyDescription">Description</label>
                    <CharCount value={form.description} max={2000} />
                  </div>
                  <textarea id="companyDescription" className="form-input" rows={4} maxLength={2000} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="A sentence or two about what this company offers" style={{ resize: "vertical" }} />
                </div>
              </fieldset>
            </div>

            <aside className="ct-preview-wrap" aria-label="Preview">
              <p className="ct-section-label">Live preview</p>

              <div className="ct-preview-block">
                <span className="ct-preview-caption">Home page section</span>
                <div className="ct-preview" aria-live="polite">
                  <span className="ct-preview-eyebrow">{form.tagline.trim() || name}</span>
                  <h3 className="ct-preview-title">{form.headline.trim() || `${name} Products`}</h3>
                  {form.description.trim()
                    ? <p className="ct-preview-desc">{form.description}</p>
                    : <p className="ct-preview-desc is-placeholder">Your description appears here.</p>}
                  <div className="ct-preview-cards" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="ct-preview-card">
                        <span className="ct-preview-card-media" />
                        <span className="ct-preview-card-line" />
                        <span className="ct-preview-card-line is-short" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ct-preview-block">
                <span className="ct-preview-caption">Products menu</span>
                <div className="ct-preview-menu" aria-hidden="true">
                  <span className="ct-preview-menu-item is-active">
                    <span>{icon}</span>
                    <span className="ct-preview-menu-name">{name}</span>
                    <Svg size={12}><polyline points="9 6 15 12 9 18" /></Svg>
                  </span>
                  <span className="ct-preview-menu-item">
                    <span className="ct-preview-card-line" style={{ width: "60%" }} />
                  </span>
                </div>
              </div>
            </aside>
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="companyForm" className="btn-primary" disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : company ? "Save changes" : "Create company"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Families ---------------- */

function FamiliesList({ families, loaded, creating, onCloseCreate, onCreate }: {
  families: FamilyDto[]; loaded: boolean; creating: boolean; onCloseCreate: () => void; onCreate: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { move, busy } = useReorder(
    families,
    (next) => setCatalogLists({ families: next }),
    (ids) => putApiFamiliesReorder({ baseUrl, body: { familyIds: ids }, throwOnError: false }),
  );

  const rename = async (family: FamilyDto) => {
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
    const res = await deleteApiFamiliesById({ baseUrl, path: { id: family.id! }, throwOnError: false });
    if (res.error || res.data?.isError) {
      toastError(errorText(res.data ?? res.error, "Failed to delete family."));
      return;
    }
    setCatalogLists({ families: families.filter((f) => f.id !== family.id) });
    success(`${family.name} deleted.`);
  };

  if (!loaded) return <ListSkeleton />;

  return (
    <>
      <p className="ct-hint">Families label products (e.g. SES) and power the family filter on the products page.</p>
      <div className="pr-panel ct-list">
        {families.length === 0 ? (
          <EmptyState icon={Icon.tag} title="No families yet" sub="Add a family to group related products." action="New family" onAction={onCreate} />
        ) : (
          families.map((family, index) => (
            <div key={family.id} className="ct-row">
              <OrderControl index={index} count={families.length} busy={busy} onMove={move} label={family.name || ""} />
              <span className="ct-icon-tile ct-family-tile">{(family.name || "?").slice(0, 2).toUpperCase()}</span>
              {editingId === family.id ? (
                <div className="ct-rename">
                  <input
                    className="form-input"
                    value={editName}
                    autoFocus
                    aria-label="Family name"
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") rename(family); if (e.key === "Escape") setEditingId(null); }}
                  />
                  <IconButton title="Save" tone="green" onClick={() => rename(family)} disabled={!editName.trim()}>{Icon.check}</IconButton>
                  <IconButton title="Cancel" onClick={() => setEditingId(null)}>{Icon.x}</IconButton>
                </div>
              ) : (
                <>
                  <div className="ct-main"><span className="ct-name">{family.name}</span></div>
                  <CountPill count={family.productCount ?? 0} />
                  <div className="pr-actions">
                    <IconButton title={`Rename ${family.name}`} onClick={() => { setEditingId(family.id!); setEditName(family.name || ""); }}>{Icon.edit}</IconButton>
                    <DeleteControl label={family.name || ""} productCount={family.productCount ?? 0} onDelete={() => remove(family)} />
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {creating && <FamilyModal onClose={onCloseCreate} onError={(msg) => toastError(msg)} onCreated={(name) => success(`${name} added.`)} />}
    </>
  );
}

function FamilyModal({ onClose, onError, onCreated }: { onClose: () => void; onError: (msg: string) => void; onCreated: (name: string) => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createFamily(name.trim());
      onCreated(created.name || name.trim());
      onClose();
    } catch (err) {
      onError((err instanceof Error && err.message) || "Failed to add family.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container ct-modal-sm">
        <div className="modal-header">
          <h2 className="modal-title">New family</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">{modalCloseIcon}</button>
        </div>
        <div className="modal-body">
          <form id="familyForm" onSubmit={submit}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="familyName">Name</label>
              <input id="familyName" className="form-input" required autoFocus maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SES" />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="familyForm" className="btn-primary" disabled={saving || !name.trim()}>{saving ? "Adding…" : "Create family"}</button>
        </div>
      </div>
    </div>
  );
}
