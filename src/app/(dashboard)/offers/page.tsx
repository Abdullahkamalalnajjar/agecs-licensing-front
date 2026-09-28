"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getApiProducts,
  getApiProductsByProductIdOffers,
  postApiProductsByProductIdOffers,
  putApiProductsOffersByOfferId,
  deleteApiProductsOffersByOfferId,
} from "@/client";
import { client } from "@/client/client.gen";
import type { OfferDto, ProductDto } from "@/client/types.gen";
import { useToast } from "@/components/ToastProvider";
import { CURRENCIES } from "@/context/CurrencyContext";
import "./offers.css";

type OfferStatus = "live" | "scheduled" | "expired" | "paused";
type Filter = "all" | OfferStatus;

const STATUS_LABEL: Record<OfferStatus, string> = {
  live: "Live",
  scheduled: "Scheduled",
  expired: "Expired",
  paused: "Paused",
};

const DAY = 24 * 60 * 60 * 1000;
const DURATION_PRESETS = [7, 14, 30, 90];

/** datetime-local wants local time, not UTC */
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const emptyForm = () => {
  const now = new Date();
  return {
    discountType: 0 as 0 | 1,
    discountValue: "",
    startDate: toLocalInput(now),
    endDate: toLocalInput(new Date(now.getTime() + 7 * DAY)),
    isActive: true,
  };
};

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message) || fallback;

const errorText = (errors: { description?: string | null }[] | null | undefined, fallback: string) =>
  errors?.map((e) => e.description).filter(Boolean).join(", ") || fallback;

function getStatus(offer: OfferDto, now: number): OfferStatus {
  if (!offer.isActive) return "paused";
  if (offer.startDate && new Date(offer.startDate).getTime() > now) return "scheduled";
  if (offer.endDate && new Date(offer.endDate).getTime() < now) return "expired";
  return "live";
}

function formatSpan(ms: number) {
  const abs = Math.abs(ms);
  const days = Math.floor(abs / DAY);
  const hours = Math.floor((abs % DAY) / (60 * 60 * 1000));
  if (days > 0) return `${days}d${hours ? ` ${hours}h` : ""}`;
  if (hours > 0) return `${hours}h`;
  return `${Math.max(1, Math.floor(abs / 60000))}m`;
}

function timeLabel(offer: OfferDto, status: OfferStatus, now: number) {
  const start = offer.startDate ? new Date(offer.startDate).getTime() : now;
  const end = offer.endDate ? new Date(offer.endDate).getTime() : now;
  if (status === "scheduled") return `Starts in ${formatSpan(start - now)}`;
  if (now > end) return `Ended ${formatSpan(now - end)} ago`;
  return `Ends in ${formatSpan(end - now)}`;
}

function progress(offer: OfferDto, now: number) {
  const start = offer.startDate ? new Date(offer.startDate).getTime() : now;
  const end = offer.endDate ? new Date(offer.endDate).getTime() : now;
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const priceFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const formatDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");

const discountLabel = (offer: { discountType?: number; discountValue?: number }) =>
  offer.discountType === 0 ? `${priceFmt.format(offer.discountValue ?? 0)}%` : priceFmt.format(offer.discountValue ?? 0);

export default function OffersPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [selectedVariationId, setSelectedVariationId] = useState("");

  const [offers, setOffers] = useState<OfferDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    client.setConfig({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003",
      auth: token,
    });

    (async () => {
      try {
        const res = await getApiProducts({ query: { includeHidden: true }, throwOnError: false });
        if (res.data?.isSuccess && res.data.value) {
          const parents = res.data.value.filter((p) => !p.parentProductId);
          setProducts(parents);
          if (parents.length > 0) setSelectedParentId(parents[0].id!);
        } else {
          setError(errorText(res.data?.errors, "Failed to load products."));
        }
      } catch (err) {
        setError(messageOf(err, "Failed to load products."));
      } finally {
        setProductsLoading(false);
      }
    })();
  }, [router]);

  const activeProductId = selectedVariationId || selectedParentId;
  const selectedParent = products.find((p) => p.id === selectedParentId);
  const variations = selectedParent?.children || [];
  const activeProductName =
    variations.find((v) => v.id === selectedVariationId)?.name || selectedParent?.name || "";

  const fetchOffers = async (productId = activeProductId) => {
    if (!productId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getApiProductsByProductIdOffers({ path: { productId }, throwOnError: false });
      if (res.data?.isSuccess) {
        setOffers(res.data.value || []);
      } else {
        setOffers([]);
        setError(errorText(res.data?.errors, "Failed to load offers."));
      }
    } catch (err) {
      setError(messageOf(err, "Failed to load offers."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProductId) fetchOffers(activeProductId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProductId]);

  const withStatus = useMemo(
    () =>
      offers
        .map((o) => ({ offer: o, status: getStatus(o, now) }))
        .sort((a, b) => {
          const order: Record<OfferStatus, number> = { live: 0, scheduled: 1, paused: 2, expired: 3 };
          return order[a.status] - order[b.status] ||
            new Date(b.offer.startDate || 0).getTime() - new Date(a.offer.startDate || 0).getTime();
        }),
    [offers, now]
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: offers.length, live: 0, scheduled: 0, expired: 0, paused: 0 };
    withStatus.forEach(({ status }) => c[status]++);
    return c;
  }, [withStatus, offers.length]);

  const visible = filter === "all" ? withStatus : withStatus.filter((o) => o.status === filter);

  const handleToggleActive = async (offer: OfferDto) => {
    if (!offer.id) return;
    setBusyId(offer.id);
    const next = !offer.isActive;
    setOffers((list) => list.map((o) => (o.id === offer.id ? { ...o, isActive: next } : o)));
    try {
      const res = await putApiProductsOffersByOfferId({
        path: { offerId: offer.id },
        body: {
          id: offer.id,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          startDate: offer.startDate,
          endDate: offer.endDate,
          isActive: next,
        },
        throwOnError: false,
      });
      if (res.data?.isSuccess) {
        success(next ? "Offer activated." : "Offer paused.");
      } else {
        setOffers((list) => list.map((o) => (o.id === offer.id ? { ...o, isActive: !next } : o)));
        toastError(errorText(res.data?.errors, "Failed to update offer."));
      }
    } catch (err) {
      setOffers((list) => list.map((o) => (o.id === offer.id ? { ...o, isActive: !next } : o)));
      toastError(messageOf(err, "Failed to update offer."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (offerId: string) => {
    setBusyId(offerId);
    try {
      const res = await deleteApiProductsOffersByOfferId({ path: { offerId }, throwOnError: false });
      if (res.data?.isSuccess) {
        setOffers((list) => list.filter((o) => o.id !== offerId));
        success("Offer deleted.");
      } else {
        toastError(errorText(res.data?.errors, "Failed to delete offer."));
      }
    } catch (err) {
      toastError(messageOf(err, "Failed to delete offer."));
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  const openModal = () => {
    setForm(emptyForm());
    setFormError("");
    setIsModalOpen(true);
  };

  const applyPreset = (days: number) => {
    const start = form.startDate ? new Date(form.startDate) : new Date();
    setForm({ ...form, endDate: toLocalInput(new Date(start.getTime() + days * DAY)) });
  };

  const formDays = form.startDate && form.endDate
    ? Math.round((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / DAY)
    : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(form.discountValue);
    if (!value || value <= 0) return setFormError("Discount value must be greater than 0.");
    if (form.discountType === 0 && value > 100) return setFormError("A percentage discount can't exceed 100%.");
    if (new Date(form.endDate) <= new Date(form.startDate)) return setFormError("End date must be after the start date.");

    setSaving(true);
    setFormError("");
    try {
      const res = await postApiProductsByProductIdOffers({
        path: { productId: activeProductId },
        body: {
          productId: activeProductId,
          discountType: form.discountType,
          discountValue: value,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          isActive: form.isActive,
        },
        throwOnError: false,
      });
      if (res.data?.isSuccess) {
        setIsModalOpen(false);
        setFilter("all");
        success("Offer created.");
        fetchOffers();
      } else {
        setFormError(errorText(res.data?.errors, "Failed to create offer."));
      }
    } catch (err) {
      setFormError(messageOf(err, "Failed to create offer."));
    } finally {
      setSaving(false);
    }
  };

  const currencyFor = (country?: string | null) => CURRENCIES.find((c) => c.code === country);

  return (
    <div className="of-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Offers</h1>
          <p className="page-subtitle">Schedule time-limited discounts for products and their variations.</p>
        </div>
        <button className="btn-primary" onClick={openModal} disabled={!activeProductId}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Offer
        </button>
      </div>

      {/* ---------- Product picker ---------- */}
      <section className="of-panel of-picker">
        <div className="of-picker-field">
          <label className="form-label" htmlFor="of-product">Product</label>
          {productsLoading ? (
            <div className="skeleton" style={{ height: 44 }} />
          ) : (
            <select
              id="of-product"
              className="form-input of-select"
              value={selectedParentId}
              onChange={(e) => { setSelectedParentId(e.target.value); setSelectedVariationId(""); setConfirmDeleteId(null); }}
              disabled={products.length === 0}
            >
              {products.length === 0 && <option value="">No products</option>}
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>

        {variations.length > 0 && (
          <div className="of-picker-field of-picker-variations">
            <span className="form-label">Apply to</span>
            <div className="of-chips" role="radiogroup" aria-label="Variation">
              <button
                type="button"
                role="radio"
                aria-checked={!selectedVariationId}
                className={`of-chip ${!selectedVariationId ? "is-active" : ""}`}
                onClick={() => { setSelectedVariationId(""); setConfirmDeleteId(null); }}
              >
                Parent product
              </button>
              {variations.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedVariationId === v.id}
                  className={`of-chip ${selectedVariationId === v.id ? "is-active" : ""}`}
                  onClick={() => { setSelectedVariationId(v.id!); setConfirmDeleteId(null); }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {error && (
        <div className="alert-error of-alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {activeProductId && (
        <>
          {/* ---------- Stats / filters ---------- */}
          <div className="of-stats" role="tablist" aria-label="Filter offers">
            {(["all", "live", "scheduled", "paused", "expired"] as Filter[]).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                className={`of-stat of-stat-${f} ${filter === f ? "is-active" : ""}`}
                onClick={() => setFilter(f)}
              >
                <span className="of-stat-label">
                  {f !== "all" && <span className="of-dot" />}
                  {f === "all" ? "All offers" : STATUS_LABEL[f]}
                </span>
                <span className="of-stat-value">{loading ? "–" : counts[f]}</span>
              </button>
            ))}
          </div>

          {/* ---------- Offer list ---------- */}
          {loading && offers.length === 0 ? (
            <div className="of-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="of-panel of-card">
                  <div className="skeleton" style={{ height: 22, width: "40%" }} />
                  <div className="skeleton" style={{ height: 44, width: "55%", marginTop: 16 }} />
                  <div className="skeleton" style={{ height: 8, marginTop: 20 }} />
                  <div className="skeleton" style={{ height: 60, marginTop: 20 }} />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="of-panel">
              <div className="empty-state">
                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <p className="empty-state-title">
                  {filter === "all" ? "No offers yet" : `No ${STATUS_LABEL[filter as OfferStatus].toLowerCase()} offers`}
                </p>
                <p className="empty-state-sub">
                  {filter === "all"
                    ? `Create a discount for ${activeProductName} to show reduced prices to customers.`
                    : "Try a different filter."}
                </p>
                {filter === "all" ? (
                  <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={openModal}>Create offer</button>
                ) : (
                  <button className="btn-ghost" style={{ marginTop: "1rem" }} onClick={() => setFilter("all")}>Show all offers</button>
                )}
              </div>
            </div>
          ) : (
            <div className={`of-grid ${loading ? "is-refreshing" : ""}`}>
              {visible.map(({ offer, status }) => {
                const busy = busyId === offer.id;
                return (
                  <article key={offer.id} className={`of-panel of-card is-${status}`}>
                    <header className="of-card-head">
                      <span className={`of-status of-status-${status}`}>
                        <span className="of-dot" />
                        {STATUS_LABEL[status]}
                      </span>
                      <label className="of-switch" title={offer.isActive ? "Pause offer" : "Activate offer"}>
                        <input
                          type="checkbox"
                          checked={!!offer.isActive}
                          disabled={busy}
                          onChange={() => handleToggleActive(offer)}
                          aria-label={offer.isActive ? "Pause offer" : "Activate offer"}
                        />
                        <span className="of-switch-track"><span className="of-switch-thumb" /></span>
                      </label>
                    </header>

                    <div className="of-discount">
                      <span className="of-discount-value">{discountLabel(offer)}</span>
                      <span className="of-discount-unit">
                        {offer.discountType === 0 ? "off" : "off each price"}
                      </span>
                    </div>

                    <div className="of-timeline">
                      <div className="of-timeline-meta">
                        <span>{formatDate(offer.startDate)}</span>
                        <span>{formatDate(offer.endDate)}</span>
                      </div>
                      <div className="of-progress">
                        <span style={{ width: `${status === "scheduled" ? 0 : progress(offer, now)}%` }} />
                      </div>
                      <span className="of-timeline-left">{timeLabel(offer, status, now)}</span>
                    </div>

                    <div className="of-prices">
                      {offer.appliedPrices && offer.appliedPrices.length > 0 ? (
                        offer.appliedPrices.map((p, idx) => {
                          const cur = currencyFor(p.country);
                          return (
                            <div key={p.id || idx} className="of-price">
                              <span className="of-price-country">
                                {cur?.flag && <span aria-hidden="true">{cur.flag}</span>}
                                {cur?.label || p.country}
                              </span>
                              <span className="of-price-values">
                                {p.originalPrice != null && p.originalPrice !== p.price && (
                                  <s>{priceFmt.format(p.originalPrice)}</s>
                                )}
                                <strong>{priceFmt.format(p.price ?? 0)}</strong>
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="of-muted">No prices configured for this product.</p>
                      )}
                    </div>

                    <footer className="of-card-foot">
                      {confirmDeleteId === offer.id ? (
                        <>
                          <span className="of-muted">Delete this offer?</span>
                          <div className="of-foot-actions">
                            <button className="btn-ghost of-btn-sm" onClick={() => setConfirmDeleteId(null)} disabled={busy}>Cancel</button>
                            <button className="btn-danger-ghost of-btn-sm of-btn-danger" onClick={() => handleDelete(offer.id!)} disabled={busy}>
                              {busy ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <button className="of-link-danger" onClick={() => setConfirmDeleteId(offer.id!)} disabled={busy}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---------- New offer modal ---------- */}
      {isModalOpen && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && setIsModalOpen(false)}>
          <div className="modal-container medium" role="dialog" aria-modal="true" aria-labelledby="of-modal-title">
            <div className="modal-header">
              <div>
                <h2 className="modal-title" id="of-modal-title">New Offer</h2>
                <p className="of-muted" style={{ margin: "0.25rem 0 0" }}>for {activeProductName}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="modal-body">
              {formError && (
                <div className="alert-error of-alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {formError}
                </div>
              )}

              <form id="of-form" onSubmit={handleCreate} className="of-form">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <span className="form-label">Discount type</span>
                  <div className="of-segment" role="radiogroup">
                    {[{ v: 0, label: "Percentage", hint: "e.g. 20% off" }, { v: 1, label: "Fixed amount", hint: "off each price" }].map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        role="radio"
                        aria-checked={form.discountType === o.v}
                        className={form.discountType === o.v ? "is-active" : ""}
                        onClick={() => setForm({ ...form, discountType: o.v as 0 | 1 })}
                      >
                        <strong>{o.label}</strong>
                        <small>{o.hint}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="of-value">Discount value</label>
                  <div className="of-input-affix">
                    <input
                      id="of-value"
                      required
                      type="number"
                      min="0.01"
                      max={form.discountType === 0 ? 100 : undefined}
                      step="0.01"
                      inputMode="decimal"
                      placeholder={form.discountType === 0 ? "20" : "100"}
                      className="form-input"
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      autoFocus
                    />
                    <span>{form.discountType === 0 ? "%" : "per currency"}</span>
                  </div>
                </div>

                <div className="of-form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="of-start">Starts</label>
                    <input id="of-start" required type="datetime-local" className="form-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="of-end">Ends</label>
                    <input id="of-end" required type="datetime-local" className="form-input" value={form.endDate} min={form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>

                <div className="of-presets">
                  <span className="of-muted">Duration:</span>
                  {DURATION_PRESETS.map((d) => (
                    <button key={d} type="button" className={`of-chip of-chip-sm ${formDays === d ? "is-active" : ""}`} onClick={() => applyPreset(d)}>
                      {d} days
                    </button>
                  ))}
                </div>

                <label className="of-check">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  <span>
                    <strong>Enable offer</strong>
                    <small>It goes live automatically on the start date. Turn off to save it as paused.</small>
                  </span>
                </label>

                {Number(form.discountValue) > 0 && formDays > 0 && (
                  <div className="of-summary">
                    <strong>{discountLabel({ discountType: form.discountType, discountValue: Number(form.discountValue) })} off</strong>
                    {" "}for {formDays} day{formDays !== 1 ? "s" : ""}, from {formatDate(new Date(form.startDate).toISOString())}
                  </div>
                )}
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</button>
              <button type="submit" form="of-form" className="btn-primary" disabled={saving}>
                {saving ? "Creating…" : "Create Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
