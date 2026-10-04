"use client";

import { useState, useEffect } from "react";
import { postApiPackages, putApiPackagesById, getApiProducts } from "@/client";
import type { PackageDto, ProductDto } from "@/client/types.gen";

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
  period: string;
  licenseCount: string;
  migrationLimit: string;
}

const emptyRow = (): ItemRow => ({
  key: Math.random().toString(36).slice(2),
  topLevelProductId: "",
  variationProductId: "",
  period: "30",
  licenseCount: "1",
  migrationLimit: "2",
});

export default function PackageFormModal({ isOpen, onClose, onSuccess, pkg }: PackageFormModalProps) {
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
              period: (i.period ?? 30).toString(),
              licenseCount: (i.licenseCount ?? 1).toString(),
              migrationLimit: (i.migrationLimit ?? 2).toString(),
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

  const updateItem = (key: string, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeItem = (key: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const resolvedItems = items.map((row) => ({
      productId: row.variationProductId || row.topLevelProductId,
      period: Number(row.period) || 0,
      licenseCount: Number(row.licenseCount) || 1,
      migrationLimit: Number(row.migrationLimit) || 2,
    }));

    if (resolvedItems.some((i) => !i.productId)) {
      setError("Select a product/variation for every item row.");
      return;
    }
    if (resolvedItems.some((i) => i.period <= 0)) {
      setError("Every item needs a period greater than 0 days.");
      return;
    }

    setLoading(true);
    try {
      const body = {
        name,
        price: Number(price) || 0,
        description: description || null,
        miniDescription: null,
        hidden,
        comingSoon,
        withTaxes,
        expiryDate: null,
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
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="e.g. Starter Bundle" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Price (the package's own price)</label>
                  <input type="number" step="0.01" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} className="form-input" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-input" rows={2} />
              </div>

              <div style={{ padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                    Bundled Items
                  </h3>
                  <button type="button" className="btn-ghost" onClick={() => setItems((prev) => [...prev, emptyRow()])}>
                    + Add item
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {items.map((row) => {
                    const topLevelId = row.topLevelProductId || resolveTopLevelId(row.variationProductId);
                    const variations = variationsFor(topLevelId);
                    return (
                      <div
                        key={row.key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.4fr 1.4fr 0.7fr 0.7fr 0.7fr auto",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <select
                          className="form-input"
                          value={topLevelId}
                          onChange={(e) => updateItem(row.key, { topLevelProductId: e.target.value, variationProductId: "" })}
                        >
                          <option value="">Select product...</option>
                          {topLevelProducts.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>

                        <select
                          className="form-input"
                          value={row.variationProductId}
                          disabled={!topLevelId}
                          onChange={(e) => updateItem(row.key, { variationProductId: e.target.value })}
                        >
                          <option value="">Select variation...</option>
                          {variations.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}{v.version ? ` (${v.version})` : ""}</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={row.period}
                          onChange={(e) => updateItem(row.key, { period: e.target.value })}
                          title="Period (days)"
                          placeholder="Days"
                        />
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={row.licenseCount}
                          onChange={(e) => updateItem(row.key, { licenseCount: e.target.value })}
                          title="License count"
                        />
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          value={row.migrationLimit}
                          onChange={(e) => updateItem(row.key, { migrationLimit: e.target.value })}
                          title="Migration limit"
                        />

                        <button
                          type="button"
                          className="btn-danger-ghost"
                          onClick={() => removeItem(row.key)}
                          disabled={items.length === 1}
                          title="Remove item"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p style={{ margin: "0.6rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Columns: Product, Variation, Period (days), License count, Migration limit.
                </p>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                  Hidden
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={comingSoon} onChange={(e) => setComingSoon(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                  Coming Soon
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={withTaxes} onChange={(e) => setWithTaxes(e.target.checked)} style={{ width: "16px", height: "16px" }} />
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
