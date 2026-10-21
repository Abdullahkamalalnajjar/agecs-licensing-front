"use client";
import { useCallback, useEffect, useState } from "react";
import { getApiCompanies, getApiCompaniesByCompanyIdOverview, putApiCompaniesByCompanyIdOverview, deleteApiCompaniesByCompanyIdOverview } from "@/client";
import type { CompanyDto, CompanyOverviewDto } from "@/client/types.gen";
import { useAuth, usePermissions } from "@/components/AuthProvider";
import { P } from "@/lib/permissions";
import { useToast } from "@/components/ToastProvider";
import "@/components/product-form.css";
import "../products/products.css";
import "../catalog/catalog.css";
import "./overviews.css";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";
const MAX_CARDS = 12;

const errorText = (data: unknown, fallback: string) =>
  (data as { errors?: { description?: string | null }[] | null } | undefined)?.errors
    ?.map((e) => e.description)
    .filter(Boolean)
    .join(", ") || fallback;

const Svg = ({ children, size = 15 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const Icon = {
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  up: <polyline points="18 15 12 9 6 15" />,
  down: <polyline points="6 9 12 15 18 9" />,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
};

type CardForm = { title: string; description: string };
type OverviewForm = { title: string; subtitle: string; hidden: boolean; cards: CardForm[] };

const toForm = (o: CompanyOverviewDto | null, company?: CompanyDto): OverviewForm => o
  ? {
    title: o.title ?? "",
    subtitle: o.subtitle ?? "",
    hidden: o.hidden ?? false,
    cards: (o.cards ?? []).map((c) => ({ title: c.title ?? "", description: c.description ?? "" })),
  }
  : { title: company?.name ? `${company.name.toUpperCase()} OVERVIEW` : "", subtitle: "", hidden: false, cards: [] };

const sameForm = (a: OverviewForm, b: OverviewForm) => JSON.stringify(a) === JSON.stringify(b);

export default function OverviewsPage() {
  const { user } = useAuth();
  const { can, canField, canUpdateAny } = usePermissions();
  const isAdmin = can(P.overviews.read);
  const canEdit = canUpdateAny("overviews");
  const canDelete = can(P.overviews.delete);
  const { success, error: toastError } = useToast();

  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [error, setError] = useState("");
  // What's saved on the server (null = the company has no overview yet) and what's being edited.
  const [exists, setExists] = useState(false);
  const [saved, setSaved] = useState<OverviewForm>(toForm(null));
  const [form, setForm] = useState<OverviewForm>(toForm(null));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const company = companies.find((c) => c.id === companyId);
  const dirty = !sameForm(form, saved);
  const editable = (field: string) => canField("overviews", field);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getApiCompanies({ baseUrl, throwOnError: false });
      if (res.data?.isSuccess) {
        const list = res.data.value ?? [];
        setCompanies(list);
        setCompanyId((current) => current ?? list[0]?.id ?? null);
      } else setError(errorText(res.data, "Failed to load companies."));
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (isAdmin) fetchCompanies(); }, [isAdmin, fetchCompanies]);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    const load = async () => {
      setLoadingOverview(true);
      setError("");
      try {
        const res = await getApiCompaniesByCompanyIdOverview({ baseUrl, path: { companyId }, throwOnError: false });
        if (cancelled) return;
        // 404 = this company has no overview yet; start from an empty form.
        const notFound = res.response?.status === 404;
        if (!notFound && !res.data?.isSuccess) { setError(errorText(res.data ?? res.error, "Failed to load the overview.")); return; }
        const loaded = toForm(notFound ? null : res.data?.value ?? null, companies.find((c) => c.id === companyId));
        setExists(!notFound);
        setSaved(loaded);
        setForm(loaded);
      } catch (err) {
        if (!cancelled) setError((err instanceof Error && err.message) || "Failed to load the overview.");
      } finally {
        if (!cancelled) setLoadingOverview(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [companyId, companies]);

  const pickCompany = (id: string) => {
    if (id === companyId) return;
    if (dirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    setConfirmDelete(false);
    setCompanyId(id);
  };

  const setCard = (i: number, patch: Partial<CardForm>) =>
    setForm((f) => ({ ...f, cards: f.cards.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const moveCard = (i: number, d: -1 | 1) => setForm((f) => {
    const cards = [...f.cards];
    [cards[i], cards[i + d]] = [cards[i + d], cards[i]];
    return { ...f, cards };
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        hidden: form.hidden,
        cards: form.cards.map((c) => ({ title: c.title.trim(), description: c.description.trim() || null })),
      };
      const res = await putApiCompaniesByCompanyIdOverview({ baseUrl, path: { companyId }, body, throwOnError: false });
      if (res.error || res.data?.isError || !res.data?.value) throw new Error(errorText(res.data ?? res.error, "Failed to save the overview."));
      const next = toForm(res.data.value);
      setExists(true);
      setSaved(next);
      setForm(next);
      success(exists ? "Overview saved." : "Overview created.");
    } catch (err) {
      toastError((err instanceof Error && err.message) || "Failed to save the overview.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const res = await deleteApiCompaniesByCompanyIdOverview({ baseUrl, path: { companyId }, throwOnError: false });
      if (res.error || res.data?.isError) throw new Error(errorText(res.data ?? res.error, "Failed to delete the overview."));
      const empty = toForm(null, company);
      setExists(false);
      setSaved(empty);
      setForm(empty);
      success("Overview deleted.");
    } catch (err) {
      toastError((err instanceof Error && err.message) || "Failed to delete the overview.");
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  if (user && !isAdmin) return <div className="alert-error">You don&apos;t have access to this page.</div>;

  return (
    <div className="pr-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Overviews</h1>
          <p className="page-subtitle">The &quot;Overview&quot; section shown for each company on the site.</p>
        </div>
        <a href="/home?view=site" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <Svg><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Svg>View on site
        </a>
      </div>

      {error && <div className="alert-error pr-alert">{error}</div>}

      {loading ? (
        <div className="pr-panel ov-panel"><div className="skeleton" style={{ height: 220 }} /></div>
      ) : companies.length === 0 ? (
        <div className="pr-panel ct-empty">
          <p className="ct-empty-title">No companies yet</p>
          <p className="ct-empty-sub">Add a company in Families &amp; Companies first.</p>
        </div>
      ) : (
        <>
          <div className="ct-tabs">
            <div className="pr-segment" role="tablist" aria-label="Company">
              {companies.map((c) => (
                <button key={c.id} type="button" role="tab" aria-selected={c.id === companyId}
                  className={c.id === companyId ? "is-active" : ""} onClick={() => pickCompany(c.id!)}>
                  {c.icon && <span style={{ marginRight: "0.35rem" }}>{c.icon}</span>}{c.name}
                </button>
              ))}
            </div>
            {!loadingOverview && (
              <span className={`ov-status ${!exists ? "is-new" : form.hidden ? "is-hidden" : ""}`}>
                {!exists ? "Not set up yet" : saved.hidden ? "Hidden on the site" : "Shown on the site"}
              </span>
            )}
          </div>

          {loadingOverview ? (
            <div className="pr-panel ov-panel"><div className="skeleton" style={{ height: 320 }} /></div>
          ) : (
            <div className="ov-layout">
              <form id="overviewForm" onSubmit={save} className="pr-panel ov-panel ov-form">
                {!canEdit && <p className="ct-hint" style={{ margin: 0 }}>You can view this overview but not edit it.</p>}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="ct-label-row">
                    <label className="form-label" htmlFor="ovTitle">Title *</label>
                    <span className="ct-char-count">{form.title.length}/200</span>
                  </div>
                  <input id="ovTitle" className="form-input" required maxLength={200} disabled={!editable("title")}
                    value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={`e.g. ${company?.name?.toUpperCase() ?? "AGECS"} OVERVIEW`} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="ct-label-row">
                    <label className="form-label" htmlFor="ovSubtitle">Subtitle</label>
                    <span className="ct-char-count">{form.subtitle.length}/1000</span>
                  </div>
                  <textarea id="ovSubtitle" className="form-input" rows={2} maxLength={1000} disabled={!editable("subtitle")} style={{ resize: "vertical" }}
                    value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
                </div>

                <label className="pf-toggle">
                  <span className="pf-toggle-switch">
                    <input type="checkbox" checked={!form.hidden} disabled={!editable("hidden")}
                      onChange={(e) => setForm((f) => ({ ...f, hidden: !e.target.checked }))} />
                    <span className="pf-toggle-track" />
                  </span>
                  <span className="pf-toggle-label">Show on the site</span>
                </label>

                <div className="ov-cards-editor">
                  <div className="ct-label-row">
                    <p className="ct-section-label">Cards</p>
                    <span className="ct-char-count">{form.cards.length}/{MAX_CARDS}</span>
                  </div>

                  {form.cards.length === 0 && <p className="ct-hint" style={{ margin: 0 }}>No cards yet. Add the points this overview should list.</p>}

                  {form.cards.map((c, i) => {
                    const locked = !editable("cards");
                    return (
                      <div key={i} className="ov-card-row">
                        <div className="ov-card-side">
                          <span className="ov-card-num">{String(i + 1).padStart(2, "0")}</span>
                          {!locked && (
                            <div className="ct-order-btns">
                              <button type="button" className="pr-icon-btn" onClick={() => moveCard(i, -1)} disabled={i === 0} aria-label={`Move card ${i + 1} up`} title="Move up"><Svg size={12}>{Icon.up}</Svg></button>
                              <button type="button" className="pr-icon-btn" onClick={() => moveCard(i, 1)} disabled={i === form.cards.length - 1} aria-label={`Move card ${i + 1} down`} title="Move down"><Svg size={12}>{Icon.down}</Svg></button>
                            </div>
                          )}
                        </div>
                        <div className="ov-card-fields">
                          <input className="form-input" required maxLength={150} disabled={locked} aria-label={`Card ${i + 1} title`}
                            placeholder="Title, e.g. Official nanoCAD Provider" value={c.title} onChange={(e) => setCard(i, { title: e.target.value })} />
                          <textarea className="form-input" rows={3} maxLength={1000} disabled={locked} aria-label={`Card ${i + 1} description`} style={{ resize: "vertical" }}
                            placeholder="Description" value={c.description} onChange={(e) => setCard(i, { description: e.target.value })} />
                        </div>
                        {!locked && (
                          <button type="button" title="Remove card" aria-label={`Remove card ${i + 1}`} className="pr-icon-btn pr-tone-danger"
                            onClick={() => setForm((f) => ({ ...f, cards: f.cards.filter((_, j) => j !== i) }))}>
                            <Svg>{Icon.trash}</Svg>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {editable("cards") && form.cards.length < MAX_CARDS && (
                    <button type="button" className="btn-ghost ov-add-card" onClick={() => setForm((f) => ({ ...f, cards: [...f.cards, { title: "", description: "" }] }))}>
                      <Svg>{Icon.plus}</Svg>Add card
                    </button>
                  )}
                </div>

                {(canEdit || (canDelete && exists)) && (
                  <div className="ov-actions">
                    {canDelete && exists && (confirmDelete ? (
                      <span className="ov-delete-confirm">
                        Delete this overview?
                        <button type="button" className="btn-danger-ghost" onClick={remove} disabled={saving}>Delete</button>
                        <button type="button" className="btn-ghost" onClick={() => setConfirmDelete(false)} disabled={saving}>Cancel</button>
                      </span>
                    ) : (
                      <button type="button" className="btn-danger-ghost ov-delete" onClick={() => setConfirmDelete(true)} disabled={saving}>
                        <Svg>{Icon.trash}</Svg>Delete
                      </button>
                    ))}
                    {canEdit && <>
                    <button type="button" className="btn-ghost" onClick={() => setForm(saved)} disabled={saving || !dirty}>Discard changes</button>
                    <button type="submit" className="btn-primary" disabled={saving || !form.title.trim() || (exists && !dirty)}>
                      {saving ? "Saving…" : exists ? "Save changes" : "Create overview"}
                    </button>
                    </>}
                  </div>
                )}
              </form>

              <OverviewPreview form={form} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- Live preview, styled like the site's overview section ---------------- */

function OverviewPreview({ form }: { form: OverviewForm }) {
  return (
    <div className="pr-panel ov-panel ov-preview-wrap">
      <p className="ct-section-label" style={{ marginTop: 0 }}>Preview</p>
      <div className={`ov-preview ${form.hidden ? "is-hidden" : ""}`} aria-label="Preview">
        <div className="ov-preview-head">
          <span className="ov-preview-line" />
          <h3 className="ov-preview-title">{form.title.trim() || "OVERVIEW TITLE"}</h3>
          <span className="ov-preview-line" />
        </div>
        {form.subtitle.trim() && <p className="ov-preview-sub">{form.subtitle}</p>}
        <div className="ov-preview-grid">
          {form.cards.map((c, i) => (
            <div key={i} className="ov-preview-card">
              <span className="ov-preview-num">{String(i + 1).padStart(2, "0")}</span>
              <h4>{c.title.trim() || "Card title"}</h4>
              {c.description.trim() && <p>{c.description}</p>}
            </div>
          ))}
        </div>
        {form.hidden && <span className="ov-preview-hidden">Hidden on the site</span>}
      </div>
    </div>
  );
}
