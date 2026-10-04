"use client";

import { useState } from "react";
import { postApiProducts, putApiProductsById } from "@/client";
import CatalogSelect from "./CatalogSelect";
import "./product-form.css";

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
    familyId: initialData?.familyId || "",
    description: initialData?.description || "",
    miniDescription: initialData?.miniDescription || "",
    storagePath: initialData?.storagePath || "",
    parentProductId: initialData?.parentProductId || "",
    comingSoon: initialData?.comingSoon || false,
    hidden: initialData?.hidden || false,
    withTaxes: initialData?.withTaxes ?? true,
    version: initialData?.version || "",
    janDrozdId: initialData?.janDrozdId || "",
    companyId: initialData?.companyId || "",
  });

  const [prices, setPrices] = useState<{ id?: string, period: number, price: number, country: string, active: boolean }[]>(
    initialData?.prices && initialData.prices.length > 0 
      ? initialData.prices.map((p: any) => ({ id: p.id, period: p.period || 1, price: p.price || 0, country: p.country || "II", active: p.active ?? true }))
      : [{ period: 1, price: 0, country: "II", active: true }]
  );
  
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
        prices: prices.map(p => ({
          id: p.id,
          country: p.country,
          price: Number(p.price) || 0,
          period: Number(p.period) || 1,
          active: p.active
        }))
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
            <div className="pf-body">

              <div className="pf-section">
                <div className="pf-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
                  Details
                </div>

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

                <div className="pf-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="family">Family</label>
                    <CatalogSelect kind="family" id="family" value={productData.familyId} onChange={(familyId) => setProductData({ ...productData, familyId })} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="version">Version</label>
                    <input id="version" type="text" className="form-input" value={productData.version} onChange={(e) => setProductData({ ...productData, version: e.target.value })} />
                  </div>
                </div>

                <div className="pf-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="janDrozdId">JanDrozd ID</label>
                    <input id="janDrozdId" type="text" className="form-input" value={productData.janDrozdId} onChange={(e) => setProductData({ ...productData, janDrozdId: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="company">Company</label>
                    <CatalogSelect kind="company" id="company" value={productData.companyId} onChange={(companyId) => setProductData({ ...productData, companyId })} required />
                  </div>
                </div>
              </div>

              <hr className="pf-divider" />

              <div className="pf-section">
                <div className="pf-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Pricing Tiers
                </div>

                <div className="pf-prices">
                  <div className="pf-prices-header">
                    <span className="pf-field-hint">{prices.length === 0 ? "Free product — no charges apply" : `${prices.length} tier${prices.length !== 1 ? "s" : ""} configured`}</span>
                    <button type="button" className="btn-ghost pf-add-price" onClick={() => setPrices([...prices, { period: 1, price: 0, country: "II", active: true }])}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add Price
                    </button>
                  </div>

                  {prices.length === 0 && <div className="pf-prices-empty">No prices added. Free product.</div>}

                  <div className="pf-prices-list">
                    {prices.map((priceObj, index) => (
                      <div key={index} className="pf-price-row">
                        <div>
                          <label>Period (days)</label>
                          <input type="number" className="form-input" value={priceObj.period} onChange={(e) => {
                            const newPrices = [...prices];
                            newPrices[index].period = Number(e.target.value);
                            setPrices(newPrices);
                          }} />
                        </div>
                        <div>
                          <label>Country</label>
                          <select className="form-input" style={{ appearance: "auto" }} value={priceObj.country} onChange={(e) => {
                            const newPrices = [...prices];
                            newPrices[index].country = e.target.value;
                            setPrices(newPrices);
                          }}>
                            <option value="EG">🇪🇬 EGP (مصر)</option>
                            <option value="US">🇺🇸 USD (أمريكا)</option>
                            <option value="SA">🇸🇦 SAR (السعودية)</option>
                            <option value="II">🌐 Default (دولي)</option>
                          </select>
                        </div>
                        <div>
                          <label>Price ($)</label>
                          <input type="number" className="form-input" value={priceObj.price} onChange={(e) => {
                            const newPrices = [...prices];
                            newPrices[index].price = Number(e.target.value);
                            setPrices(newPrices);
                          }} />
                        </div>
                        <div className="pf-price-remove-cell">
                          <button type="button" className="pf-price-remove" onClick={() => setPrices(prices.filter((_, i) => i !== index))} aria-label="Remove price tier">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="pf-divider" />

              <div className="pf-section">
                <div className="pf-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Settings
                </div>

                <div className="pf-toggles">
                  <label className="pf-toggle">
                    <span className="pf-toggle-switch">
                      <input type="checkbox" checked={productData.comingSoon} onChange={(e) => setProductData({ ...productData, comingSoon: e.target.checked })} />
                      <span className="pf-toggle-track" />
                    </span>
                    <span className="pf-toggle-label">Coming Soon</span>
                  </label>
                  <label className="pf-toggle">
                    <span className="pf-toggle-switch">
                      <input type="checkbox" checked={productData.hidden} onChange={(e) => setProductData({ ...productData, hidden: e.target.checked })} />
                      <span className="pf-toggle-track" />
                    </span>
                    <span className="pf-toggle-label">Hidden</span>
                  </label>
                  <label className="pf-toggle">
                    <span className="pf-toggle-switch">
                      <input type="checkbox" checked={productData.withTaxes} onChange={(e) => setProductData({ ...productData, withTaxes: e.target.checked })} />
                      <span className="pf-toggle-track" />
                    </span>
                    <span className="pf-toggle-label">With Taxes</span>
                  </label>
                </div>
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
