"use client";

import { useState, useEffect } from "react";
import { postApiPromocodes, putApiPromocodesById, getApiProducts, getApiPackages, getApiPromocodesUsers, getApiAcademicDomains } from "@/client";
import type { ClientDto, ProductDto, PromocodeDiscountType, PromocodeDto } from "@/client/types.gen";
import { usePermissions } from "@/components/AuthProvider";

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

const PROMO_FIELDS = ["code", "discount", "items", "allowedEmails", "academicOnly", "oncePerUser", "expiresAt", "maxUses", "disabled", "withTaxes"];

const SAMPLE_TOTAL = 1000;

const previewTotal = (type: PromocodeDiscountType, value: number) => {
  if (type === "Percentage") return SAMPLE_TOTAL * (1 - value / 100);
  if (type === "AmountOff") return Math.max(0, SAMPLE_TOTAL - value);
  // A code never raises the price, so a final price above the total leaves it unchanged.
  return Math.min(value, SAMPLE_TOTAL);
};

type PickedUser = { userId: string; label: string };

const savedUsers = (p: PromocodeDto): PickedUser[] =>
  (p.allowedUserIds ?? p.allowedUsers?.map((u) => u.userId!).filter(Boolean) ?? []).map((id) => {
    const u = p.allowedUsers?.find((x) => x.userId === id);
    return { userId: id, label: u?.email || u?.userName || id };
  });

const errorText = (data: unknown, fallback: string) =>
  (data as { errors?: { description?: string | null }[] | null } | undefined)?.errors
    ?.map((e) => e.description)
    .filter(Boolean)
    .join(", ") || fallback;

export default function PromocodeFormModal({ isOpen, onClose, onSuccess, promocode }: PromocodeFormModalProps) {
  const { canField } = usePermissions();
  // Edit mode only: fields the user can't change are hidden but still sent as saved (the API rejects changing them).
  const locked = (field: string) => !!promocode && !canField("promocodes", field);
  const noneEditable = PROMO_FIELDS.every(locked);
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
  const [packageIds, setPackageIds] = useState<string[]>([]);
  const [packages, setPackages] = useState<{ id: string; name: string }[]>([]);
  // Who can use it: everyone, or picked accounts (plus legacy verified emails); plus academic / once-per-account limits.
  const [specificUsers, setSpecificUsers] = useState(false);
  const [users, setUsers] = useState<PickedUser[]>([]);
  const [legacyEmails, setLegacyEmails] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<ClientDto[]>([]);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [academicOnly, setAcademicOnly] = useState(false);
  const [specificDomains, setSpecificDomains] = useState(false);
  const [domains, setDomains] = useState<string[]>([]);
  const [academicDomains, setAcademicDomains] = useState<string[] | null>(null);
  const [oncePerUser, setOncePerUser] = useState(false);

  useEffect(() => {
    if (!isOpen || !specificUsers || !userSearchOpen) return;
    let cancelled = false;
    const t = setTimeout(() => {
      getApiPromocodesUsers({ query: { search: userSearch.trim(), take: 20 }, throwOnError: false }).then((res) => {
        if (!cancelled) setUserResults(res.data?.value ?? []);
      });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [isOpen, specificUsers, userSearchOpen, userSearch]);

  useEffect(() => {
    if (!isOpen) return;
    getApiAcademicDomains({ throwOnError: false }).then((res) => setAcademicDomains(res.data?.value ?? []));
    getApiProducts({ query: { includeHidden: true }, throwOnError: false }).then((res) => {
      if (res.data?.value) setProducts(res.data.value);
    });
    getApiPackages({ query: { includeHidden: true }, throwOnError: false }).then((res) => {
      if (res.data?.value) setPackages(res.data.value.filter((p) => p.id).map((p) => ({ id: p.id!, name: p.name || "Package" })));
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
      setPackageIds(promocode.packageIds ?? []);
      setSpecificProducts((promocode.productIds?.length ?? 0) + (promocode.packageIds?.length ?? 0) > 0);
      const picked = savedUsers(promocode);
      setUsers(picked);
      setLegacyEmails(promocode.allowedEmails ?? []);
      setSpecificUsers(picked.length + (promocode.allowedEmails?.length ?? 0) > 0);
      setAcademicOnly(!!promocode.academicOnly);
      setDomains(promocode.allowedDomains ?? []);
      setSpecificDomains((promocode.allowedDomains?.length ?? 0) > 0);
      setOncePerUser(!!promocode.oncePerUser);
    } else {
      setCode("");
      setDiscountType("Percentage");
      setDiscountValue("");
      setExpiresAt("");
      setMaxUses("");
      setDisabled(false);
      setWithTaxes(true);
      setProductIds([]);
      setPackageIds([]);
      setSpecificProducts(false);
      setSpecificUsers(false);
      setUsers([]);
      setLegacyEmails([]);
      setAcademicOnly(false);
      setDomains([]);
      setSpecificDomains(false);
      setOncePerUser(false);
    }
    setProductSearch("");
    setUserSearch("");
    setUserResults([]);
    setUserSearchOpen(false);
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
  const productsProblem = specificProducts && productIds.length + packageIds.length === 0 ? "Pick at least one product or package, or apply the code to the whole cart." : null;
  const visiblePackages = !search ? packages : packages.filter((p) => p.name.toLowerCase().includes(search));
  const togglePackage = (id: string, on: boolean) =>
    setPackageIds((prev) => on ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id));

  const usersProblem = specificUsers && !locked("allowedEmails") && users.length + legacyEmails.length === 0
    ? "Add at least one user, or let everyone use the code." : null;
  const addUser = (c: ClientDto) => {
    if (!c.userId) return;
    setUsers((prev) => prev.some((u) => u.userId === c.userId) ? prev : [...prev, { userId: c.userId!, label: c.email || c.userName || c.userId! }]);
  };
  const domainsProblem = academicOnly && specificDomains && !locked("academicOnly") && domains.length === 0
    ? "Pick at least one university, or allow all academic domains." : null;
  // Saved domains stay pickable even if they were removed from the list since.
  const domainOptions = Array.from(new Set([...(academicDomains ?? []), ...domains]));
  const toggleDomain = (d: string, on: boolean) =>
    setDomains((prev) => on ? Array.from(new Set([...prev, d])) : prev.filter((x) => x !== d));

  const toggleProducts = (ids: string[], on: boolean) =>
    setProductIds((prev) => on ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (noneEditable || !hasValue || valueProblem || productsProblem || usersProblem || domainsProblem) return;
    setLoading(true);
    setError("");

    // One request with every field, so nothing saved earlier gets wiped by a partial update.
    const fields = {
      discountType,
      discountValue: value,
      disabled,
      withTaxes,
      // A locked field is sent back as saved, so re-formatting it doesn't count as a change.
      expiresAt: locked("expiresAt") ? promocode?.expiresAt ?? null : expiresAt ? new Date(expiresAt).toISOString() : null,
      maxUses: maxUses ? Number(maxUses) : null,
      // Empty list = the code applies to the whole cart.
      productIds: specificProducts ? productIds : [],
      packageIds: specificProducts ? packageIds : [],
      // Empty list = anyone can use it.
      allowedUserIds: locked("allowedEmails") ? promocode?.allowedUserIds ?? [] : specificUsers ? users.map((u) => u.userId) : [],
      allowedEmails: locked("allowedEmails") ? promocode?.allowedEmails ?? [] : specificUsers ? legacyEmails : [],
      allowedDomains: locked("academicOnly") ? promocode?.allowedDomains ?? [] : academicOnly && specificDomains ? domains : [],
      academicOnly,
      oncePerUser,
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

              {noneEditable && (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>You don&apos;t have permission to edit any field here.</p>
              )}

              {!locked("code") && (
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
              )}

              {!locked("discount") && (
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
              )}

              {!locked("items") && (
              <div style={{ padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--bg-elevated)", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Applies to</h3>

                <div role="radiogroup" aria-label="Applies to" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                  {[{ specific: false, label: "Whole cart" }, { specific: true, label: "Specific items" }].map((o) => {
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
                      placeholder="Search products and packages…"
                    />
                    <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-surface)" }}>
                      {visiblePackages.length > 0 && (
                        <div style={{ borderBottom: "1px solid var(--border)" }}>
                          <p style={{ margin: 0, padding: "0.5rem 0.75rem 0.25rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Packages</p>
                          {visiblePackages.map((p) => (
                            <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", color: "var(--text-primary)" }}>
                              <input type="checkbox" checked={packageIds.includes(p.id)} onChange={(e) => togglePackage(p.id, e.target.checked)} style={{ width: "16px", height: "16px" }} />
                              📦 {p.name}
                            </label>
                          ))}
                        </div>
                      )}
                      {visibleGroups.length > 0 && (
                        <p style={{ margin: 0, padding: "0.5rem 0.75rem 0.25rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Products</p>
                      )}
                      {visibleGroups.length === 0 && visiblePackages.length === 0 ? (
                        <p style={{ margin: 0, padding: "0.75rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          {products.length === 0 ? "Loading products…" : "Nothing matches."}
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
                      {productsProblem ?? `${productIds.length} product${productIds.length !== 1 ? "s" : ""} and ${packageIds.length} package${packageIds.length !== 1 ? "s" : ""} selected. Only these get the discount; the rest of the cart is charged in full.`}
                    </p>
                  </>
                )}
              </div>
              )}

              {!(locked("allowedEmails") && locked("academicOnly") && locked("oncePerUser")) && (
              <div style={{ padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--bg-elevated)", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Who can use it</h3>

                {!locked("allowedEmails") && (
                <>
                <div role="radiogroup" aria-label="Who can use it" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                  {[{ specific: false, label: "Everyone" }, { specific: true, label: "Specific users" }].map((o) => {
                    const selected = o.specific === specificUsers;
                    return (
                      <button key={o.label} type="button" role="radio" aria-checked={selected} onClick={() => setSpecificUsers(o.specific)}
                        style={{
                          padding: "0.6rem 0.5rem", borderRadius: "var(--radius-md)", cursor: "pointer",
                          font: "inherit", fontSize: "0.85rem", fontWeight: 600,
                          border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                          background: selected ? "var(--accent-dim)" : "var(--bg-surface)",
                          color: selected ? "var(--accent)" : "var(--text-secondary)",
                        }}>
                        {o.label}
                      </button>
                    );
                  })}
                </div>

                {specificUsers && (
                  <div className="form-group" style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ position: "relative" }}>
                      <input
                        type="search"
                        value={userSearch}
                        onChange={(e) => { setUserSearch(e.target.value); setUserSearchOpen(true); }}
                        onFocus={() => setUserSearchOpen(true)}
                        onBlur={() => setUserSearchOpen(false)}
                        className="form-input"
                        placeholder="Search accounts by email, name or phone…"
                        style={{ borderColor: usersProblem ? "var(--danger)" : undefined }}
                      />
                      {userSearchOpen && (
                        <div style={{ position: "absolute", zIndex: 10, top: "calc(100% + 4px)", left: 0, right: 0, maxHeight: "220px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
                          {userResults.length === 0 ? (
                            <p style={{ margin: 0, padding: "0.75rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>No accounts found.</p>
                          ) : userResults.map((c) => {
                            const added = users.some((u) => u.userId === c.userId);
                            return (
                              <button
                                key={c.userId}
                                type="button"
                                // mousedown fires before the input's blur closes the list
                                onMouseDown={(e) => { e.preventDefault(); addUser(c); }}
                                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", padding: "0.45rem 0.75rem", border: "none", borderBottom: "1px solid var(--border)", background: added ? "var(--accent-dim)" : "transparent", cursor: "pointer", font: "inherit", textAlign: "left" }}
                              >
                                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{c.email || c.userName || c.userId}{added ? " ✓" : ""}</span>
                                {c.userName && c.email && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.userName}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {users.length + legacyEmails.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {users.map((u) => (
                          <span key={u.userId} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.5rem", borderRadius: "999px", fontSize: "0.8rem", border: "1px solid var(--accent)", background: "var(--accent-dim)", color: "var(--accent)" }}>
                            {u.label}
                            <button type="button" aria-label={`Remove ${u.label}`} onClick={() => setUsers((prev) => prev.filter((x) => x.userId !== u.userId))} style={{ border: "none", background: "none", color: "inherit", cursor: "pointer", padding: 0, font: "inherit", fontWeight: 700 }}>×</button>
                          </span>
                        ))}
                        {legacyEmails.map((em) => (
                          <span key={em} title="Saved before user picking; works once an account verifies this email." style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.5rem", borderRadius: "999px", fontSize: "0.8rem", border: "1px dashed var(--border)", background: "var(--bg-surface)", color: "var(--text-secondary)" }}>
                            {em} <span style={{ color: "var(--text-muted)" }}>(no account)</span>
                            <button type="button" aria-label={`Remove ${em}`} onClick={() => setLegacyEmails((prev) => prev.filter((x) => x !== em))} style={{ border: "none", background: "none", color: "inherit", cursor: "pointer", padding: 0, font: "inherit", fontWeight: 700 }}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: "0.78rem", color: usersProblem ? "var(--danger)" : "var(--text-muted)" }}>
                      {usersProblem ?? `${users.length} user${users.length !== 1 ? "s" : ""}${legacyEmails.length ? ` and ${legacyEmails.length} email${legacyEmails.length !== 1 ? "s" : ""}` : ""}. Only these accounts can use the code.`}
                    </p>
                  </div>
                )}
                </>
                )}

                {!locked("academicOnly") && (
                <>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={academicOnly} onChange={(e) => setAcademicOnly(e.target.checked)} style={{ width: "16px", height: "16px", marginTop: "2px" }} />
                  <span>Academic accounts only<br /><span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Needs a verified university email whose domain is in the academic domains list.</span></span>
                </label>
                {academicOnly && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", paddingLeft: "1.5rem" }}>
                    <div role="radiogroup" aria-label="Universities" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                      {[{ specific: false, label: "All academic domains" }, { specific: true, label: "Specific universities" }].map((o) => {
                        const selected = o.specific === specificDomains;
                        return (
                          <button key={o.label} type="button" role="radio" aria-checked={selected} onClick={() => setSpecificDomains(o.specific)}
                            style={{
                              padding: "0.5rem 0.5rem", borderRadius: "var(--radius-md)", cursor: "pointer",
                              font: "inherit", fontSize: "0.82rem", fontWeight: 600,
                              border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                              background: selected ? "var(--accent-dim)" : "var(--bg-surface)",
                              color: selected ? "var(--accent)" : "var(--text-secondary)",
                            }}>
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                    {specificDomains && (
                      <>
                        {domainOptions.length === 0 ? (
                          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {academicDomains === null ? "Loading academic domains…" : "No academic domains yet. Add them in the Academic domains card first."}
                          </p>
                        ) : (
                          <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-surface)" }}>
                            {domainOptions.map((d) => (
                              <label key={d} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", fontSize: "0.82rem", cursor: "pointer", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                                <input type="checkbox" checked={domains.includes(d)} onChange={(e) => toggleDomain(d, e.target.checked)} style={{ width: "15px", height: "15px" }} />
                                {d}
                              </label>
                            ))}
                          </div>
                        )}
                        <p style={{ margin: 0, fontSize: "0.78rem", color: domainsProblem ? "var(--danger)" : "var(--text-muted)" }}>
                          {domainsProblem ?? `${domains.length} universit${domains.length !== 1 ? "ies" : "y"} selected. Subdomains count too; manage the list in the Academic domains card.`}
                        </p>
                      </>
                    )}
                  </div>
                )}
                </>
                )}
                {!locked("oncePerUser") && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={oncePerUser} onChange={(e) => setOncePerUser(e.target.checked)} style={{ width: "16px", height: "16px", marginTop: "2px" }} />
                  <span>Once per account<br /><span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>After paying with it once, the same account can&apos;t use it again.</span></span>
                </label>
                )}
              </div>
              )}

              {!(locked("expiresAt") && locked("maxUses")) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {!locked("expiresAt") && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Expires At</label>
                  <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="form-input" />
                </div>
                )}
                {!locked("maxUses") && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Max Uses</label>
                  <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="form-input" placeholder="Leave empty for unlimited" />
                </div>
                )}
              </div>
              )}

              {!(locked("disabled") && locked("withTaxes")) && (
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                {!locked("disabled") && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                  <span title="A disabled code is rejected at the cart until you enable it again.">Disabled</span>
                </label>
                )}
                {!locked("withTaxes") && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={withTaxes} onChange={(e) => setWithTaxes(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                  With Taxes
                </label>
                )}
              </div>
              )}

            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="promocodeForm" className="btn-primary" disabled={loading || noneEditable || !hasValue || !!valueProblem || !!productsProblem || !!usersProblem || !!domainsProblem}>
            {loading ? "Saving..." : "Save Promocode"}
          </button>
        </div>
      </div>
    </div>
  );
}
