"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getApiPartners, postApiPartners, putApiPartnersById, deleteApiPartnersById,
  patchApiPartnersByIdHidden, putApiPartnersReorder, putApiPartnersByIdLogo, deleteApiPartnersByIdLogo,
} from "@/client";
import type { PartnerDto } from "@/client/types.gen";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import PartnersCarousel from "@/components/PartnersCarousel";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { resolveButtonLink } from "@/lib/heroSlides";
import "@/components/product-form.css";
import "../products/products.css";
import "../catalog/catalog.css";
import "./partners.css";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

// Must match the backend's rules (PNG/JPG/WebP/GIF, up to 5 MB; no SVG).
const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const LOGO_TYPES = LOGO_ACCEPT.split(",");
const LOGO_MAX_BYTES = 5 * 1024 * 1024;

const checkLogo = (file: File): string | null => {
  if (!LOGO_TYPES.includes(file.type)) return "The logo must be a PNG, JPG, WebP or GIF image (SVG isn't allowed).";
  if (file.size > LOGO_MAX_BYTES) return "The logo must be at most 5 MB.";
  return null;
};

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
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  handshake: <><path d="M11 17l2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2" /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /></>,
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

export default function PartnersPage() {
  const { user } = useAuth();
  const isAdmin = user != null && user.role !== "Student" && user.role !== "NormalUser";
  const { success, error: toastError } = useToast();

  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<PartnerDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getApiPartners({ baseUrl, query: { includeHidden: true }, throwOnError: false });
      if (res.data?.isSuccess) setPartners(res.data.value ?? []);
      else setError(errorText(res.data, "Failed to load partners."));
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to load partners.");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (isAdmin) fetchPartners(); }, [isAdmin, fetchPartners]);

  const patchPartner = (id: string, patch: Partial<PartnerDto>) =>
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= partners.length) return;
    const previous = partners;
    const next = [...partners];
    [next[index], next[target]] = [next[target], next[index]];
    setPartners(next);
    try {
      setReordering(true);
      const res = await putApiPartnersReorder({ baseUrl, body: { partnerIds: next.map((p) => p.id!) }, throwOnError: false });
      if (res.error || res.data?.isError) {
        setPartners(previous);
        toastError(errorText(res.data, "Failed to save the new order."));
      }
    } catch (err) {
      setPartners(previous);
      toastError((err instanceof Error && err.message) || "Failed to save the new order.");
    } finally {
      setReordering(false);
    }
  };

  const toggleHidden = async (partner: PartnerDto) => {
    const hidden = !partner.hidden;
    patchPartner(partner.id!, { hidden });
    setBusyId(partner.id!);
    try {
      const res = await patchApiPartnersByIdHidden({ baseUrl, path: { id: partner.id! }, body: { hidden }, throwOnError: false });
      if (res.error || res.data?.isError) {
        patchPartner(partner.id!, { hidden: !hidden });
        toastError(errorText(res.data, "Failed to update visibility."));
      }
    } finally {
      setBusyId(null);
    }
  };

  const uploadLogo = async (partner: PartnerDto, file: File | undefined) => {
    if (!file) return;
    const problem = checkLogo(file);
    if (problem) { toastError(problem); return; }
    setBusyId(partner.id!);
    try {
      const res = await putApiPartnersByIdLogo({ baseUrl, path: { id: partner.id! }, body: { File: file }, throwOnError: false });
      if (res.error || res.data?.isError) { toastError(errorText(res.data ?? res.error, "Failed to upload logo.")); return; }
      patchPartner(partner.id!, { logoUrl: res.data?.value ?? null });
      success("Logo uploaded.");
    } finally {
      setBusyId(null);
    }
  };

  const removeLogo = async (partner: PartnerDto) => {
    setBusyId(partner.id!);
    try {
      const res = await deleteApiPartnersByIdLogo({ baseUrl, path: { id: partner.id! }, throwOnError: false });
      if (res.error || res.data?.isError) { toastError(errorText(res.data, "Failed to remove logo.")); return; }
      patchPartner(partner.id!, { logoUrl: null });
      success("Logo removed.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (partner: PartnerDto) => {
    setBusyId(partner.id!);
    try {
      const res = await deleteApiPartnersById({ baseUrl, path: { id: partner.id! }, throwOnError: false });
      if (res.error || res.data?.isError) { toastError(errorText(res.data, "Failed to delete partner.")); return; }
      setPartners((prev) => prev.filter((p) => p.id !== partner.id));
      success(`${partner.name} deleted.`);
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  if (user && !isAdmin) return <div className="alert-error">You don&apos;t have access to this page.</div>;

  // What visitors see: shown partners that have a logo.
  const onSite = partners.filter((p) => !p.hidden && p.logoUrl);

  return (
    <div className="pr-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Partners</h1>
          <p className="page-subtitle">
            {loading ? "Loading…" : `${partners.length} partner${partners.length === 1 ? "" : "s"} · ${onSite.length} shown in "Trusted Partners"`}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
          <Svg>{Icon.plus}</Svg>New partner
        </button>
      </div>

      {error && <div className="alert-error pr-alert">{error}</div>}

      {!loading && onSite.length > 0 && (
        <div className="pr-panel pt-preview">
          <span className="ct-section-label">Live preview</span>
          <PartnersCarousel partners={onSite} autoPlayMs={0} />
        </div>
      )}

      <p className="ct-hint">Partners appear in this order. A partner shows on the site only when it&apos;s switched on and has a logo.</p>

      <div className="pr-panel ct-list">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ct-row">
              <div className="skeleton" style={{ width: 120, height: 60, borderRadius: 10 }} />
              <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 14, width: "35%" }} /></div>
            </div>
          ))
        ) : partners.length === 0 ? (
          <div className="ct-empty">
            <span className="ct-empty-icon"><Svg size={24}>{Icon.handshake}</Svg></span>
            <p className="ct-empty-title">No partners yet</p>
            <p className="ct-empty-sub">Add partner companies and their logos for the &quot;Trusted Partners&quot; section.</p>
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}><Svg>{Icon.plus}</Svg>New partner</button>
          </div>
        ) : (
          partners.map((partner, index) => {
            const busy = busyId === partner.id;
            const link = partner.websiteUrl ? resolveButtonLink(partner.websiteUrl) : null;
            return (
              <div key={partner.id} className={`ct-row pt-row ${partner.hidden || !partner.logoUrl ? "is-off" : ""}`}>
                <div className="ct-order">
                  <span className="ct-order-num">{index + 1}</span>
                  <div className="ct-order-btns">
                    <button type="button" className="pr-icon-btn" onClick={() => move(index, -1)} disabled={reordering || index === 0} aria-label={`Move ${partner.name} up`} title="Move up"><Svg size={12}>{Icon.up}</Svg></button>
                    <button type="button" className="pr-icon-btn" onClick={() => move(index, 1)} disabled={reordering || index === partners.length - 1} aria-label={`Move ${partner.name} down`} title="Move down"><Svg size={12}>{Icon.down}</Svg></button>
                  </div>
                </div>

                <div className="pt-logo">
                  {partner.logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={resolveMediaUrl(partner.logoUrl)} alt={partner.name ?? ""} />
                    : <span className="pt-logo-empty"><Svg size={16}>{Icon.image}</Svg>No logo</span>}
                </div>

                <div className="ct-main">
                  <div className="ct-name">{partner.name}</div>
                  {link
                    ? <a className="pt-site" href={link.href} target="_blank" rel="noopener noreferrer"><Svg size={11}>{Icon.link}</Svg>{partner.websiteUrl}</a>
                    : <div className="ct-sub is-missing">No website link</div>}
                  {!partner.logoUrl && <div className="pt-warning">Not shown on the site until a logo is uploaded.</div>}
                </div>

                <label className="pr-visibility" title={partner.hidden ? "Hidden — click to show" : "Shown — click to hide"} style={{ opacity: busy ? 0.6 : 1 }}>
                  <span className="pf-toggle-switch">
                    <input type="checkbox" checked={!partner.hidden} disabled={busy} onChange={() => toggleHidden(partner)} aria-label={`${partner.name} shown`} />
                    <span className="pf-toggle-track" />
                  </span>
                  <span className={partner.hidden ? "pr-muted" : ""}>{partner.hidden ? "Hidden" : "Shown"}</span>
                </label>

                <div className="pr-actions">
                  <label className={`pr-icon-btn pr-tone-green ${busy ? "is-disabled" : ""}`} title={partner.logoUrl ? "Replace logo" : "Upload logo"}>
                    <Svg>{Icon.image}</Svg>
                    <input type="file" accept={LOGO_ACCEPT} hidden disabled={busy} onChange={(e) => { uploadLogo(partner, e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                  {partner.logoUrl && <IconButton title="Remove logo" onClick={() => removeLogo(partner)} disabled={busy}>{Icon.x}</IconButton>}
                  <IconButton title={`Edit ${partner.name}`} onClick={() => setEditing(partner)}>{Icon.edit}</IconButton>
                  {confirmDeleteId === partner.id ? (
                    <span className="pr-confirm">
                      <IconButton title="Confirm delete" tone="danger" onClick={() => remove(partner)} disabled={busy}>{Icon.check}</IconButton>
                      <IconButton title="Cancel" onClick={() => setConfirmDeleteId(null)}>{Icon.x}</IconButton>
                    </span>
                  ) : (
                    <IconButton title={`Delete ${partner.name}`} tone="danger" onClick={() => setConfirmDeleteId(partner.id!)}>{Icon.trash}</IconButton>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {(editing || creating) && (
        <PartnerModal
          partner={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={(saved, isNew) => {
            setPartners((prev) => (isNew ? [...prev, saved] : prev.map((p) => (p.id === saved.id ? { ...saved, hidden: p.hidden } : p))));
            success(isNew ? `${saved.name} added.` : `${saved.name} saved.`);
          }}
          onError={(msg) => toastError(msg)}
        />
      )}
    </div>
  );
}

/* ---------------- Create / edit modal ---------------- */

function PartnerModal({ partner, onClose, onSaved, onError }: {
  partner: PartnerDto | null;
  onClose: () => void;
  onSaved: (partner: PartnerDto, isNew: boolean) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(partner?.name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(partner?.websiteUrl ?? "");
  const [hidden, setHidden] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(partner?.logoUrl ? resolveMediaUrl(partner.logoUrl) : "");
  const [saving, setSaving] = useState(false);

  useEffect(() => () => { if (logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview); }, [logoPreview]);

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    const problem = checkLogo(file);
    if (problem) { onError(problem); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name: name.trim(), websiteUrl: websiteUrl.trim() || null, hidden };
      const res = partner?.id
        ? await putApiPartnersById({ baseUrl, path: { id: partner.id }, body, throwOnError: false })
        : await postApiPartners({ baseUrl, body, throwOnError: false });
      let saved = res.data?.value;
      if (res.error || res.data?.isError || !saved) throw new Error(errorText(res.data ?? res.error, "Failed to save partner."));

      // The logo has its own endpoint, so it's uploaded once the partner exists.
      if (logoFile && saved.id) {
        const logoRes = await putApiPartnersByIdLogo({ baseUrl, path: { id: saved.id }, body: { File: logoFile }, throwOnError: false });
        if (logoRes.error || logoRes.data?.isError) throw new Error(errorText(logoRes.data ?? logoRes.error, "Partner saved, but the logo upload failed."));
        saved = { ...saved, logoUrl: logoRes.data?.value ?? saved.logoUrl };
      }

      onSaved(saved, !partner);
      onClose();
    } catch (err) {
      onError((err instanceof Error && err.message) || "Failed to save partner.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">{partner ? `Edit ${partner.name}` : "New partner"}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="modal-body">
          <form id="partnerForm" onSubmit={submit} className="ct-fields">
            <div className="pt-logo-picker">
              <div className="pt-logo pt-logo-lg">
                {logoPreview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={logoPreview} alt="Logo preview" />
                  : <span className="pt-logo-empty"><Svg size={22}>{Icon.image}</Svg>No logo</span>}
              </div>
              <div className="ct-fields" style={{ gap: "0.4rem" }}>
                <label className="btn-ghost" style={{ cursor: "pointer", alignSelf: "flex-start" }}>
                  {logoPreview ? "Change logo" : "Choose logo"}
                  <input type="file" accept={LOGO_ACCEPT} hidden onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ""; }} />
                </label>
                <span className="ct-hint" style={{ margin: 0 }}>
                  PNG, JPG, WebP or GIF, up to 5 MB. A transparent PNG/WebP looks best.{logoFile ? " Uploads when you save." : ""}
                </span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="partnerName">Name *</label>
              <input id="partnerName" className="form-input" required autoFocus maxLength={150} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. EDGES Consulting" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="partnerSite">Website</label>
              <input id="partnerSite" className="form-input" maxLength={500} value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Optional, e.g. www.edges.com" />
            </div>

            {!partner && (
              <label className="pf-toggle">
                <span className="pf-toggle-switch">
                  <input type="checkbox" checked={!hidden} onChange={(e) => setHidden(!e.target.checked)} />
                  <span className="pf-toggle-track" />
                </span>
                <span className="pf-toggle-label">Show on the site</span>
              </label>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="partnerForm" className="btn-primary" disabled={saving || !name.trim()}>
            {saving ? "Saving…" : partner ? "Save changes" : "Add partner"}
          </button>
        </div>
      </div>
    </div>
  );
}
