"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getApiPromoBars, postApiPromoBars, putApiPromoBarsById, deleteApiPromoBarsById,
  patchApiPromoBarsByIdHidden, putApiPromoBarsReorder,
} from "@/client";
import type { PromoBarDto } from "@/client/types.gen";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import PromoBarView from "@/components/PromoBarView";
import "@/components/product-form.css";
import "../products/products.css";
import "../catalog/catalog.css";
import "./promo-bars.css";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

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
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  megaphone: <><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></>,
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

export default function PromoBarsPage() {
  const { user } = useAuth();
  const isAdmin = user != null && user.role !== "Student" && user.role !== "NormalUser";
  const { success, error: toastError } = useToast();

  const [bars, setBars] = useState<PromoBarDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<PromoBarDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchBars = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getApiPromoBars({ baseUrl, query: { includeHidden: true }, throwOnError: false });
      if (res.data?.isSuccess) setBars(res.data.value ?? []);
      else setError(errorText(res.data, "Failed to load promo bars."));
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to load promo bars.");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (isAdmin) fetchBars(); }, [isAdmin, fetchBars]);

  const patchBar = (id: string, patch: Partial<PromoBarDto>) =>
    setBars((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= bars.length) return;
    const previous = bars;
    const next = [...bars];
    [next[index], next[target]] = [next[target], next[index]];
    setBars(next);
    try {
      setReordering(true);
      const res = await putApiPromoBarsReorder({ baseUrl, body: { promoBarIds: next.map((b) => b.id!) }, throwOnError: false });
      if (res.error || res.data?.isError) {
        setBars(previous);
        toastError(errorText(res.data, "Failed to save the new order."));
      }
    } catch (err) {
      setBars(previous);
      toastError((err instanceof Error && err.message) || "Failed to save the new order.");
    } finally {
      setReordering(false);
    }
  };

  const toggleHidden = async (bar: PromoBarDto) => {
    const hidden = !bar.hidden;
    patchBar(bar.id!, { hidden });
    setBusyId(bar.id!);
    try {
      const res = await patchApiPromoBarsByIdHidden({ baseUrl, path: { id: bar.id! }, body: { hidden }, throwOnError: false });
      if (res.error || res.data?.isError) {
        patchBar(bar.id!, { hidden: !hidden });
        toastError(errorText(res.data, "Failed to update visibility."));
      }
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (bar: PromoBarDto) => {
    setBusyId(bar.id!);
    try {
      const res = await deleteApiPromoBarsById({ baseUrl, path: { id: bar.id! }, throwOnError: false });
      if (res.error || res.data?.isError) { toastError(errorText(res.data, "Failed to delete promo bar.")); return; }
      setBars((prev) => prev.filter((b) => b.id !== bar.id));
      success("Promo bar deleted.");
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  if (user && !isAdmin) return <div className="alert-error">You don&apos;t have access to this page.</div>;

  const visibleCount = bars.filter((b) => !b.hidden).length;

  return (
    <div className="pr-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Promo Bars</h1>
          <p className="page-subtitle">
            {loading ? "Loading…" : visibleCount === 0
              ? "No bar is shown on the site right now"
              : `${visibleCount} shown above the site header${visibleCount > 1 ? ", rotating" : ""}`}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
          <Svg>{Icon.plus}</Svg>New promo bar
        </button>
      </div>

      {error && <div className="alert-error pr-alert">{error}</div>}

      <p className="ct-hint">Shown bars rotate in this order, each for its own duration. Hide them all to remove the bar from the site.</p>

      <div className="pb-list">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 112, borderRadius: "var(--radius-lg)" }} />)
        ) : bars.length === 0 ? (
          <div className="pr-panel ct-empty">
            <span className="ct-empty-icon"><Svg size={24}>{Icon.megaphone}</Svg></span>
            <p className="ct-empty-title">No promo bars</p>
            <p className="ct-empty-sub">Announce an offer at the top of every page.</p>
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}><Svg>{Icon.plus}</Svg>New promo bar</button>
          </div>
        ) : (
          bars.map((bar, index) => {
            const busy = busyId === bar.id;
            return (
              <div key={bar.id} className={`pr-panel pb-card ${bar.hidden ? "is-hidden" : ""}`}>
                <div className="pb-card-preview">
                  <PromoBarView bar={bar} preview />
                </div>
                <div className="pb-card-footer">
                  <div className="ct-order">
                    <span className="ct-order-num">{index + 1}</span>
                    <div className="ct-order-btns">
                      <button type="button" className="pr-icon-btn" onClick={() => move(index, -1)} disabled={reordering || index === 0} aria-label="Move up" title="Move up"><Svg size={12}>{Icon.up}</Svg></button>
                      <button type="button" className="pr-icon-btn" onClick={() => move(index, 1)} disabled={reordering || index === bars.length - 1} aria-label="Move down" title="Move down"><Svg size={12}>{Icon.down}</Svg></button>
                    </div>
                  </div>

                  <span className="pb-meta"><Svg size={12}>{Icon.clock}</Svg>{bar.durationSeconds ?? 6}s</span>

                  <label className="pr-visibility" title={bar.hidden ? "Hidden — click to show" : "Shown — click to hide"} style={{ opacity: busy ? 0.6 : 1 }}>
                    <span className="pf-toggle-switch">
                      <input type="checkbox" checked={!bar.hidden} disabled={busy} onChange={() => toggleHidden(bar)} aria-label={`${bar.message} shown`} />
                      <span className="pf-toggle-track" />
                    </span>
                    <span className={bar.hidden ? "pr-muted" : ""}>{bar.hidden ? "Hidden" : "Shown"}</span>
                  </label>

                  <div className="pr-actions" style={{ marginLeft: "auto" }}>
                    <IconButton title="Edit" onClick={() => setEditing(bar)}>{Icon.edit}</IconButton>
                    {confirmDeleteId === bar.id ? (
                      <span className="pr-confirm">
                        <IconButton title="Confirm delete" tone="danger" onClick={() => remove(bar)} disabled={busy}>{Icon.check}</IconButton>
                        <IconButton title="Cancel" onClick={() => setConfirmDeleteId(null)}>{Icon.x}</IconButton>
                      </span>
                    ) : (
                      <IconButton title="Delete" tone="danger" onClick={() => setConfirmDeleteId(bar.id!)}>{Icon.trash}</IconButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {(editing || creating) && (
        <PromoBarModal
          bar={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={(saved, isNew) => {
            setBars((prev) => (isNew ? [...prev, saved] : prev.map((b) => (b.id === saved.id ? { ...saved, hidden: b.hidden } : b))));
            success(isNew ? "Promo bar created." : "Promo bar saved.");
          }}
          onError={(msg) => toastError(msg)}
        />
      )}
    </div>
  );
}

/* ---------------- Create / edit modal ---------------- */

type ColorKey = "backgroundColor" | "textColor" | "badgeBackgroundColor" | "badgeTextColor" | "buttonBackgroundColor" | "buttonTextColor";
type Colors = Record<ColorKey, string>;

// The site's default look; also what an empty color falls back to.
const DEFAULT_COLORS: Colors = {
  backgroundColor: "#061A40",
  textColor: "#E5ECF5",
  badgeBackgroundColor: "#22C55E26",
  badgeTextColor: "#22C55E",
  buttonBackgroundColor: "#22C55E",
  buttonTextColor: "#071F49",
};

const PRESETS: { name: string; colors: Colors }[] = [
  { name: "Navy & green", colors: DEFAULT_COLORS },
  { name: "Sale red", colors: { backgroundColor: "#7F1D1D", textColor: "#FEF2F2", badgeBackgroundColor: "#FFFFFF26", badgeTextColor: "#FFFFFF", buttonBackgroundColor: "#FBBF24", buttonTextColor: "#451A03" } },
  { name: "Gold", colors: { backgroundColor: "#FBBF24", textColor: "#1C1917", badgeBackgroundColor: "#1C19171F", badgeTextColor: "#1C1917", buttonBackgroundColor: "#1C1917", buttonTextColor: "#FBBF24" } },
  { name: "Brand blue", colors: { backgroundColor: "#1D4ED8", textColor: "#EFF6FF", badgeBackgroundColor: "#FFFFFF2E", badgeTextColor: "#FFFFFF", buttonBackgroundColor: "#FFFFFF", buttonTextColor: "#1D4ED8" } },
  { name: "Light", colors: { backgroundColor: "#F1F5F9", textColor: "#0F172A", badgeBackgroundColor: "#16A34A1F", badgeTextColor: "#15803D", buttonBackgroundColor: "#0F172A", buttonTextColor: "#FFFFFF" } },
];

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: "backgroundColor", label: "Background" },
  { key: "textColor", label: "Text" },
  { key: "badgeBackgroundColor", label: "Badge background" },
  { key: "badgeTextColor", label: "Badge text" },
  { key: "buttonBackgroundColor", label: "Button background" },
  { key: "buttonTextColor", label: "Button text" },
];

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** The #RRGGBB part of a hex color, for the native color picker (which has no transparency). */
const toPickerValue = (hex: string) => {
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  return /^#[0-9a-fA-F]{6}/.test(hex) ? hex.slice(0, 7) : "#000000";
};

function ColorField({ label, value, fallback, onChange }: { label: string; value: string; fallback: string; onChange: (v: string) => void }) {
  const effective = HEX.test(value) ? value : fallback;
  const invalid = value !== "" && !HEX.test(value);
  return (
    <div className="pb-color">
      <span className="pb-color-label">{label}</span>
      <div className={`pb-color-input ${invalid ? "is-invalid" : ""}`}>
        <label className="pb-swatch" style={{ background: effective }} title="Pick a color">
          <input
            type="color"
            value={toPickerValue(effective)}
            // Keep any transparency suffix (#RRGGBBAA) the color already had.
            onChange={(e) => onChange(e.target.value.toUpperCase() + (/^#[0-9a-fA-F]{8}$/.test(value) ? value.slice(7) : ""))}
          />
        </label>
        <input
          type="text"
          className="form-input"
          value={value}
          placeholder={`${fallback} (default)`}
          maxLength={9}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value.trim())}
          aria-label={`${label} color`}
        />
      </div>
    </div>
  );
}

function PromoBarModal({ bar, onClose, onSaved, onError }: {
  bar: PromoBarDto | null;
  onClose: () => void;
  onSaved: (bar: PromoBarDto, isNew: boolean) => void;
  onError: (msg: string) => void;
}) {
  const [badgeText, setBadgeText] = useState(bar?.badgeText ?? "");
  const [message, setMessage] = useState(bar?.message ?? "");
  const [buttonText, setButtonText] = useState(bar?.buttonText ?? "");
  const [buttonUrl, setButtonUrl] = useState(bar?.buttonUrl ?? "");
  const [duration, setDuration] = useState(String(bar?.durationSeconds ?? 6));
  const [hidden, setHidden] = useState(bar?.hidden ?? false);
  const [colors, setColors] = useState<Colors>(() => {
    const c = {} as Colors;
    for (const { key } of COLOR_FIELDS) c[key] = bar ? (bar[key] ?? "") : DEFAULT_COLORS[key];
    return c;
  });
  const [saving, setSaving] = useState(false);

  const setColor = (key: ColorKey, value: string) => setColors((prev) => ({ ...prev, [key]: value }));
  const invalidColor = COLOR_FIELDS.some(({ key }) => colors[key] !== "" && !HEX.test(colors[key]));
  const buttonHalf = !!buttonText.trim() !== !!buttonUrl.trim();

  const previewBar = {
    badgeText: badgeText.trim() || null,
    message: message.trim() || "Your announcement text",
    buttonText: buttonText.trim() || null,
    buttonUrl: buttonUrl.trim() || null,
    ...Object.fromEntries(COLOR_FIELDS.map(({ key }) => [key, HEX.test(colors[key]) ? colors[key] : null])),
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        message: message.trim(),
        badgeText: badgeText.trim() || null,
        buttonText: buttonText.trim() || null,
        buttonUrl: buttonUrl.trim() || null,
        durationSeconds: Number(duration) || 6,
        hidden,
        ...Object.fromEntries(COLOR_FIELDS.map(({ key }) => [key, colors[key] || null])),
      };
      const res = bar?.id
        ? await putApiPromoBarsById({ baseUrl, path: { id: bar.id }, body, throwOnError: false })
        : await postApiPromoBars({ baseUrl, body, throwOnError: false });
      const saved = res.data?.value;
      if (res.error || res.data?.isError || !saved) throw new Error(errorText(res.data ?? res.error, "Failed to save promo bar."));
      onSaved(saved, !bar);
      onClose();
    } catch (err) {
      onError((err instanceof Error && err.message) || "Failed to save promo bar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container wide pb-modal">
        <div className="modal-header">
          <h2 className="modal-title">{bar ? "Edit promo bar" : "New promo bar"}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="pb-preview" aria-label="Preview">
            <span className="ct-section-label">Live preview</span>
            <PromoBarView bar={previewBar} preview />
          </div>

          <form id="promoBarForm" onSubmit={submit} className="pb-form">
            <div className="pb-grid">
              <div className="ct-fields">
                <div className="pb-row-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="pbBadge">Badge</label>
                    <input id="pbBadge" className="form-input" maxLength={30} value={badgeText} onChange={(e) => setBadgeText(e.target.value)} placeholder="e.g. 20% OFF" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="pbDuration">Duration (seconds)</label>
                    <input id="pbDuration" type="number" className="form-input" required min={2} max={60} value={duration} onChange={(e) => setDuration(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="ct-label-row">
                    <label className="form-label" htmlFor="pbMessage">Message *</label>
                    <span className="ct-char-count">{message.length}/200</span>
                  </div>
                  <input id="pbMessage" className="form-input" required autoFocus maxLength={200} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Your First Year License for nanoCAD 26" />
                </div>
                <div className="pb-row-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="pbButtonText">Button text</label>
                    <input id="pbButtonText" className="form-input" maxLength={40} value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g. Buy Now" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="pbButtonUrl">Button link</label>
                    <input id="pbButtonUrl" className="form-input" maxLength={500} value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="/products, #contact or www.site.com" />
                  </div>
                </div>
                {buttonHalf && <p className="pb-warning">The button needs both a text and a link (or leave both empty for no button).</p>}
                {!bar && (
                  <label className="pf-toggle">
                    <span className="pf-toggle-switch">
                      <input type="checkbox" checked={!hidden} onChange={(e) => setHidden(!e.target.checked)} />
                      <span className="pf-toggle-track" />
                    </span>
                    <span className="pf-toggle-label">Show on the site</span>
                  </label>
                )}
              </div>

              <div className="ct-fields">
                <div className="ct-label-row">
                  <span className="ct-section-label">Colors</span>
                  <button type="button" className="pb-link-btn" onClick={() => setColors({ backgroundColor: "", textColor: "", badgeBackgroundColor: "", badgeTextColor: "", buttonBackgroundColor: "", buttonTextColor: "" })}>
                    Use site defaults
                  </button>
                </div>
                <div className="pb-presets" role="group" aria-label="Color presets">
                  {PRESETS.map((preset) => (
                    <button key={preset.name} type="button" className="pb-preset" onClick={() => setColors(preset.colors)} title={preset.name}>
                      <span className="pb-preset-swatch" style={{ background: preset.colors.backgroundColor }}>
                        <span style={{ background: preset.colors.buttonBackgroundColor }} />
                      </span>
                      {preset.name}
                    </button>
                  ))}
                </div>
                <div className="pb-colors">
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <ColorField key={key} label={label} value={colors[key]} fallback={DEFAULT_COLORS[key]} onChange={(v) => setColor(key, v)} />
                  ))}
                </div>
                <p className="ct-hint" style={{ margin: 0 }}>Hex codes like #22C55E. Add two digits for transparency, e.g. #22C55E26.</p>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="promoBarForm" className="btn-primary" disabled={saving || !message.trim() || invalidColor || buttonHalf}>
            {saving ? "Saving…" : bar ? "Save changes" : "Create promo bar"}
          </button>
        </div>
      </div>
    </div>
  );
}
