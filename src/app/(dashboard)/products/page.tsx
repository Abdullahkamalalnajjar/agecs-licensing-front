"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { getApiProducts, deleteApiProductsById, putApiProductsReorder, patchApiProductsByIdHidden } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PayablePriceDto, ProductDto } from "@/client/types.gen";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { useCatalog } from "@/lib/catalog";
import ProductFormModal from "@/components/ProductFormModal";
import ProductMediaModal from "@/components/ProductMediaModal";
import ChildProductsModal from "@/components/ChildProductsModal";
import ProductVersionsModal from "@/components/ProductVersionsModal";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { CURRENCIES, useCurrency, type SupportedCurrency } from "@/context/CurrencyContext";
import "@/components/product-form.css";
import "./products.css";

type SortKey = "order" | "name" | "price" | "newest";
type StatusFilter = "all" | "visible" | "hidden" | "soon";
type ViewMode = "table" | "grid";

const priceFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

/** Cheapest price across the product and its variations, in the selected currency (falls back to Intl, then anything). */
function startingPrice(product: ProductDto, currency: SupportedCurrency): PayablePriceDto | null {
  const all = [...(product.prices || []), ...(product.children || []).flatMap((c) => c.prices || [])]
    .filter((p) => p.active !== false && p.price != null);
  if (all.length === 0) return null;
  const inCurrency = all.filter((p) => p.country === currency);
  const pool = inCurrency.length ? inCurrency : all.filter((p) => p.country === "II").length ? all.filter((p) => p.country === "II") : all;
  return pool.reduce((min, p) => ((p.price ?? 0) < (min.price ?? 0) ? p : min));
}

function periodLabel(period?: number | null, type?: string | null) {
  const unit = (type || "Year").toLowerCase();
  const n = period || 1;
  return n === 1 ? `/ ${unit}` : `/ ${n} ${unit}s`;
}

const companyName = (p: ProductDto) => p.company || "—";
const coverUrl = (p: ProductDto) => {
  const media = [...(p.media || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return media[0]?.url ? resolveMediaUrl(media[0].url) : "";
};

const readViewMode = (): ViewMode => {
  try { return localStorage.getItem("products_view") === "grid" ? "grid" : "table"; } catch { return "table"; }
};

function ProductThumb({ product, size }: { product: ProductDto; size: "sm" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const url = coverUrl(product);
  return (
    <div className={`pr-thumb pr-thumb-${size}`}>
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={product.name || "Product"} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="pr-thumb-fallback" aria-hidden="true">
          {(product.name || "?").slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

const Icon = {
  view: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  variations: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  media: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
  versions: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M6 9v6" /><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M18 9c0 6-12 3-12 9" /></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
};

function IconButton({ title, onClick, tone = "accent", disabled, children }: {
  title: string; onClick: () => void; tone?: "accent" | "green" | "purple" | "amber" | "danger"; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} aria-label={title} className={`pr-icon-btn pr-tone-${tone}`} onClick={onClick} disabled={disabled}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </button>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const { currency, currentCurrencyMeta } = useCurrency();
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDto | null>(null);
  const [mediaProduct, setMediaProduct] = useState<ProductDto | null>(null);
  const [variationProduct, setVariationProduct] = useState<ProductDto | null>(null);
  const [versionsProduct, setVersionsProduct] = useState<ProductDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [company, setCompany] = useState<string>("all"); // "all" or a company id
  const [family, setFamily] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [view, setView] = useState<ViewMode>("table");
  const [reordering, setReordering] = useState(false);
  const [hiddenBusyId, setHiddenBusyId] = useState<string | null>(null);

  // Read after mount so server and client render the same markup first
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setView(readViewMode()); }, []);

  const isAdmin = user != null && user.role !== "Student" && user.role !== "NormalUser";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      client.setConfig({
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003",
        ...(token ? { auth: token } : {}),
      });

      const response = await getApiProducts({ query: { includeHidden: isAdmin }, throwOnError: false });
      if (response.data?.isSuccess) {
        setProducts(response.data.value || []);
      } else {
        setError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to load products.");
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const changeView = (v: ViewMode) => {
    setView(v);
    try { localStorage.setItem("products_view", v); } catch { /* storage unavailable */ }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await deleteApiProductsById({ path: { id }, throwOnError: false });
      if (response.data?.isSuccess) {
        setProducts((prev) => prev
          .filter((p) => p.id !== id)
          .map((p) => (p.children?.some((c) => c.id === id) ? { ...p, children: p.children.filter((c) => c.id !== id) } : p)));
        success("Product deleted.");
      } else {
        toastError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to delete product.");
      }
    } catch {
      toastError("Failed to delete product.");
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const rootProducts = useMemo(() => products.filter((p) => !p.parentProductId), [products]);

  const families = useMemo(
    () => Array.from(new Set(rootProducts.map((p) => p.family).filter((f): f is string => !!f))).sort(),
    [rootProducts]
  );

  const { companies: allCompanies } = useCatalog();
  // Only companies that have products are worth a filter chip.
  const companies = useMemo(
    () => allCompanies.filter((c) => rootProducts.some((p) => p.companyId === c.id)),
    [allCompanies, rootProducts]
  );

  const stats = useMemo(() => ({
    total: rootProducts.length,
    visible: rootProducts.filter((p) => !p.hidden).length,
    hidden: rootProducts.filter((p) => p.hidden).length,
    soon: rootProducts.filter((p) => p.comingSoon).length,
    variations: rootProducts.reduce((n, p) => n + (p.children?.length || 0), 0),
  }), [rootProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rootProducts.filter((p) => {
      if (company !== "all" && p.companyId !== company) return false;
      if (family !== "all" && p.family !== family) return false;
      if (status === "visible" && p.hidden) return false;
      if (status === "hidden" && !p.hidden) return false;
      if (status === "soon" && !p.comingSoon) return false;
      if (!q) return true;
      return [p.name, p.fullName, p.family, p.miniDescription, ...(p.children || []).map((c) => c.name)]
        .some((s) => s?.toLowerCase().includes(q));
    });

    const price = (p: ProductDto) => startingPrice(p, currency)?.price ?? p.startingPrice ?? Infinity;
    return list.sort((a, b) => {
      switch (sort) {
        case "name": return (a.name || "").localeCompare(b.name || "");
        case "price": return price(a) - price(b);
        case "newest": return new Date(b.createdAtUtc || 0).getTime() - new Date(a.createdAtUtc || 0).getTime();
        default: return (a.order ?? 0) - (b.order ?? 0);
      }
    });
  }, [rootProducts, search, company, family, status, sort, currency]);

  // Table rows: each variation gets its own row; products without variations keep theirs.
  const tableRows = useMemo(
    () => filtered.flatMap((parent, parentIndex) => {
      const children = [...(parent.children || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (children.length === 0) return [{ row: parent, parent: null as ProductDto | null, parentIndex, first: true }];
      return children.map((child, i) => ({ row: child, parent: parent as ProductDto | null, parentIndex, first: i === 0 }));
    }),
    [filtered]
  );

  const hasFilters = !!search || company !== "all" || family !== "all" || status !== "all";
  // Reordering needs the full, unfiltered list in display order, since the API reorders all top-level products at once.
  const canReorder = !hasFilters && sort === "order";

  // Moves a product one step, saving the whole new order; rolls back if the save fails.
  // Flips a product's visibility right away, rolling back if the save fails.
  const handleToggleHidden = async (product: ProductDto) => {
    if (!product.id) return;
    const hidden = !product.hidden;
    const setHidden = (value: boolean) => (p: ProductDto): ProductDto =>
      p.id === product.id ? { ...p, hidden: value } : { ...p, children: p.children?.map(setHidden(value)) };
    setProducts((prev) => prev.map(setHidden(hidden)));
    try {
      setHiddenBusyId(product.id);
      const res = await patchApiProductsByIdHidden({ path: { id: product.id }, body: { hidden }, throwOnError: false });
      if (res.error || res.data?.isError) {
        setProducts((prev) => prev.map(setHidden(!hidden)));
        toastError(res.data?.errors?.map((e) => e.description).join(", ") || "Failed to update visibility.");
        return;
      }
      success(hidden ? `${product.name} is now hidden.` : `${product.name} is now visible.`);
    } catch (err) {
      setProducts((prev) => prev.map(setHidden(!hidden)));
      toastError((err instanceof Error && err.message) || "Error updating visibility.");
    } finally {
      setHiddenBusyId(null);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (!canReorder || target < 0 || target >= filtered.length) return;

    const next = [...filtered];
    [next[index], next[target]] = [next[target], next[index]];
    const newOrder = new Map(next.map((p, i) => [p.id, i]));

    const previous = products;
    setProducts((prev) => prev.map((p) => (newOrder.has(p.id) ? { ...p, order: newOrder.get(p.id) } : p)));

    try {
      setReordering(true);
      const res = await putApiProductsReorder({
        body: { parentProductId: null, productIds: next.map((p) => p.id!).filter(Boolean) },
        throwOnError: false,
      });
      if (res.error || res.data?.isError) {
        setProducts(previous);
        toastError(res.data?.errors?.map((e) => e.description).join(", ") || "Failed to save the new order.");
      }
    } catch (err) {
      setProducts(previous);
      toastError((err instanceof Error && err.message) || "Error saving the new order.");
    } finally {
      setReordering(false);
    }
  };

  const clearFilters = () => { setSearch(""); setCompany("all"); setFamily("all"); setStatus("all"); };

  // Format in the price's own currency — the starting price may fall back to another country's price.
  const formatMoney = (n: number, country?: string | null) => {
    const symbol = CURRENCIES.find((c) => c.code === country)?.symbol ?? currentCurrencyMeta.symbol;
    return symbol === "$" ? `$${priceFmt.format(n)}` : `${priceFmt.format(n)} ${symbol}`;
  };

  const renderPrice = (product: ProductDto, compact = false) => {
    const p = startingPrice(product, currency);
    if (!p) {
      if (product.startingPrice == null) return <span className="pr-muted">No pricing</span>;
      return (
        <span className="pr-price">
          <strong>${priceFmt.format(product.startingPrice)}</strong>
          <small>{periodLabel(product.startingPeriod, product.startingPeriodType)}</small>
        </span>
      );
    }
    const onSale = p.originalPrice != null && p.originalPrice > (p.price ?? 0);
    return (
      <span className={`pr-price ${compact ? "is-compact" : ""}`}>
        {onSale && <s>{formatMoney(p.originalPrice!, p.country)}</s>}
        <strong>{formatMoney(p.price ?? 0, p.country)}</strong>
        <small>{periodLabel(p.period, p.periodType)}</small>
      </span>
    );
  };

  const saleBadge = (product: ProductDto) => {
    const p = startingPrice(product, currency);
    if (!p || p.originalPrice == null || p.originalPrice <= (p.price ?? 0)) return null;
    const pct = Math.round((1 - (p.price ?? 0) / p.originalPrice) * 100);
    return <span className="pr-badge pr-badge-sale">−{pct}%</span>;
  };

  // On a variation's row, "Variations" manages its parent's variations (add a new one, etc.).
  const renderAdminActions = (product: ProductDto, parent?: ProductDto | null) => (
    <div className="pr-actions">
      <IconButton title="View details" onClick={() => router.push(`/products/${product.id}`)}>{Icon.view}</IconButton>
      <IconButton
        title={parent ? `Variations of ${parent.name}` : "Variations"}
        tone="green"
        onClick={() => setVariationProduct(parent ?? product)}
      >
        {Icon.variations}
      </IconButton>
      <IconButton title="Media" tone="purple" onClick={() => setMediaProduct(product)}>{Icon.media}</IconButton>
      <IconButton title="Versions" tone="amber" onClick={() => setVersionsProduct(product)}>{Icon.versions}</IconButton>
      <IconButton title="Edit product" onClick={() => setEditProduct(product)}>{Icon.edit}</IconButton>
      {deleteConfirmId === product.id ? (
        <span className="pr-confirm">
          <IconButton title="Confirm delete" tone="danger" onClick={() => handleDelete(product.id!)} disabled={deletingId === product.id}>{Icon.check}</IconButton>
          <IconButton title="Cancel" onClick={() => setDeleteConfirmId(null)}>{Icon.close}</IconButton>
        </span>
      ) : (
        <IconButton title="Delete product" tone="danger" onClick={() => setDeleteConfirmId(product.id!)}>{Icon.trash}</IconButton>
      )}
    </div>
  );

  const showTable = isAdmin && view === "table";

  return (
    <div className="pr-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isAdmin ? "Products" : "Software catalog"}</h1>
          <p className="page-subtitle">
            {loading
              ? "Loading…"
              : isAdmin
                ? `${stats.total} product${stats.total !== 1 ? "s" : ""} · ${stats.variations} variation${stats.variations !== 1 ? "s" : ""}`
                : "Engineering software licenses for structural design, CAD and documentation."}
          </p>
        </div>
        {isAdmin && (
          <button id="create-product-btn" className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Product
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error pr-alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ flex: 1 }}>{error}</span>
          <button className="btn-ghost pr-btn-sm" onClick={fetchProducts}>Retry</button>
        </div>
      )}

      {/* ---------- Admin stats ---------- */}
      {isAdmin && !loading && stats.total > 0 && (
        <div className="pr-stats">
          {([
            ["all", "Total", stats.total],
            ["visible", "Visible", stats.visible],
            ["hidden", "Hidden", stats.hidden],
            ["soon", "Coming soon", stats.soon],
          ] as [StatusFilter, string, number][]).map(([key, label, value]) => (
            <button
              key={key}
              type="button"
              className={`pr-stat pr-stat-${key} ${status === key ? "is-active" : ""}`}
              onClick={() => setStatus(key)}
              aria-pressed={status === key}
            >
              <span className="pr-stat-label">{label}</span>
              <span className="pr-stat-value">{value}</span>
            </button>
          ))}
        </div>
      )}

      {/* ---------- Toolbar ---------- */}
      {(loading || rootProducts.length > 0) && (
        <div className="pr-toolbar">
          <label className="pr-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder={isAdmin ? "Search products, families, variations…" : "Search software…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </label>

          {companies.length > 1 && (
            <div className="pr-segment" role="group" aria-label="Company">
              {[{ id: "all", name: "All" }, ...companies].map((c) => (
                <button key={c.id} type="button" className={company === c.id ? "is-active" : ""} onClick={() => setCompany(c.id!)} aria-pressed={company === c.id}>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {families.length > 1 && (
            <select className="form-input pr-select" value={family} onChange={(e) => setFamily(e.target.value)} aria-label="Family">
              <option value="all">All families</option>
              {families.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          )}

          <select className="form-input pr-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort by">
            <option value="order">Featured</option>
            <option value="name">Name A–Z</option>
            <option value="price">Lowest price</option>
            <option value="newest">Newest</option>
          </select>

          {isAdmin && (
            <div className="pr-segment pr-view-toggle" role="group" aria-label="View">
              <button type="button" className={view === "table" ? "is-active" : ""} onClick={() => changeView("table")} aria-pressed={view === "table"} title="Table view">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              </button>
              <button type="button" className={view === "grid" ? "is-active" : ""} onClick={() => changeView("grid")} aria-pressed={view === "grid"} title="Grid view">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{Icon.variations}</svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------- Content ---------- */}
      {loading ? (
        showTable ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ width: 56 }}><div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10 }} /></td>
                    <td><div className="skeleton" style={{ height: 14, width: "45%" }} /><div className="skeleton" style={{ height: 10, width: "70%", marginTop: 8 }} /></td>
                    <td><div className="skeleton" style={{ height: 14, width: 80 }} /></td>
                    <td><div className="skeleton" style={{ height: 14, width: 90 }} /></td>
                    <td><div className="skeleton" style={{ height: 22, width: 70, borderRadius: 99 }} /></td>
                    <td><div className="skeleton" style={{ height: 30, width: 190 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pr-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="pr-card">
                <div className="skeleton" style={{ aspectRatio: "16 / 10", borderRadius: 0 }} />
                <div className="pr-card-body">
                  <div className="skeleton" style={{ height: 18, width: "60%" }} />
                  <div className="skeleton" style={{ height: 12, width: "40%" }} />
                  <div className="skeleton" style={{ height: 32, width: "80%", marginTop: 12 }} />
                </div>
              </div>
            ))}
          </div>
        )
      ) : rootProducts.length === 0 ? (
        <div className="pr-panel">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <p className="empty-state-title">No products yet</p>
            <p className="empty-state-sub">{isAdmin ? "Create your first product to get started." : "Check back soon for new software."}</p>
            {isAdmin && <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={() => setIsCreateModalOpen(true)}>New Product</button>}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pr-panel">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="empty-state-title">No matching products</p>
            <p className="empty-state-sub">Try a different search or clear the filters.</p>
            {hasFilters && <button className="btn-ghost" style={{ marginTop: "1rem" }} onClick={clearFilters}>Clear filters</button>}
          </div>
        </div>
      ) : showTable ? (
        <div className="data-table-wrapper">
          <table className="data-table pr-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }} title={canReorder ? undefined : "Clear filters and sort by Featured to reorder"}>Order</th>
                <th>Product</th>
                <th>Family</th>
                <th>Version</th>
                <th>Starting price</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(({ row: product, parent, parentIndex, first }, index) => (
                <tr key={product.id} className={product.hidden ? "is-hidden" : ""}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", minWidth: "1.25rem" }}>
                        {index + 1}
                      </span>
                      {/* Reordering moves the whole top-level product, so the arrows sit on its first row only. */}
                      {first && (
                        <div
                          style={{ display: "flex", flexDirection: "column", gap: "2px" }}
                          title={canReorder ? undefined : "Clear filters and sort by Featured to reorder"}
                        >
                          <button
                            type="button"
                            className="btn-ghost"
                            style={{ padding: "0 6px", minHeight: "20px", lineHeight: 1, fontSize: "0.7rem" }}
                            onClick={() => handleMove(parentIndex, -1)}
                            disabled={!canReorder || reordering || parentIndex === 0}
                            aria-label={`Move ${(parent ?? product).name} up`}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            style={{ padding: "0 6px", minHeight: "20px", lineHeight: 1, fontSize: "0.7rem" }}
                            onClick={() => handleMove(parentIndex, 1)}
                            disabled={!canReorder || reordering || parentIndex === filtered.length - 1}
                            aria-label={`Move ${(parent ?? product).name} down`}
                          >
                            ▼
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <Link href={`/products/${product.id}`} className="pr-row-product">
                      <ProductThumb product={product} size="sm" />
                      <span className="pr-row-text">
                        <span className="pr-row-name">{product.name || "—"}</span>
                        <span className="pr-row-sub">
                          {parent ? `${parent.name || "—"} · ` : ""}{companyName(product)}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="pr-muted-cell">{product.family || "—"}</td>
                  <td>{product.version ? <span className="pr-version">v{product.version}</span> : <span className="pr-muted">—</span>}</td>
                  <td>{renderPrice(product, true)}</td>
                  <td>
                    <div className="pr-badges">
                      <label
                        className="pr-visibility"
                        title={product.hidden ? "Hidden from customers — click to show" : "Visible to customers — click to hide"}
                        style={{ cursor: hiddenBusyId === product.id ? "wait" : "pointer", opacity: hiddenBusyId === product.id ? 0.6 : 1 }}
                      >
                        <span className="pf-toggle-switch">
                          <input
                            type="checkbox"
                            checked={!product.hidden}
                            disabled={hiddenBusyId === product.id}
                            onChange={() => handleToggleHidden(product)}
                            aria-label={`${product.name} visible`}
                          />
                          <span className="pf-toggle-track" />
                        </span>
                        <span className={product.hidden ? "pr-muted" : ""}>{product.hidden ? "Hidden" : "Visible"}</span>
                      </label>
                      {product.comingSoon && <span className="pr-badge pr-badge-soon">Soon</span>}
                      {saleBadge(product)}
                    </div>
                  </td>
                  <td className="pr-muted-cell pr-nowrap">
                    {product.createdAtUtc ? new Date(product.createdAtUtc).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td>{renderAdminActions(product, parent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="pr-grid">
          {filtered.map((product) => {
            const editions = product.children?.length || 0;
            return (
              <article key={product.id} className={`pr-card ${product.hidden ? "is-hidden" : ""}`}>
                <Link href={`/products/${product.id}`} className="pr-card-link" aria-label={`View ${product.name}`}>
                  <div className="pr-card-media">
                    <ProductThumb product={product} size="lg" />
                    <div className="pr-card-flags">
                      {product.comingSoon && <span className="pr-badge pr-badge-soon">Coming soon</span>}
                      {saleBadge(product)}
                      {isAdmin && product.hidden && <span className="pr-badge pr-badge-hidden"><span className="pr-dot" />Hidden</span>}
                    </div>
                  </div>

                  <div className="pr-card-body">
                    <div className="pr-card-meta">
                      <span>{companyName(product)}</span>
                      {product.family && <><span aria-hidden="true">·</span><span>{product.family}</span></>}
                      {product.version && <span className="pr-version">v{product.version}</span>}
                    </div>
                    <h3 className="pr-card-title">{product.name}</h3>
                    {product.miniDescription && <p className="pr-card-desc">{product.miniDescription}</p>}

                    <div className="pr-card-foot">
                      <div className="pr-card-price">
                        <span className="pr-muted">{editions > 0 ? "From" : "Price"}</span>
                        {renderPrice(product)}
                      </div>
                      <span className="pr-card-cta" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                      </span>
                    </div>
                    {editions > 0 && (
                      <span className="pr-card-editions">{editions} edition{editions !== 1 ? "s" : ""} available</span>
                    )}
                  </div>
                </Link>
                {isAdmin && <div className="pr-card-admin">{renderAdminActions(product)}</div>}
              </article>
            );
          })}
        </div>
      )}

      {!loading && hasFilters && filtered.length > 0 && (
        <p className="pr-result-count">
          Showing {filtered.length} of {rootProducts.length} · <button type="button" onClick={clearFilters}>Clear filters</button>
        </p>
      )}

      {isCreateModalOpen && (
        <ProductFormModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => { setIsCreateModalOpen(false); fetchProducts(); }}
        />
      )}

      {editProduct && (
        <ProductFormModal
          initialData={editProduct}
          onClose={() => setEditProduct(null)}
          onSuccess={() => { setEditProduct(null); fetchProducts(); }}
        />
      )}

      {variationProduct && (
        <ChildProductsModal
          product={variationProduct}
          onClose={() => setVariationProduct(null)}
          onSuccess={() => { setVariationProduct(null); fetchProducts(); }}
          onOpenFeatures={() => {}}
        />
      )}

      {mediaProduct && (
        <ProductMediaModal
          product={mediaProduct}
          onClose={() => setMediaProduct(null)}
          onSuccess={() => { setMediaProduct(null); fetchProducts(); }}
        />
      )}

      {versionsProduct && (
        <ProductVersionsModal
          product={versionsProduct}
          onClose={() => setVersionsProduct(null)}
          onSuccess={() => { setVersionsProduct(null); fetchProducts(); }}
        />
      )}
    </div>
  );
}
