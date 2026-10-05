"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getApiHeroSlides, postApiHeroSlides, putApiHeroSlidesById, deleteApiHeroSlidesById,
  patchApiHeroSlidesByIdHidden, putApiHeroSlidesReorder, putApiHeroSlidesByIdImage, deleteApiHeroSlidesByIdImage,
} from "@/client";
import type { HeroSlideButtonRequest, HeroSlideDto } from "@/client/types.gen";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { HERO_ICONS, HeroIcon } from "@/lib/heroIcons";
import "@/components/product-form.css";
import "../products/products.css";
import "../catalog/catalog.css";
import "./hero-slides.css";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";
const MAX_BUTTONS = 4;

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
  slides: <><rect x="2" y="4" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /></>,
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

export default function HeroSlidesPage() {
  const { user } = useAuth();
  const isAdmin = user != null && user.role !== "Student" && user.role !== "NormalUser";
  const { success, error: toastError } = useToast();

  const [slides, setSlides] = useState<HeroSlideDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<HeroSlideDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getApiHeroSlides({ baseUrl, query: { includeHidden: true }, throwOnError: false });
      if (res.data?.isSuccess) setSlides(res.data.value ?? []);
      else setError(errorText(res.data, "Failed to load slides."));
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to load slides.");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (isAdmin) fetchSlides(); }, [isAdmin, fetchSlides]);

  const patchSlide = (id: string, patch: Partial<HeroSlideDto>) =>
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const previous = slides;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    setSlides(next);
    try {
      setReordering(true);
      const res = await putApiHeroSlidesReorder({ baseUrl, body: { slideIds: next.map((s) => s.id!) }, throwOnError: false });
      if (res.error || res.data?.isError) {
        setSlides(previous);
        toastError(errorText(res.data, "Failed to save the new order."));
      }
    } catch (err) {
      setSlides(previous);
      toastError((err instanceof Error && err.message) || "Failed to save the new order.");
    } finally {
      setReordering(false);
    }
  };

  const toggleHidden = async (slide: HeroSlideDto) => {
    const hidden = !slide.hidden;
    patchSlide(slide.id!, { hidden });
    setBusyId(slide.id!);
    try {
      const res = await patchApiHeroSlidesByIdHidden({ baseUrl, path: { id: slide.id! }, body: { hidden }, throwOnError: false });
      if (res.error || res.data?.isError) {
        patchSlide(slide.id!, { hidden: !hidden });
        toastError(errorText(res.data, "Failed to update visibility."));
      }
    } finally {
      setBusyId(null);
    }
  };

  const uploadImage = async (slide: HeroSlideDto, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toastError("Please choose an image file."); return; }
    setBusyId(slide.id!);
    try {
      const res = await putApiHeroSlidesByIdImage({ baseUrl, path: { id: slide.id! }, body: { File: file }, throwOnError: false });
      if (res.error || res.data?.isError) { toastError(errorText(res.data, "Failed to upload image.")); return; }
      patchSlide(slide.id!, { imageUrl: res.data?.value ?? null });
      success("Image uploaded.");
    } finally {
      setBusyId(null);
    }
  };

  const removeImage = async (slide: HeroSlideDto) => {
    setBusyId(slide.id!);
    try {
      const res = await deleteApiHeroSlidesByIdImage({ baseUrl, path: { id: slide.id! }, throwOnError: false });
      if (res.error || res.data?.isError) { toastError(errorText(res.data, "Failed to remove image.")); return; }
      patchSlide(slide.id!, { imageUrl: null });
      success("Image removed.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (slide: HeroSlideDto) => {
    setBusyId(slide.id!);
    try {
      const res = await deleteApiHeroSlidesById({ baseUrl, path: { id: slide.id! }, throwOnError: false });
      if (res.error || res.data?.isError) { toastError(errorText(res.data, "Failed to delete slide.")); return; }
      setSlides((prev) => prev.filter((s) => s.id !== slide.id));
      success("Slide deleted.");
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  if (user && !isAdmin) return <div className="alert-error">You don&apos;t have access to this page.</div>;

  const visibleCount = slides.filter((s) => !s.hidden).length;

  return (
    <div className="pr-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Hero Slides</h1>
          <p className="page-subtitle">
            {loading ? "Loading…" : `${slides.length} slide${slides.length === 1 ? "" : "s"} · ${visibleCount} shown on the home page`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <a href="/home?view=site" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Svg><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Svg>View on site
          </a>
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
            <Svg>{Icon.plus}</Svg>New slide
          </button>
        </div>
      </div>

      {error && <div className="alert-error pr-alert">{error}</div>}

      <p className="ct-hint">Slides rotate on the home page in this order. Hidden slides are kept but not shown.</p>

      <div className="pr-panel ct-list">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ct-row">
              <div className="skeleton" style={{ width: 120, height: 68, borderRadius: 10 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: "70%" }} />
              </div>
            </div>
          ))
        ) : slides.length === 0 ? (
          <div className="ct-empty">
            <span className="ct-empty-icon"><Svg size={24}>{Icon.slides}</Svg></span>
            <p className="ct-empty-title">No slides yet</p>
            <p className="ct-empty-sub">The home page slider is empty until you add one.</p>
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}><Svg>{Icon.plus}</Svg>New slide</button>
          </div>
        ) : (
          slides.map((slide, index) => {
            const busy = busyId === slide.id;
            return (
              <div key={slide.id} className={`ct-row hs-row ${slide.hidden ? "is-hidden" : ""}`}>
                <div className="ct-order">
                  <span className="ct-order-num">{index + 1}</span>
                  <div className="ct-order-btns">
                    <button type="button" className="pr-icon-btn" onClick={() => move(index, -1)} disabled={reordering || index === 0} aria-label={`Move ${slide.title} up`} title="Move up">
                      <Svg size={12}>{Icon.up}</Svg>
                    </button>
                    <button type="button" className="pr-icon-btn" onClick={() => move(index, 1)} disabled={reordering || index === slides.length - 1} aria-label={`Move ${slide.title} down`} title="Move down">
                      <Svg size={12}>{Icon.down}</Svg>
                    </button>
                  </div>
                </div>

                <div className="hs-thumb">
                  {slide.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={resolveMediaUrl(slide.imageUrl)} alt="" />
                    : <span className="hs-thumb-empty"><Svg size={18}>{Icon.image}</Svg></span>}
                </div>

                <div className="ct-main">
                  {slide.badge && <span className="hs-badge">{slide.badge}</span>}
                  <div className="ct-name hs-title">{slide.title}</div>
                  <div className="hs-buttons">
                    {(slide.buttons ?? []).length === 0
                      ? <span className="ct-sub is-missing">No buttons</span>
                      : (slide.buttons ?? []).map((b, i) => (
                        <span key={i} className={`hs-chip ${b.variant === "secondary" ? "is-secondary" : ""}`}>
                          <HeroIcon name={b.icon} size={12} />{b.text}
                        </span>
                      ))}
                  </div>
                </div>

                <label className="pr-visibility" title={slide.hidden ? "Hidden — click to show" : "Shown — click to hide"} style={{ opacity: busy ? 0.6 : 1 }}>
                  <span className="pf-toggle-switch">
                    <input type="checkbox" checked={!slide.hidden} disabled={busy} onChange={() => toggleHidden(slide)} aria-label={`${slide.title} shown`} />
                    <span className="pf-toggle-track" />
                  </span>
                  <span className={slide.hidden ? "pr-muted" : ""}>{slide.hidden ? "Hidden" : "Shown"}</span>
                </label>

                <div className="pr-actions">
                  <label className={`pr-icon-btn pr-tone-green ${busy ? "is-disabled" : ""}`} title={slide.imageUrl ? "Replace image" : "Upload image"}>
                    <Svg>{Icon.image}</Svg>
                    <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { uploadImage(slide, e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                  {slide.imageUrl && <IconButton title="Remove image" onClick={() => removeImage(slide)} disabled={busy}>{Icon.x}</IconButton>}
                  <IconButton title={`Edit ${slide.title}`} onClick={() => setEditing(slide)}>{Icon.edit}</IconButton>
                  {confirmDeleteId === slide.id ? (
                    <span className="pr-confirm">
                      <IconButton title="Confirm delete" tone="danger" onClick={() => remove(slide)} disabled={busy}>{Icon.check}</IconButton>
                      <IconButton title="Cancel" onClick={() => setConfirmDeleteId(null)}>{Icon.x}</IconButton>
                    </span>
                  ) : (
                    <IconButton title={`Delete ${slide.title}`} tone="danger" onClick={() => setConfirmDeleteId(slide.id!)}>{Icon.trash}</IconButton>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {(editing || creating) && (
        <SlideModal
          slide={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={(saved, isNew) => {
            setSlides((prev) => (isNew ? [...prev, saved] : prev.map((s) => (s.id === saved.id ? saved : s))));
            success(isNew ? "Slide created." : "Slide saved.");
          }}
          onError={(msg) => toastError(msg)}
        />
      )}
    </div>
  );
}

/* ---------------- Create / edit modal ---------------- */

type ButtonForm = { text: string; url: string; icon: string; variant: "primary" | "secondary" };
const newButton = (index: number): ButtonForm => ({ text: "", url: "", icon: index === 0 ? "arrow" : "", variant: index === 0 ? "primary" : "secondary" });

function SlideModal({ slide, onClose, onSaved, onError }: {
  slide: HeroSlideDto | null;
  onClose: () => void;
  onSaved: (slide: HeroSlideDto, isNew: boolean) => void;
  onError: (msg: string) => void;
}) {
  const [badge, setBadge] = useState(slide?.badge ?? "");
  const [title, setTitle] = useState(slide?.title ?? "");
  const [description, setDescription] = useState(slide?.description ?? "");
  const [hidden, setHidden] = useState(slide?.hidden ?? false);
  const [buttons, setButtons] = useState<ButtonForm[]>(
    (slide?.buttons ?? []).map((b) => ({
      text: b.text ?? "",
      url: b.url ?? "",
      icon: b.icon ?? "",
      variant: b.variant === "secondary" ? "secondary" : "primary",
    }))
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(slide?.imageUrl ? resolveMediaUrl(slide.imageUrl) : "");
  const [saving, setSaving] = useState(false);

  useEffect(() => () => { if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const setButton = (i: number, patch: Partial<ButtonForm>) => setButtons((prev) => prev.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const moveButton = (i: number, d: -1 | 1) => setButtons((prev) => {
    const next = [...prev];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    return next;
  });

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { onError("Please choose an image file."); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        badge: badge.trim() || null,
        description: description.trim() || null,
        hidden,
        buttons: buttons.map<HeroSlideButtonRequest>((b) => ({ text: b.text.trim(), url: b.url.trim(), icon: b.icon || null, variant: b.variant })),
      };
      const res = slide?.id
        ? await putApiHeroSlidesById({ baseUrl, path: { id: slide.id }, body, throwOnError: false })
        : await postApiHeroSlides({ baseUrl, body, throwOnError: false });
      let saved = res.data?.value;
      if (res.error || res.data?.isError || !saved) throw new Error(errorText(res.data ?? res.error, "Failed to save slide."));

      // The image has its own endpoint, so it's uploaded once the slide exists.
      if (imageFile && saved.id) {
        const imgRes = await putApiHeroSlidesByIdImage({ baseUrl, path: { id: saved.id }, body: { File: imageFile }, throwOnError: false });
        if (imgRes.error || imgRes.data?.isError) throw new Error(errorText(imgRes.data, "Slide saved, but the image upload failed."));
        saved = { ...saved, imageUrl: imgRes.data?.value ?? saved.imageUrl };
      }

      // PUT ignores "hidden"; keep the list in sync with what the slide had.
      onSaved({ ...saved, hidden: slide ? slide.hidden : saved.hidden }, !slide);
      onClose();
    } catch (err) {
      onError((err instanceof Error && err.message) || "Failed to save slide.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container wide hs-modal">
        <div className="modal-header">
          <h2 className="modal-title">{slide ? "Edit slide" : "New slide"}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Live preview, styled like the home page hero */}
          <div
            className={`hs-preview ${imagePreview ? "has-bg" : ""}`}
            aria-label="Preview"
            style={imagePreview ? { backgroundImage: `linear-gradient(90deg, rgba(8,15,35,.94) 0%, rgba(8,15,35,.8) 38%, rgba(8,15,35,.25) 72%, rgba(8,15,35,.05) 100%), url("${imagePreview}")` } : undefined}
          >
            <div className="hs-preview-text">
              {badge.trim() && <span className="hs-preview-badge">{badge}</span>}
              <h3 className="hs-preview-title">{title.trim() || "Slide title"}</h3>
              {description.trim() && <p className="hs-preview-desc">{description}</p>}
              {buttons.some((b) => b.text.trim()) && (
                <div className="hs-preview-buttons">
                  {buttons.filter((b) => b.text.trim()).map((b, i) => (
                    <span key={i} className={`hs-preview-btn ${b.variant === "secondary" ? "is-secondary" : ""}`}>
                      {b.variant === "secondary" && <HeroIcon name={b.icon} size={15} />}
                      {b.text}
                      {b.variant !== "secondary" && <HeroIcon name={b.icon} size={15} />}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="hs-preview-media">
              {!imagePreview && <span className="hs-preview-noimg"><Svg size={22}>{Icon.image}</Svg>No background image</span>}
            </div>
          </div>

          <form id="slideForm" onSubmit={submit} className="hs-form">
            <div className="hs-form-grid">
              <div className="ct-fields">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="ct-label-row">
                    <label className="form-label" htmlFor="slideBadge">Badge</label>
                    <span className="ct-char-count">{badge.length}/100</span>
                  </div>
                  <input id="slideBadge" className="form-input" maxLength={100} value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. Professional-grade CAD software" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="ct-label-row">
                    <label className="form-label" htmlFor="slideTitle">Title *</label>
                    <span className="ct-char-count">{title.length}/200</span>
                  </div>
                  <input id="slideTitle" className="form-input" required autoFocus maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. nanoCAD Platform" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="ct-label-row">
                    <label className="form-label" htmlFor="slideDescription">Description</label>
                    <span className="ct-char-count">{description.length}/1000</span>
                  </div>
                  <textarea id="slideDescription" className="form-input" rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: "vertical" }} />
                </div>
              </div>

              <div className="ct-fields">
                <span className="form-label">Image</span>
                <div className="hs-image-picker">
                  <label className="btn-ghost" style={{ cursor: "pointer" }}>
                    {imagePreview ? "Change image" : "Choose image"}
                    <input type="file" accept="image/*" hidden onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                  {imageFile && <span className="ct-hint" style={{ margin: 0 }}>Uploads when you save.</span>}
                </div>
                {!slide && (
                  <label className="pf-toggle" style={{ marginTop: "0.5rem" }}>
                    <span className="pf-toggle-switch">
                      <input type="checkbox" checked={!hidden} onChange={(e) => setHidden(!e.target.checked)} />
                      <span className="pf-toggle-track" />
                    </span>
                    <span className="pf-toggle-label">Show on the home page</span>
                  </label>
                )}
              </div>
            </div>

            <div className="hs-buttons-editor">
              <div className="ct-label-row">
                <p className="ct-section-label">Buttons</p>
                <span className="ct-char-count">{buttons.length}/{MAX_BUTTONS}</span>
              </div>

              {buttons.length === 0 && <p className="ct-hint" style={{ margin: 0 }}>No buttons. The slide shows only its text.</p>}

              {buttons.map((b, i) => (
                <div key={i} className="hs-button-row">
                  <div className="ct-order-btns">
                    <button type="button" className="pr-icon-btn" onClick={() => moveButton(i, -1)} disabled={i === 0} aria-label="Move button up"><Svg size={12}>{Icon.up}</Svg></button>
                    <button type="button" className="pr-icon-btn" onClick={() => moveButton(i, 1)} disabled={i === buttons.length - 1} aria-label="Move button down"><Svg size={12}>{Icon.down}</Svg></button>
                  </div>
                  <input className="form-input" required maxLength={60} placeholder="Text, e.g. Browse Products" aria-label={`Button ${i + 1} text`}
                    value={b.text} onChange={(e) => setButton(i, { text: e.target.value })} />
                  <input className="form-input" required maxLength={500} placeholder="Link, e.g. /products or #contact" aria-label={`Button ${i + 1} link`}
                    value={b.url} onChange={(e) => setButton(i, { url: e.target.value })} />
                  <select className="form-input" aria-label={`Button ${i + 1} icon`} value={b.icon} onChange={(e) => setButton(i, { icon: e.target.value })} style={{ appearance: "auto" }}>
                    <option value="">No icon</option>
                    {Object.entries(HERO_ICONS).map(([key, icon]) => <option key={key} value={key}>{icon.label}</option>)}
                  </select>
                  <div className="hs-variant" role="radiogroup" aria-label={`Button ${i + 1} style`}>
                    <button type="button" role="radio" aria-checked={b.variant === "primary"} className={b.variant === "primary" ? "is-active" : ""} onClick={() => setButton(i, { variant: "primary" })}>Filled</button>
                    <button type="button" role="radio" aria-checked={b.variant === "secondary"} className={b.variant === "secondary" ? "is-active" : ""} onClick={() => setButton(i, { variant: "secondary" })}>Outline</button>
                  </div>
                  <IconButton title="Remove button" tone="danger" onClick={() => setButtons((prev) => prev.filter((_, j) => j !== i))}>{Icon.trash}</IconButton>
                </div>
              ))}

              {buttons.length < MAX_BUTTONS && (
                <button type="button" className="btn-ghost hs-add-button" onClick={() => setButtons((prev) => [...prev, newButton(prev.length)])}>
                  <Svg>{Icon.plus}</Svg>Add button
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="slideForm" className="btn-primary" disabled={saving || !title.trim()}>
            {saving ? "Saving…" : slide ? "Save changes" : "Create slide"}
          </button>
        </div>
      </div>
    </div>
  );
}
