"use client";

import { useState, useEffect } from "react";
import { postApiPackages, putApiPackagesById, getApiProducts } from "@/client";
import type { PackageDto, PeriodType, ProductDto } from "@/client/types.gen";
import { usePermissions } from "@/components/AuthProvider";

type PackageFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pkg: PackageDto | null; // null for Create mode
};

interface ItemRow {
  key: string;
  topLevelProductId: string;
  variationProductId: string;
  /** "1|Year": one of the variation's price periods, or "" until picked. */
  period: string;
}

const emptyRow = (): ItemRow => ({
  key: Math.random().toString(36).slice(2),
  topLevelProductId: "",
  variationProductId: "",
  period: "",
});

const DAYS: Record<PeriodType, number> = { Day: 1, Month: 30, Year: 365 };
const periodKey = (value: number, type: PeriodType) => `${value}|${type}`;
const periodLabel = (value: number, type: PeriodType) => `${value} ${type}${value === 1 ? "" : "s"}`;

export default function PackageFormModal({ isOpen, onClose, onSuccess, pkg }: PackageFormModalProps) {
  const { canField } = usePermissions();
  // Edit mode only: fields the user can't change are disabled (the API rejects changing them).
  const locked = (field: string) => !!pkg && !canField("packages", field);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ProductDto[]>([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [hidden, setHidden] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [withTaxes, setWithTaxes] = useState(true);
  const [items, setItems] = useState<ItemRow[]>([emptyRow()]);

  useEffect(() => {
    if (!isOpen) return;
    getApiProducts({ throwOnError: false }).then((res) => {
      if (res.data?.value) setProducts(res.data.value);
    });
  }, [isOpen]);

  useEffect(() => {
    if (pkg) {
      setName(pkg.name || "");
      setPrice(pkg.price != null ? pkg.price.toString() : "");
      setDescription(pkg.description || "");
      setHidden(pkg.hidden || false);
      setComingSoon(pkg.comingSoon || false);
      setWithTaxes(pkg.withTaxes ?? true);
      setItems(
        pkg.items && pkg.items.length > 0
          ? pkg.items.map((i) => ({
              key: i.id || Math.random().toString(36).slice(2),
              topLevelProductId: "",
              variationProductId: i.itemId || "",
              // Items saved before periods came from the variation have no type; the admin re-picks one.
              period: i.periodValue && i.periodType ? periodKey(i.periodValue, i.periodType) : "",
            }))
          : [emptyRow()]
      );
    } else {
      setName("");
      setPrice("");
      setDescription("");
      setHidden(false);
      setComingSoon(false);
      setWithTaxes(true);
      setItems([emptyRow()]);
    }
    setError("");
  }, [pkg, isOpen]);

  if (!isOpen) return null;

  const topLevelProducts = products.filter((p) => !p.parentProductId);
  const variationsFor = (parentId: string) => {
    if (!parentId) return [];
    const parent = products.find((p) => p.id === parentId);
    if (parent) {
      if (!parent.parentProductId && (!parent.children || parent.children.length === 0)) {
        // Standalone product with no variations — it's itself the sellable item.
        return [parent];
      }
      if (parent.children && parent.children.length > 0) {
        return parent.children;
      }
    }
    return products.filter((p) => p.parentProductId === parentId);
  };

  // For edit mode, we only have the variation id — infer its parent so the two selects line up.
  const resolveTopLevelId = (variationProductId: string) => {
    let variation = products.find((p) => p.id === variationProductId);
    if (variation) return variation.parentProductId || variation.id || "";
    
    // If not found at top level, search inside children
    for (const p of products) {
      if (p.children) {
        variation = p.children.find((c) => c.id === variationProductId);
        if (variation) return p.id || "";
      }
    }
    return "";
  };

  const findProduct = (id: string) =>
    products.find((p) => p.id === id) ?? products.flatMap((p) => p.children ?? []).find((c) => c.id === id);

  /** The distinct periods the variation is sold for (its active prices), shortest first, with the countries offering each. */
  const periodsFor = (variationId: string) => {
    const options = new Map<string, { value: number; type: PeriodType; countries: string[] }>();
    for (const price of findProduct(variationId)?.prices ?? []) {
      if (price.active === false || !price.period || !price.periodType) continue;
      const key = periodKey(price.period, price.periodType);
      const option = options.get(key) ?? { value: price.period, type: price.periodType, countries: [] };
      if (price.country && !option.countries.includes(price.country)) option.countries.push(price.country);
      options.set(key, option);
    }
    return [...options.entries()]
      .map(([key, o]) => ({ key, ...o }))
      .sort((a, b) => a.value * DAYS[a.type] - b.value * DAYS[b.type]);
  };

  const selectVariation = (key: string, variationProductId: string) => {
    const periods = periodsFor(variationProductId);
    // One period: nothing to choose.
    updateItem(key, { variationProductId, period: periods.length === 1 ? periods[0].key : "" });
  };

  const updateItem = (key: string, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeItem = (key: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const resolvedItems = items.map((row) => {
      const [value, type] = row.period.split("|");
      return {
        productId: row.variationProductId || row.topLevelProductId,
        period: Number(value) || 0,
        periodType: (type || undefined) as PeriodType | undefined,
      };
    });

    if (resolvedItems.some((i) => !i.productId)) {
      setError("Select a product/variation for every item row.");
      return;
    }
    if (resolvedItems.some((i) => !i.period || !i.periodType)) {
      setError("Select a period for every item row.");
      return;
    }

    setLoading(true);
    try {
      const body = {
        name,
        price: Number(price) || 0,
        description: description || null,
        // Not editable here; keep the saved values so an edit doesn't count as changing them.
        miniDescription: pkg?.miniDescription ?? null,
        hidden,
        comingSoon,
        withTaxes,
        expiryDate: pkg?.expiryDate ?? null,
        items: resolvedItems,
      };

      const res = pkg?.id
        ? await putApiPackagesById({ path: { id: pkg.id }, body, throwOnError: false })
        : await postApiPackages({ body, throwOnError: false });

      if (res.error || (res.data as any)?.isError) {
        throw new Error(
          (res.data as any)?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to save package."
        );
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the package.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">{pkg ? "Edit Package" : "New Package"}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form id="packageForm" onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="e.g. Starter Bundle" disabled={locked("name")} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Price (the package's own price)</label>
                  <input type="number" step="0.01" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} className="form-input" disabled={locked("price")} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-input" rows={2} disabled={locked("description")} />
              </div>

              <div style={{ padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                    Bundled Items
                  </h3>
                  <button type="button" className="btn-ghost" onClick={() => setItems((prev) => [...prev, emptyRow()])} disabled={locked("items")}>
                    + Add item
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {items.map((row) => {
                    const topLevelId = row.topLevelProductId || resolveTopLevelId(row.variationProductId);
                    const variations = variationsFor(topLevelId);
                    const variationId = row.variationProductId || (variations.length === 1 && variations[0].id === topLevelId ? topLevelId : "");
                    const periods = variationId ? periodsFor(variationId) : [];
                    return (
                      <div
                        key={row.key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr auto",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <select
                          className="form-input"
                          value={topLevelId}
                          disabled={locked("items")}
                          onChange={(e) => updateItem(row.key, { topLevelProductId: e.target.value, variationProductId: "", period: "" })}
                        >
                          <option value="">Select product...</option>
                          {topLevelProducts.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>

                        <select
                          className="form-input"
                          value={row.variationProductId}
                          disabled={locked("items") || !topLevelId}
                          onChange={(e) => selectVariation(row.key, e.target.value)}
                        >
                          <option value="">Select variation...</option>
                          {variations.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}{v.version ? ` (${v.version})` : ""}</option>
                          ))}
                        </select>

                        <select
                          className="form-input"
                          value={row.period}
                          disabled={locked("items") || !variationId || periods.length === 0}
                          onChange={(e) => updateItem(row.key, { period: e.target.value })}
                          aria-label="Period"
                          title={variationId && periods.length === 0 ? "This variation has no active prices with a period" : undefined}
                        >
                          <option value="">{variationId && periods.length === 0 ? "No periods" : "Select period..."}</option>
                          {periods.map((o) => (
                            <option key={o.key} value={o.key}>
                              {periodLabel(o.value, o.type)}{o.countries.length > 0 ? ` · ${o.countries.join(", ")}` : ""}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          className="btn-danger-ghost"
                          onClick={() => removeItem(row.key)}
                          disabled={locked("items") || items.length === 1}
                          title="Remove item"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p style={{ margin: "0.6rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Columns: Product, Variation, Period. The period comes from the variation&apos;s prices; the package keeps its own price.
                </p>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} disabled={locked("hidden")} style={{ width: "16px", height: "16px" }} />
                  Hidden
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={comingSoon} onChange={(e) => setComingSoon(e.target.checked)} disabled={locked("comingSoon")} style={{ width: "16px", height: "16px" }} />
                  Coming Soon
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={withTaxes} onChange={(e) => setWithTaxes(e.target.checked)} disabled={locked("withTaxes")} style={{ width: "16px", height: "16px" }} />
                  With Taxes
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="packageForm" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Package"}
          </button>
        </div>
      </div>
    </div>
  );
}
