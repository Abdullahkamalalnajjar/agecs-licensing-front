"use client";

import { useState } from "react";
import { postApiProducts, putApiProductsById } from "@/client";

type ProductFormModalProps = {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ProductFormModal({ initialData, onClose, onSuccess }: ProductFormModalProps) {
  const isEditing = !!initialData;
  const [productData, setProductData] = useState({
    name: initialData?.name || "",
    fullName: initialData?.fullName || "",
    family: initialData?.family || "SES",
    description: initialData?.description || "",
    miniDescription: initialData?.miniDescription || "",
    link: initialData?.link || "",
    storagePath: initialData?.storagePath || "",
    parentProductId: initialData?.parentProductId || "",
    allowTrial: initialData?.allowTrial || false,
    trialPeriod: initialData?.trialPeriod || 0,
    comingSoon: initialData?.comingSoon || false,
    hidden: initialData?.hidden || false,
    order: initialData?.order || 0,
    withTaxes: initialData?.withTaxes ?? true,
    version: initialData?.version || "",
    janDrozdId: initialData?.janDrozdId || "",
    expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : "",
    price: initialData?.prices && initialData.prices.length > 0 ? initialData.prices[0].price : 0,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...productData,
        parentProductId: productData.parentProductId || undefined,
        expiryDate: productData.expiryDate ? new Date(productData.expiryDate).toISOString() : undefined,
        trialPeriod: Number(productData.trialPeriod) || 0,
        order: Number(productData.order) || 0,
        prices: [
          {
            country: "II",
            price: Number(productData.price) || 0,
            period: 1,
            active: true
          }
        ]
      };

      let response;
      if (isEditing) {
        response = await putApiProductsById({ path: { id: initialData.id }, body: payload, throwOnError: false });
      } else {
        response = await postApiProducts({ body: payload, throwOnError: false });
      }

      if (response.data?.isSuccess) {
        onSuccess();
      } else if (response.error || response.data?.isError) {
        const errorMsg = response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to save product.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ backgroundColor: "#ffffff", color: "#111827", width: "100%", maxWidth: "600px", padding: "24px", borderRadius: "12px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>{isEditing ? "Edit Product" : "Add Product"}</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "#6b7280", lineHeight: 1 }}>&times;</button>
        </div>

        {error && (
          <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="name" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Name</label>
              <input id="name" type="text" value={productData.name} onChange={(e) => setProductData({ ...productData, name: e.target.value })} required style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", color: "#111827" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="fullName" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Full Name</label>
              <input id="fullName" type="text" value={productData.fullName} onChange={(e) => setProductData({ ...productData, fullName: e.target.value })} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", color: "#111827" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="description" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Description</label>
              <textarea id="description" value={productData.description} onChange={(e) => setProductData({ ...productData, description: e.target.value })} rows={3} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", resize: "vertical", color: "#111827" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="family" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Family</label>
                <select id="family" value={productData.family} onChange={(e) => setProductData({ ...productData, family: e.target.value })} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", backgroundColor: "white", color: "#111827", appearance: "auto" }}>
                  <option value="SES">SES</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="version" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Version</label>
                <input id="version" type="text" value={productData.version} onChange={(e) => setProductData({ ...productData, version: e.target.value })} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", color: "#111827" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="price" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Price</label>
                <input id="price" type="number" value={productData.price} onChange={(e) => setProductData({ ...productData, price: Number(e.target.value) })} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", color: "#111827" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="janDrozdId" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>JanDrozd ID</label>
                <input id="janDrozdId" type="text" value={productData.janDrozdId} onChange={(e) => setProductData({ ...productData, janDrozdId: e.target.value })} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", color: "#111827" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="trialPeriod" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Trial Period (days)</label>
                <input id="trialPeriod" type="number" value={productData.trialPeriod} onChange={(e) => setProductData({ ...productData, trialPeriod: Number(e.target.value) })} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", color: "#111827" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="expiryDate" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Expiry Date</label>
                <input id="expiryDate" type="date" value={productData.expiryDate} onChange={(e) => setProductData({ ...productData, expiryDate: e.target.value })} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", color: "#111827" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "#111827", cursor: "pointer", fontWeight: "500" }}>
                <input type="checkbox" checked={productData.allowTrial} onChange={(e) => setProductData({ ...productData, allowTrial: e.target.checked })} style={{ width: "16px", height: "16px", borderRadius: "4px", accentColor: "#0ea5e9" }} /> Allow Trial
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "#111827", cursor: "pointer", fontWeight: "500" }}>
                <input type="checkbox" checked={productData.comingSoon} onChange={(e) => setProductData({ ...productData, comingSoon: e.target.checked })} style={{ width: "16px", height: "16px", borderRadius: "4px", accentColor: "#0ea5e9" }} /> Coming Soon
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "#111827", cursor: "pointer", fontWeight: "500" }}>
                <input type="checkbox" checked={productData.hidden} onChange={(e) => setProductData({ ...productData, hidden: e.target.checked })} style={{ width: "16px", height: "16px", borderRadius: "4px", accentColor: "#0ea5e9" }} /> Hidden
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "#111827", cursor: "pointer", fontWeight: "500" }}>
                <input type="checkbox" checked={productData.withTaxes} onChange={(e) => setProductData({ ...productData, withTaxes: e.target.checked })} style={{ width: "16px", height: "16px", borderRadius: "4px", accentColor: "#0ea5e9" }} /> With Taxes
              </label>
            </div>

          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", color: "#111827", fontSize: "0.875rem", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: "10px 20px", background: "#f97316", border: "none", borderRadius: "8px", cursor: "pointer", color: "#ffffff", fontSize: "0.875rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
