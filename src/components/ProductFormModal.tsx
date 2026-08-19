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
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? "Edit Product" : "Add Product"}</h2>
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
          
          <form id="productForm" onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="name">Name</label>
                <input id="name" type="text" className="form-input" value={productData.name} onChange={(e) => setProductData({ ...productData, name: e.target.value })} required />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="fullName">Full Name</label>
                <input id="fullName" type="text" className="form-input" value={productData.fullName} onChange={(e) => setProductData({ ...productData, fullName: e.target.value })} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="description">Description</label>
                <textarea id="description" className="form-input" value={productData.description} onChange={(e) => setProductData({ ...productData, description: e.target.value })} rows={3} style={{ resize: "vertical" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="family">Family</label>
                  <select id="family" className="form-input" value={["SES", "NanoCAD"].includes(productData.family) ? productData.family : "Other"} onChange={(e) => {
                      if (e.target.value === "Other") {
                        setProductData({ ...productData, family: "" });
                      } else {
                        setProductData({ ...productData, family: e.target.value });
                      }
                  }} style={{ appearance: "auto" }}>
                    <option value="SES">SES</option>
                    <option value="NanoCAD">NanoCAD</option>
                    <option value="Other">Other</option>
                  </select>
                  {!["SES", "NanoCAD"].includes(productData.family) && (
                      <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Enter custom family"
                          value={productData.family === "Other" ? "" : productData.family}
                          onChange={(e) => setProductData({ ...productData, family: e.target.value })}
                          style={{ marginTop: "0.5rem" }}
                          required
                      />
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="version">Version</label>
                  <input id="version" type="text" className="form-input" value={productData.version} onChange={(e) => setProductData({ ...productData, version: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="price">Price</label>
                  <input id="price" type="number" className="form-input" value={productData.price} onChange={(e) => setProductData({ ...productData, price: Number(e.target.value) })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="janDrozdId">JanDrozd ID</label>
                  <input id="janDrozdId" type="text" className="form-input" value={productData.janDrozdId} onChange={(e) => setProductData({ ...productData, janDrozdId: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="trialPeriod">Trial Period (days)</label>
                  <input id="trialPeriod" type="number" className="form-input" value={productData.trialPeriod} onChange={(e) => setProductData({ ...productData, trialPeriod: Number(e.target.value) })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="expiryDate">Expiry Date</label>
                  <input id="expiryDate" type="date" className="form-input" value={productData.expiryDate} onChange={(e) => setProductData({ ...productData, expiryDate: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="order">Display Order</label>
                  <input id="order" type="number" className="form-input" value={productData.order} onChange={(e) => setProductData({ ...productData, order: Number(e.target.value) })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="link">Link</label>
                  <input id="link" type="text" className="form-input" value={productData.link} onChange={(e) => setProductData({ ...productData, link: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={productData.allowTrial} onChange={(e) => setProductData({ ...productData, allowTrial: e.target.checked })} style={{ width: "16px", height: "16px" }} />
                  Allow Trial
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={productData.comingSoon} onChange={(e) => setProductData({ ...productData, comingSoon: e.target.checked })} style={{ width: "16px", height: "16px" }} />
                  Coming Soon
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={productData.hidden} onChange={(e) => setProductData({ ...productData, hidden: e.target.checked })} style={{ width: "16px", height: "16px" }} />
                  Hidden
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={productData.withTaxes} onChange={(e) => setProductData({ ...productData, withTaxes: e.target.checked })} style={{ width: "16px", height: "16px" }} />
                  With Taxes
                </label>
              </div>

            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="productForm" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
