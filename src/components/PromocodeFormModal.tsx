"use client";

import { useState, useEffect } from "react";
import { postApiPromocodes, putApiPromocodesById, getApiProducts } from "@/client";
import type { ProductDto, PromocodeDiscountType, PromocodeDto } from "@/client/types.gen";

type PromocodeFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promocode: PromocodeDto | null; // null for Create mode
};

/** The three ways a code can discount the cart; a code uses exactly one. */
const DISCOUNT_TYPES: { type: PromocodeDiscountType; label: string; symbol: string; hint: string; productsHint: string; placeholder: string }[] = [
  { type: "Percentage", label: "Percentage", symbol: "%", hint: "Percent off the cart total (1–100).", productsHint: "Percent off the selected products (1–100).", placeholder: "e.g. 20" },
  { type: "AmountOff", label: "Amount off", symbol: "−", hint: "A fixed amount subtracted from the cart total.", productsHint: "A fixed amount subtracted from the selected products' total.", placeholder: "e.g. 100" },
  { type: "FinalPrice", label: "Final price", symbol: "=", hint: "The whole cart costs exactly this amount.", productsHint: "The selected products together cost exactly this amount.", placeholder: "e.g. 500" },
];

/**
 * Cart lines hold the item actually sold: a variation, or the product itself when it has none.
 * So a code is limited to those sellable ids, grouped under their top-level product for the picker.
 */
type ProductGroup = { id: string; name: string; items: { id: string; name: string }[] };

const toProductGroups = (products: ProductDto[]): ProductGroup[] =>
  products
    .filter((p) => p.id && !p.parentProductId)
    .map((p) => {
      const children = (p.children?.length ? p.children : products.filter((c) => c.parentProductId === p.id)).filter((c) => c.id);
      return {
        id: p.id!,
        name: p.name || "Unnamed product",
        items: children.length
          ? children.map((c) => ({ id: c.id!, name: c.name || "Unnamed variation" }))
          : [{ id: p.id!, name: p.name || "Unnamed product" }],
      };
    });

const SAMPLE_TOTAL = 1000;

const previewTotal = (type: PromocodeDiscountType, value: number) => {
  if (type === "Percentage") return SAMPLE_TOTAL * (1 - value / 100);
  if (type === "AmountOff") return Math.max(0, SAMPLE_TOTAL - value);
  // A code never raises the price, so a final price above the total leaves it unchanged.
  return Math.min(value, SAMPLE_TOTAL);
};

const errorText = (data: unknown, fallback: string) =>
  (data as { errors?: { description?: string | null }[] | null } | undefined)?.errors
    ?.map((e) => e.description)
    .filter(Boolean)
    .join(", ") || fallback;

export default function PromocodeFormModal({ isOpen, onClose, onSuccess, promocode }: PromocodeFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<PromocodeDiscountType>("Percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [withTaxes, setWithTaxes] = useState(true);
  const [specificProducts, setSpecificProducts] = useState(false);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<ProductDto[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    getApiProducts({ query: { includeHidden: true }, throwOnError: false }).then((res) => {
      if (res.data?.value) setProducts(res.data.value);
    });
  }, [isOpen]);

  useEffect(() => {
    if (promocode) {
      setCode(promocode.code || "");
      setDiscountType(promocode.discountType ?? "Percentage");
      setDiscountValue(promocode.discountValue != null ? promocode.discountValue.toString() : "");
      setExpiresAt(promocode.expiresAt ? new Date(promocode.expiresAt).toISOString().slice(0, 10) : "");
      setMaxUses(promocode.maxUses?.toString() || "");
      setDisabled(promocode.disabled || false);
      setWithTaxes(promocode.withTaxes ?? true);
      setProductIds(promocode.productIds ?? []);
      setSpecificProducts((promocode.productIds?.length ?? 0) > 0);
    } else {
      setCode("");
      setDiscountType("Percentage");
      setDiscountValue("");
      setExpiresAt("");
      setMaxUses("");
      setDisabled(false);
      setWithTaxes(true);
      setProductIds([]);
      setSpecificProducts(false);
    }
    setProductSearch("");
    setError("");
  }, [promocode, isOpen]);

  if (!isOpen) return null;

  const active = DISCOUNT_TYPES.find((d) => d.type === discountType)!;
  const value = Number(discountValue);
  const hasValue = discountValue.trim() !== "" && !Number.isNaN(value);
  const valueProblem = !hasValue ? null
    : discountType === "Percentage" && (value <= 0 || value > 100) ? "Percentage must be more than 0 and at most 100."
    : discountType === "AmountOff" && value <= 0 ? "Amount off must be more than 0."
    : discountType === "FinalPrice" && value < 0 ? "Final price can't be negative."
    : null;

  const productGroups = toProductGroups(products);
  const search = productSearch.trim().toLowerCase();
  const visibleGroups = !search ? productGroups : productGroups
    .map((g) => g.name.toLowerCase().includes(search) ? g : { ...g, items: g.items.filter((i) => i.name.toLowerCase().includes(search)) })
    .filter((g) => g.items.length > 0);
  const productsProblem = specificProducts && productIds.length === 0 ? "Pick at least one product, or apply the code to the whole cart." : null;

  const toggleProducts = (ids: string[], on: boolean) =>
    setProductIds((prev) => on ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValue || valueProblem || productsProblem) return;
    setLoading(true);
    setError("");

    // One request with every field, so nothing saved earlier gets wiped by a partial update.
    const fields = {
      discountType,
      discountValue: value,
      disabled,
      withTaxes,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      maxUses: maxUses ? Number(maxUses) : null,
      // Empty list = the code applies to the whole cart.
      productIds: specificProducts ? productIds : [],
    };

    try {
      const res = promocode?.id
        ? await putApiPromocodesById({ path: { id: promocode.id }, body: { id: promocode.id, code: code.trim(), ...fields }, throwOnError: false })
        : await postApiPromocodes({ body: { code: code.trim(), ...fields }, throwOnError: false });

      if (res.error || res.data?.isError) {
        throw new Error(errorText(res.data ?? res.error, "Failed to save promocode."));
      }
      onSuccess();
    } catch (err) {
      setError((err instanceof Error && err.message) || "An error occurred while saving the promocode.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">{promocode ? "Edit Promocode" : "New Promocode"}</h2>
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

          <form id="promocodeForm" onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="form-input"
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em", textTransform: "uppercase" }}
                  placeholder="e.g. SUMMER2026"
                />
              </div>

              <div style={{ padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--bg-elevated)", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Discount</h3>

                {/* Choose one discount type */}
                <div role="radiogroup" aria-label="Discount type" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {DISCOUNT_TYPES.map((d) => {
                    const selected = d.type === discountType;
                    return (
                      <button
                        key={d.type}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => { setDiscountType(d.type); setDiscountValue(""); }}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
                          padding: "0.6rem 0.5rem", borderRadius: "var(--radius-md)", cursor: "pointer",
                          font: "inherit", fontSize: "0.85rem", fontWeight: 600,
                          border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                          background: selected ? "var(--accent-dim)" : "var(--bg-surface)",
                          color: selected ? "var(--accent)" : "var(--text-secondary)",
                        }}
                      >
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>{d.symbol}</span>
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                {/* The single value for that type */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="discountValue">
                    {discountType === "Percentage" ? "Percent off *" : discountType === "AmountOff" ? "Amount off *" : "Final cart price *"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="discountValue"
                      type="number"
                      step="0.01"
                      min={discountType === "FinalPrice" ? 0 : 0.01}
                      max={discountType === "Percentage" ? 100 : undefined}
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="form-input"
                      placeholder={active.placeholder}
                      style={{ paddingRight: "2.5rem", borderColor: valueProblem ? "var(--danger)" : undefined }}
                    />
                    {discountType === "Percentage" && (
                      <span style={{ position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: 700 }}>%</span>
                    )}
                  </div>
                  <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: valueProblem ? "var(--danger)" : "var(--text-muted)" }}>
                    {valueProblem ?? (specificProducts ? active.productsHint : active.hint)}
                  </p>
                </div>

                {hasValue && !valueProblem && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px dashed var(--border)" }}>
                    Example: {specificProducts ? "selected products worth" : "a cart of"} <strong>{SAMPLE_TOTAL}</strong> become{specificProducts ? "" : "s"}{" "}
                    <strong style={{ color: "var(--success)" }}>{previewTotal(discountType, value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                    {previewTotal(discountType, value) === 0 && <span style={{ color: "var(--danger)", fontWeight: 600 }}> (free!)</span>}
                  </div>
                )}
              </div>

              <div style={{ padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--bg-elevated)", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Applies to</h3>

                <div role="radiogroup" aria-label="Applies to" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                  {[{ specific: false, label: "Whole cart" }, { specific: true, label: "Specific products" }].map((o) => {
                    const selected = o.specific === specificProducts;
                    return (
                      <button
                        key={o.label}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSpecificProducts(o.specific)}
                        style={{
                          padding: "0.6rem 0.5rem", borderRadius: "var(--radius-md)", cursor: "pointer",
                          font: "inherit", fontSize: "0.85rem", fontWeight: 600,
                          border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                          background: selected ? "var(--accent-dim)" : "var(--bg-surface)",
                          color: selected ? "var(--accent)" : "var(--text-secondary)",
                        }}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>

                {!specificProducts ? (
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Works on any purchase — every product and package in the cart.</p>
                ) : (
                  <>
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="form-input"
                      placeholder="Search products…"
                    />
                    <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-surface)" }}>
                      {visibleGroups.length === 0 ? (
                        <p style={{ margin: 0, padding: "0.75rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          {products.length === 0 ? "Loading products…" : "No products match."}
                        </p>
                      ) : visibleGroups.map((g) => {
                        const ids = g.items.map((i) => i.id);
                        const selectedCount = ids.filter((id) => productIds.includes(id)).length;
                        const standalone = g.items.length === 1 && g.items[0].id === g.id;
                        return (
                          <div key={g.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", color: "var(--text-primary)" }}>
                              <input
                                type="checkbox"
                                checked={selectedCount === ids.length}
                                ref={(el) => { if (el) el.indeterminate = selectedCount > 0 && selectedCount < ids.length; }}
                                onChange={(e) => toggleProducts(ids, e.target.checked)}
                                style={{ width: "16px", height: "16px" }}
                              />
                              {g.name}
                              {!standalone && <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)" }}>{selectedCount}/{ids.length}</span>}
                            </label>
                            {!standalone && g.items.map((i) => (
                              <label key={i.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem 0.35rem 2.1rem", fontSize: "0.82rem", cursor: "pointer", color: "var(--text-secondary)" }}>
                                <input type="checkbox" checked={productIds.includes(i.id)} onChange={(e) => toggleProducts([i.id], e.target.checked)} style={{ width: "15px", height: "15px" }} />
                                {i.name}
                              </label>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: productsProblem ? "var(--danger)" : "var(--text-muted)" }}>
                      {productsProblem ?? `${productIds.length} selected. Only these products get the discount; the rest of the cart (and packages) is charged in full.`}
                    </p>
                  </>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Expires At</label>
                  <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Max Uses</label>
                  <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="form-input" placeholder="Leave empty for unlimited" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                  <span title="A disabled code is rejected at the cart until you enable it again.">Disabled</span>
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
          <button type="submit" form="promocodeForm" className="btn-primary" disabled={loading || !hasValue || !!valueProblem || !!productsProblem}>
            {loading ? "Saving..." : "Save Promocode"}
          </button>
        </div>
      </div>
    </div>
  );
}
