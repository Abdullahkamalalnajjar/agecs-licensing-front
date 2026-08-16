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

  // Form State
  const [code, setCode] = useState("");
  const [defaultPriceMultiplier, setDefaultPriceMultiplier] = useState("1");
  const [fixedDiscount, setFixedDiscount] = useState("0");
  const [constantDiscount, setConstantDiscount] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  
  const [hidden, setHidden] = useState(false);
  const [withTaxes, setWithTaxes] = useState(true);

  // Hidden state for fields not shown in UI


  useEffect(() => {
    if (promocode) {
      setCode(promocode.code || "");
      setDefaultPriceMultiplier(promocode.defaultPriceMultiplier?.toString() || "1");
      setFixedDiscount(promocode.fixedDiscount?.toString() || "0");
      setConstantDiscount(promocode.constantDiscount?.toString() || "0");
      // Use slice(0,10) for YYYY-MM-DD format for date input type
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

      // 1. Create mode: Create basic promocode first
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

      // 2. Update Discounts
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

      // 3. Update Audience
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

  const inputStyle = {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    fontSize: "1rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    color: "#111827",
    fontFamily: "inherit"
  };

  const labelStyle = {
    fontSize: "1rem",
    fontWeight: "500",
    color: "#111827",
    marginBottom: "6px",
    display: "block"
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ 
        backgroundColor: "#ffffff", 
        color: "#111827", 
        width: "100%", 
        maxWidth: "600px", 
        padding: "32px", 
        borderRadius: "16px", 
        maxHeight: "90vh", 
        overflowY: "auto", 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700" }}>{promocode ? "Edit Promocode" : "Add Promocode"}</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {error && (
          <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div>
            <label style={labelStyle}>Code</label>
            <input 
              required 
              disabled={!!promocode} 
              type="text" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              style={{...inputStyle, backgroundColor: promocode ? "#f9fafb" : "transparent"}} 
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Default Price Multiplier</label>
              <input type="number" step="0.01" value={defaultPriceMultiplier} onChange={e => setDefaultPriceMultiplier(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fixed Discount</label>
              <input type="number" step="0.01" value={fixedDiscount} onChange={e => setFixedDiscount(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Constant Discount</label>
              <input type="number" step="0.01" value={constantDiscount} onChange={e => setConstantDiscount(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Max Uses</label>
              <input type="number" placeholder="Unlimited" value={maxUses} onChange={e => setMaxUses(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Expires At</label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", cursor: "pointer" }}>
              <input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              Hidden
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", cursor: "pointer" }}>
              <input type="checkbox" checked={withTaxes} onChange={e => setWithTaxes(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              With Taxes
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "16px" }}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading} 
              style={{ 
                padding: "10px 24px", 
                borderRadius: "8px", 
                border: "1px solid #e5e7eb", 
                background: "white", 
                color: "#111827",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer" 
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px", 
                borderRadius: "8px", 
                border: "none", 
                background: "#f97316", // Orange color from screenshot
                color: "white", 
                fontSize: "1rem",
                fontWeight: "600", 
                cursor: loading ? "not-allowed" : "pointer", 
                opacity: loading ? 0.7 : 1 
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              {loading ? "Saving..." : (promocode ? "Save Promocode" : "Create Promocode")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
