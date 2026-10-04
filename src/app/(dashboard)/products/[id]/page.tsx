"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { getApiProductsById, deleteApiProductsById, getApiProductsByIdVersions, postApiV1CartsMyCartItems } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ProductFormModal from "@/components/ProductFormModal";
import ProductMediaModal from "@/components/ProductMediaModal";
import ChildProductsModal from "@/components/ChildProductsModal";
import ProductFeaturesModal from "@/components/ProductFeaturesModal";
import ProductVersionsModal from "@/components/ProductVersionsModal";
import type { PayablePriceDto, ProductDto, ProductVersionDto } from "@/client/types.gen";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { useAuth } from "@/components/AuthProvider";
import { useCurrency, type SupportedCurrency } from "@/context/CurrencyContext";
import { useToast } from "@/components/ToastProvider";
import "../products.css";
import "./product-detail.css";

const priceFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const dateFmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

/** Active prices in the selected currency, falling back to Intl, then anything. */
function pricesFor(product: ProductDto | undefined, currency: SupportedCurrency): PayablePriceDto[] {
  const all = (product?.prices || []).filter((p) => p.active !== false && p.price != null);
  const inCurrency = all.filter((p) => p.country === currency);
  if (inCurrency.length) return inCurrency;
  const intl = all.filter((p) => p.country === "II");
  return intl.length ? intl : all;
}

const cheapest = (prices: PayablePriceDto[]) =>
  prices.length ? prices.reduce((min, p) => ((p.price ?? 0) < (min.price ?? 0) ? p : min)) : null;

function periodText(period?: number | null, type?: string | null) {
  const unit = (type || "Year").toLowerCase();
  const n = period || 1;
  return n === 1 ? `1 ${unit}` : `${n} ${unit}s`;
}

function formatBytes(bytes?: number) {
  if (!bytes) return null;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${priceFmt.format(bytes / 1024 ** i)} ${units[i]}`;
}

const Svg = ({ size = 16, children }: { size?: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const Icon = {
  back: <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
  cart: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  text: <><line x1="21" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="15" y1="18" x2="3" y2="18" /></>,
  notes: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  features: <><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  variations: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  media: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
  versions: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M6 9v6" /><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M18 9c0 6-12 3-12 9" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
};

function Gallery({ product }: { product: ProductDto }) {
  const media = useMemo(
    () => [...(product.media || [])].filter((m) => m.url).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [product.media]
  );
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const current = media[Math.min(active, media.length - 1)];

  return (
    <div className="pd-gallery">
      <div className="pd-gallery-main pr-thumb">
        {current && !failed[current.url!] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveMediaUrl(current.url!)} alt={product.name || "Product"} onError={() => setFailed((f) => ({ ...f, [current.url!]: true }))} />
        ) : (
          <span className="pr-thumb-fallback pd-gallery-fallback" aria-hidden="true">
            {(product.name || "?").slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      {media.length > 1 && (
        <div className="pd-gallery-strip" role="tablist" aria-label="Product images">
          {media.map((m, i) => (
            <button
              key={m.id || i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Image ${i + 1}`}
              className={`pd-gallery-thumb ${i === active ? "is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveMediaUrl(m.url!)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const productId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const { currency, currentCurrencyMeta } = useCurrency();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [activeVersions, setActiveVersions] = useState<ProductVersionDto[]>([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isChildrenModalOpen, setIsChildrenModalOpen] = useState(false);
  const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);

  const isAdmin = user != null && user.role !== "Student" && user.role !== "NormalUser";

  const editions = product?.children || [];
  const target = (selectedEditionId && editions.find((c) => c.id === selectedEditionId)) || product || undefined;
  const prices = useMemo(
    () => [...pricesFor(target, currency)].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)),
    [target, currency]
  );
  const currentPrice = prices.find((p) => p.id === selectedPriceId) || prices[0] || null;
  const features = (target?.features?.length ? target.features : product?.features) || [];
  const latestVersion = activeVersions[0];

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      client.setConfig({
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003",
        ...(token ? { auth: token } : {}),
      });

      const response = await getApiProductsById({ path: { id: productId }, throwOnError: false });
      if (response.data?.isSuccess) {
        const loaded = response.data.value || null;
        setProduct(loaded);
        // Keep the chosen edition across refreshes if it still exists
        setSelectedEditionId((prev) =>
          loaded?.children?.some((c) => c.id === prev) ? prev : loaded?.children?.[0]?.id || null
        );
        try {
          const versionsResp = await getApiProductsByIdVersions({ path: { id: productId }, query: { onlyActive: true }, throwOnError: false });
          if (versionsResp.data?.isSuccess) setActiveVersions(versionsResp.data.value || []);
        } catch (e) {
          console.error("Failed to fetch versions", e);
        }
      } else if (response.error || response.data?.isError) {
        setError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to load product.");
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteApiProductsById({ path: { id: productId! }, throwOnError: false });
      if (response.data?.isSuccess) {
        success("Product deleted.");
        router.push("/products");
      } else {
        toastError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to delete.");
      }
    } catch (err) {
      toastError((err instanceof Error && err.message) || "Error deleting product.");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleModalSuccess = () => {
    fetchProduct();
    setIsFormModalOpen(false);
    setIsMediaModalOpen(false);
    setIsChildrenModalOpen(false);
    setIsFeaturesModalOpen(false);
    setIsVersionsModalOpen(false);
  };

  const handleDownload = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!latestVersion?.id) return;
    const baseUrl = client.getConfig().baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004";
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    window.open(`${cleanBaseUrl}/api/products/${productId}/versions/${latestVersion.id}/download`, "_blank");
  };

  const handleAddToCart = async () => {
    if (!productId) return;
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      setIsAddingToCart(true);
      const res = await postApiV1CartsMyCartItems({
        body: {
          itemType: "Product",
          itemId: (selectedEditionId || productId) as string,
          quantity: 1,
          period: currentPrice?.period || 12,
        },
        throwOnError: false,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = res.data as any;
      if (res.error || data?.isError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toastError(data?.errors?.map((e: any) => e.description).join(", ") || "Failed to add to cart");
      } else {
        success("Added to cart successfully!");
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (e) {
      toastError("Error adding to cart: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatMoney = (n: number) =>
    currentCurrencyMeta.symbol === "$" ? `$${priceFmt.format(n)}` : `${priceFmt.format(n)} ${currentCurrencyMeta.symbol}`;

  if (loading) {
    return (
      <div className="pr-page pd-page">
        <div className="skeleton" style={{ height: 14, width: 160, marginBottom: "1.25rem" }} />
        <div className="pd-hero">
          <div className="skeleton" style={{ aspectRatio: "1 / 1", borderRadius: "var(--radius-lg)" }} />
          <div className="pd-info">
            <div className="skeleton" style={{ height: 12, width: "30%" }} />
            <div className="skeleton" style={{ height: 32, width: "65%" }} />
            <div className="skeleton" style={{ height: 14, width: "85%" }} />
            <div className="skeleton" style={{ height: 70, width: "100%", marginTop: "1rem" }} />
            <div className="skeleton" style={{ height: 44, width: "50%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pr-page pd-page">
        <div className="pr-panel">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{Icon.info}</svg>
            <p className="empty-state-title">{error ? "Couldn't load this product" : "Product not found"}</p>
            {error && <p className="empty-state-sub">{error}</p>}
            <Link href="/products" className="btn-primary" style={{ marginTop: "1rem" }}>Back to products</Link>
          </div>
        </div>
      </div>
    );
  }

  const company = product.company || "—";
  const onSale = currentPrice?.originalPrice != null && currentPrice.originalPrice > (currentPrice.price ?? 0);
  const salePct = onSale ? Math.round((1 - (currentPrice!.price ?? 0) / currentPrice!.originalPrice!) * 100) : 0;
  const canBuy = !isAdmin && !product.comingSoon && !!currentPrice;

  return (
    <div className="pr-page pd-page">
      <nav className="pd-crumbs" aria-label="Breadcrumb">
        <Link href="/products" className="pd-back">
          <Svg size={15}>{Icon.back}</Svg>
          {isAdmin ? "Products" : "Software catalog"}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="pd-crumb-current">{product.name}</span>
      </nav>

      {/* ---------- Hero ---------- */}
      <section className="pd-hero">
        <Gallery product={product} />

        <div className="pd-info">
          <div className="pr-card-meta">
            <span>{company}</span>
            {product.family && <><span aria-hidden="true">·</span><span>{product.family}</span></>}
          </div>

          <h1 className="pd-title">{product.name}</h1>
          {product.fullName && product.fullName !== product.name && <p className="pd-fullname">{product.fullName}</p>}

          <div className="pr-badges">
            {product.version && <span className="pr-version">v{product.version}</span>}
            {product.comingSoon && <span className="pr-badge pr-badge-soon">Coming soon</span>}
            {isAdmin && (
              <span className={`pr-badge ${product.hidden ? "pr-badge-hidden" : "pr-badge-visible"}`}>
                <span className="pr-dot" />{product.hidden ? "Hidden" : "Visible"}
              </span>
            )}
            {onSale && <span className="pr-badge pr-badge-sale">−{salePct}%</span>}
          </div>

          {product.miniDescription && <p className="pd-lead">{product.miniDescription}</p>}

          {/* Editions */}
          {editions.length > 0 && (
            <div className="pd-field">
              <span className="pd-label">Edition</span>
              <div className="pd-editions" role="radiogroup" aria-label="Edition">
                {editions.map((child) => {
                  const from = cheapest(pricesFor(child, currency));
                  const isSelected = child.id === selectedEditionId;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`pd-edition ${isSelected ? "is-active" : ""}`}
                      onClick={() => { setSelectedEditionId(child.id!); setSelectedPriceId(null); }}
                    >
                      <span className="pd-edition-radio" aria-hidden="true" />
                      <span className="pd-edition-name">{child.name}</span>
                      <span className="pd-edition-price">{from ? `from ${formatMoney(from.price ?? 0)}` : "No pricing"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Billing period */}
          {prices.length > 1 && (
            <div className="pd-field">
              <span className="pd-label">License period</span>
              <div className="pr-segment pd-periods" role="radiogroup" aria-label="License period">
                {prices.map((p, i) => (
                  <button
                    key={p.id || i}
                    type="button"
                    role="radio"
                    aria-checked={p === currentPrice}
                    className={p === currentPrice ? "is-active" : ""}
                    onClick={() => setSelectedPriceId(p.id || null)}
                  >
                    {periodText(p.period, p.periodType)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price + actions */}
          <div className="pd-buy">
            <div className="pd-price">
              {currentPrice ? (
                <>
                  <span className="pd-price-row">
                    <strong>{formatMoney(currentPrice.price ?? 0)}</strong>
                    {onSale && <s>{formatMoney(currentPrice.originalPrice!)}</s>}
                  </span>
                  <small>
                    for {periodText(currentPrice.period, currentPrice.periodType)}
                    {product.withTaxes === false ? " · excl. taxes" : product.withTaxes ? " · incl. taxes" : ""}
                  </small>
                </>
              ) : (
                <span className="pr-muted">{product.comingSoon ? "Pricing announced at launch" : "Pricing not available"}</span>
              )}
            </div>

            <div className="pd-actions">
              {isAdmin ? (
                <>
                  <button type="button" className="btn-primary" onClick={() => setIsFormModalOpen(true)}>
                    <Svg size={15}>{Icon.edit}</Svg>Edit product
                  </button>
                  {confirmDelete ? (
                    <span className="pd-confirm">
                      <span className="pr-muted">Delete this product?</span>
                      <button type="button" className="pd-btn pd-btn-danger" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting…" : "Delete"}
                      </button>
                      <button type="button" className="pd-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
                    </span>
                  ) : (
                    <button type="button" className="pd-btn pd-btn-danger-ghost" onClick={() => setConfirmDelete(true)}>
                      <Svg size={15}>{Icon.trash}</Svg>Delete
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button type="button" className="btn-primary pd-btn-lg" onClick={handleAddToCart} disabled={!canBuy || isAddingToCart}>
                    <Svg>{Icon.cart}</Svg>
                    {isAddingToCart ? "Adding…" : product.comingSoon ? "Coming soon" : "Add to cart"}
                  </button>
                  {latestVersion && (
                    <button type="button" className="pd-btn pd-btn-lg" onClick={handleDownload}>
                      <Svg>{Icon.download}</Svg>Download
                    </button>
                  )}
                </>
              )}
            </div>
            {!isAdmin && latestVersion && (
              <p className="pd-buy-note">
                Latest release v{latestVersion.versionNumber}
                {formatBytes(latestVersion.fileSizeBytes) && ` · ${formatBytes(latestVersion.fileSizeBytes)}`}
                {!user && " · sign in to download"}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Admin management ---------- */}
      {isAdmin && (
        <section className="pd-manage" aria-label="Manage product">
          {[
            { label: "Variations", count: editions.length, tone: "green", icon: Icon.variations, onClick: () => setIsChildrenModalOpen(true) },
            { label: "Media", count: product.media?.length || 0, tone: "purple", icon: Icon.media, onClick: () => setIsMediaModalOpen(true) },
            { label: "Features", count: product.features?.length || 0, tone: "accent", icon: Icon.features, onClick: () => setIsFeaturesModalOpen(true) },
            { label: "Active versions", count: activeVersions.length, tone: "amber", icon: Icon.versions, onClick: () => setIsVersionsModalOpen(true) },
          ].map((item) => (
            <button key={item.label} type="button" className={`pd-manage-tile pr-tone-${item.tone}`} onClick={item.onClick}>
              <span className="pd-manage-icon"><Svg size={18}>{item.icon}</Svg></span>
              <span className="pd-manage-text">
                <span className="pd-manage-count">{item.count}</span>
                <span className="pd-manage-label">{item.label}</span>
              </span>
              <span className="pd-manage-go" aria-hidden="true">Manage →</span>
            </button>
          ))}
        </section>
      )}

      {/* ---------- Content ---------- */}
      <div className="pd-content">
        <div className="pd-main">
          <section className="pd-card">
            <h2 className="pd-card-title"><Svg>{Icon.text}</Svg>Overview</h2>
            {product.description
              ? <p className="pd-prose">{product.description}</p>
              : <p className="pr-muted">No description provided.</p>}
          </section>

          {latestVersion?.releaseNotes && (
            <section className="pd-card">
              <h2 className="pd-card-title">
                <Svg>{Icon.notes}</Svg>What&apos;s new in v{latestVersion.versionNumber}
                <span className="pd-card-aside">{dateFmt(latestVersion.createdAtUtc)}</span>
              </h2>
              <p className="pd-prose">{latestVersion.releaseNotes}</p>
            </section>
          )}
        </div>

        <aside className="pd-side">
          <section className="pd-card">
            <h2 className="pd-card-title"><Svg>{Icon.info}</Svg>Details</h2>
            <dl className="pd-specs">
              <div><dt>Publisher</dt><dd>{company}</dd></div>
              {product.family && <div><dt>Family</dt><dd>{product.family}</dd></div>}
              <div><dt>Version</dt><dd>{latestVersion?.versionNumber || product.version || "—"}</dd></div>
              {editions.length > 0 && <div><dt>Editions</dt><dd>{editions.length}</dd></div>}
              {formatBytes(latestVersion?.fileSizeBytes) && <div><dt>Download size</dt><dd>{formatBytes(latestVersion?.fileSizeBytes)}</dd></div>}
              {isAdmin && <div><dt>Created</dt><dd>{dateFmt(product.createdAtUtc)}</dd></div>}
              {isAdmin && product.lastModifiedUtc && <div><dt>Last updated</dt><dd>{dateFmt(product.lastModifiedUtc)}</dd></div>}
            </dl>
          </section>

          {features.length > 0 && (
            <section className="pd-card">
              <h2 className="pd-card-title">
                <Svg>{Icon.features}</Svg>Included features
                <span className="pd-card-aside">{features.length}</span>
              </h2>
              <ul className="pd-features">
                {features.map((f, i) => (
                  <li key={f.id || i}>
                    <span className="pd-feature-check"><Svg size={12}>{Icon.check}</Svg></span>
                    {f.featureName || "Unnamed feature"}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {isFormModalOpen && (
        <ProductFormModal initialData={product} onClose={() => setIsFormModalOpen(false)} onSuccess={handleModalSuccess} />
      )}
      {isMediaModalOpen && (
        <ProductMediaModal product={product} onClose={() => setIsMediaModalOpen(false)} onSuccess={handleModalSuccess} />
      )}
      {isChildrenModalOpen && (
        <ChildProductsModal product={product} onClose={() => setIsChildrenModalOpen(false)} onSuccess={handleModalSuccess} onOpenFeatures={() => { setIsChildrenModalOpen(false); setIsFeaturesModalOpen(true); }} />
      )}
      {isFeaturesModalOpen && (
        <ProductFeaturesModal product={product} onClose={() => setIsFeaturesModalOpen(false)} onSuccess={handleModalSuccess} />
      )}
      {isVersionsModalOpen && (
        <ProductVersionsModal product={product} onClose={() => setIsVersionsModalOpen(false)} onSuccess={handleModalSuccess} />
      )}
    </div>
  );
}
