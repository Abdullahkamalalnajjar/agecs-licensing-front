"use client";

import { useState, useEffect } from "react";
import { postApiPromocodes, putApiPromocodesByIdDiscounts, putApiPromocodesByIdAudience } from "@/client";

type PromocodeFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promocode: any; // null for Create mode, object for Edit mode
};

export default function PromocodeFormModal({ isOpen, onClose, onSuccess, promocode }: PromocodeFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [defaultPriceMultiplier, setDefaultPriceMultiplier] = useState("1");
  const [fixedDiscount, setFixedDiscount] = useState("0");
  const [constantDiscount, setConstantDiscount] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  
  const [hidden, setHidden] = useState(false);
  const [withTaxes, setWithTaxes] = useState(true);

  useEffect(() => {
    if (promocode) {
      setCode(promocode.code || "");
      setDefaultPriceMultiplier(promocode.defaultPriceMultiplier?.toString() || "1");
      setFixedDiscount(promocode.fixedDiscount?.toString() || "0");
      setConstantDiscount(promocode.constantDiscount?.toString() || "0");
      setExpiresAt(promocode.expiresAt ? new Date(promocode.expiresAt).toISOString().slice(0, 10) : "");
      setMaxUses(promocode.maxUses?.toString() || "");
      setHidden(promocode.hidden || false);
      setWithTaxes(promocode.withTaxes ?? true);
    } else {
      setCode("");
      setDefaultPriceMultiplier("1");
      setFixedDiscount("0");
      setConstantDiscount("0");
      setExpiresAt("");
      setMaxUses("");
      setHidden(false);
      setWithTaxes(true);
    }
    setError("");
  }, [promocode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let currentId = promocode?.id;

      if (!currentId) {
        const createRes = await postApiPromocodes({
          body: { code },
          throwOnError: false
        });

        if (createRes.data?.isSuccess && createRes.data.value) {
          currentId = createRes.data.value.id;
        } else {
          throw new Error(createRes.data?.errors?.map((err: any) => err.description).join(", ") || "Failed to create promocode.");
        }
      }

      const discountsRes = await putApiPromocodesByIdDiscounts({
        path: { id: currentId },
        body: {
          id: currentId,
          defaultPriceMultiplier: defaultPriceMultiplier ? Number(defaultPriceMultiplier) : null,
          fixedDiscount: fixedDiscount ? Number(fixedDiscount) : null,
          constantDiscount: constantDiscount ? Number(constantDiscount) : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          maxUses: maxUses ? Number(maxUses) : null
        },
        throwOnError: false
      });

      if (discountsRes.error || discountsRes.data?.isError) {
        throw new Error(discountsRes.data?.errors?.map((err: any) => err.description).join(", ") || "Failed to update discounts.");
      }

      const audienceRes = await putApiPromocodesByIdAudience({
        path: { id: currentId },
        body: {
          id: currentId,
          hidden,
          withTaxes
        },
        throwOnError: false
      });

      if (audienceRes.error || audienceRes.data?.isError) {
        throw new Error(audienceRes.data?.errors?.map((err: any) => err.description).join(", ") || "Failed to update audience.");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the promocode.");
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

              <div style={{ padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", margin: 0 }}>Discount Settings</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Price Multiplier</label>
                    <input type="number" step="0.01" value={defaultPriceMultiplier} onChange={(e) => setDefaultPriceMultiplier(e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Fixed Discount</label>
                    <input type="number" step="0.01" value={fixedDiscount} onChange={(e) => setFixedDiscount(e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Constant Discount</label>
                    <input type="number" step="0.01" value={constantDiscount} onChange={(e) => setConstantDiscount(e.target.value)} className="form-input" />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Expires At</label>
                  <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Max Uses</label>
                  <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="form-input" placeholder="Leave empty for unlimited" />
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
          <button type="submit" form="promocodeForm" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Promocode"}
          </button>
        </div>
      </div>
    </div>
  );
}
