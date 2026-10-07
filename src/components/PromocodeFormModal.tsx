"use client";

import { useState, useEffect } from "react";
import { postApiPromocodes, putApiPromocodesById } from "@/client";
import type { PromocodeDiscountType, PromocodeDto } from "@/client/types.gen";

type PromocodeFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promocode: PromocodeDto | null; // null for Create mode
};

/** The three ways a code can discount the cart; a code uses exactly one. */
const DISCOUNT_TYPES: { type: PromocodeDiscountType; label: string; symbol: string; hint: string; placeholder: string }[] = [
  { type: "Percentage", label: "Percentage", symbol: "%", hint: "Percent off the cart total (1–100).", placeholder: "e.g. 20" },
  { type: "AmountOff", label: "Amount off", symbol: "−", hint: "A fixed amount subtracted from the cart total.", placeholder: "e.g. 100" },
  { type: "FinalPrice", label: "Final price", symbol: "=", hint: "The whole cart costs exactly this amount.", placeholder: "e.g. 500" },
];

const SAMPLE_TOTAL = 1000;

const previewTotal = (type: PromocodeDiscountType, value: number) => {
  if (type === "Percentage") return SAMPLE_TOTAL * (1 - value / 100);
  if (type === "AmountOff") return Math.max(0, SAMPLE_TOTAL - value);
  return value;
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
  const [hidden, setHidden] = useState(false);
  const [withTaxes, setWithTaxes] = useState(true);

  useEffect(() => {
    if (promocode) {
      setCode(promocode.code || "");
      setDiscountType(promocode.discountType ?? "Percentage");
      setDiscountValue(promocode.discountValue != null ? promocode.discountValue.toString() : "");
      setExpiresAt(promocode.expiresAt ? new Date(promocode.expiresAt).toISOString().slice(0, 10) : "");
      setMaxUses(promocode.maxUses?.toString() || "");
      setHidden(promocode.hidden || false);
      setWithTaxes(promocode.withTaxes ?? true);
    } else {
      setCode("");
      setDiscountType("Percentage");
      setDiscountValue("");
      setExpiresAt("");
      setMaxUses("");
      setHidden(false);
      setWithTaxes(true);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValue || valueProblem) return;
    setLoading(true);
    setError("");

    // One request with every field, so nothing saved earlier gets wiped by a partial update.
    const fields = {
      discountType,
      discountValue: value,
      hidden,
      withTaxes,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      maxUses: maxUses ? Number(maxUses) : null,
    };

    try {
      const res = promocode?.id
        ? await putApiPromocodesById({ path: { id: promocode.id }, body: { id: promocode.id, ...fields }, throwOnError: false })
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
                  disabled={!!promocode}
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
                    {valueProblem ?? active.hint}
                  </p>
                </div>

                {hasValue && !valueProblem && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px dashed var(--border)" }}>
                    Example: a cart of <strong>{SAMPLE_TOTAL}</strong> becomes{" "}
                    <strong style={{ color: "var(--success)" }}>{previewTotal(discountType, value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                    {previewTotal(discountType, value) === 0 && <span style={{ color: "var(--danger)", fontWeight: 600 }}> (free!)</span>}
                  </div>
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
                  <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                  Hidden
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
          <button type="submit" form="promocodeForm" className="btn-primary" disabled={loading || !hasValue || !!valueProblem}>
            {loading ? "Saving..." : "Save Promocode"}
          </button>
        </div>
      </div>
    </div>
  );
}
