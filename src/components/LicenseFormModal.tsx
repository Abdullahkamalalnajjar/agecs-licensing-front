"use client";

import { useState } from "react";
import { postApiLicenses, putApiLicensesById } from "@/client";
import { ProductDto } from "@/client/types.gen";

type LicenseFormModalProps = {
  initialData?: any;
  products: ProductDto[];
  users: any[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function LicenseFormModal({ initialData, products, users, onClose, onSuccess }: LicenseFormModalProps) {
  const isEditing = !!initialData;
  const [licenseData, setLicenseData] = useState({
    userId: initialData?.userId || "",
    name: initialData?.name || "",
    email: initialData?.email || "",
    productId: initialData?.productId || "",
    licenseCount: initialData?.licenseCount || 1,
    migrationLimit: initialData?.migrationLimit || 1,
    expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : "",
    serial: initialData?.serial || "",
    janDrozdId: initialData?.janDrozdId || "",
    isTrial: initialData?.isTrial || false,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        userId: licenseData.userId || undefined,
        name: licenseData.name || undefined,
        email: licenseData.email || undefined,
        productId: licenseData.productId || undefined,
        licenseCount: Number(licenseData.licenseCount) || 1,
        migrationLimit: Number(licenseData.migrationLimit) || 1,
        expiryDate: licenseData.expiryDate ? new Date(licenseData.expiryDate).toISOString() : undefined,
        serial: licenseData.serial || undefined,
        janDrozdId: licenseData.janDrozdId || undefined,
        isTrial: licenseData.isTrial,
      };

      let response;
      if (isEditing) {
        response = await putApiLicensesById({ 
          path: { id: initialData.id }, 
          body: { id: initialData.id, ...payload } as any, 
          throwOnError: false 
        });
      } else {
        response = await postApiLicenses({ body: payload, throwOnError: false });
      }

      if (response.data !== undefined && response.error === undefined) {
        onSuccess();
      } else if (response.error) {
        // @ts-ignore
        const errorMsg = response.error?.title || response.error?.detail || "Failed to save license.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the license.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? "Edit License" : "Create License"}</h2>
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
          
          <form id="licenseForm" onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="name" className="form-label">Client Name</label>
                  <input id="name" type="text" className="form-input" value={licenseData.name} onChange={(e) => setLicenseData({ ...licenseData, name: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="email" className="form-label">Client Email</label>
                  <input id="email" type="email" className="form-input" value={licenseData.email} onChange={(e) => setLicenseData({ ...licenseData, email: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="userId" className="form-label">User</label>
                <select id="userId" className="form-input" value={licenseData.userId} onChange={(e) => setLicenseData({ ...licenseData, userId: e.target.value })} required style={{ appearance: "auto" }}>
                  <option value="">Select a user...</option>
                  {users.map((u: any) => (
                    <option key={u.userId} value={u.userId}>{u.email}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="productId" className="form-label">Product</label>
                <select id="productId" className="form-input" value={licenseData.productId} onChange={(e) => setLicenseData({ ...licenseData, productId: e.target.value })} required style={{ appearance: "auto" }}>
                  <option value="">Select a product...</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} {p.version ? `(${p.version})` : ""}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="licenseCount" className="form-label">License Count</label>
                  <input id="licenseCount" type="number" min="1" className="form-input" value={licenseData.licenseCount} onChange={(e) => setLicenseData({ ...licenseData, licenseCount: Number(e.target.value) })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="migrationLimit" className="form-label">Migration Limit</label>
                  <input id="migrationLimit" type="number" min="0" className="form-input" value={licenseData.migrationLimit} onChange={(e) => setLicenseData({ ...licenseData, migrationLimit: Number(e.target.value) })} required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
                  <input id="expiryDate" type="date" className="form-input" value={licenseData.expiryDate} onChange={(e) => setLicenseData({ ...licenseData, expiryDate: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="janDrozdId" className="form-label">JanDrozd ID</label>
                  <input id="janDrozdId" type="text" className="form-input" value={licenseData.janDrozdId} onChange={(e) => setLicenseData({ ...licenseData, janDrozdId: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="serial" className="form-label">Custom Serial (Optional)</label>
                <input id="serial" type="text" className="form-input" value={licenseData.serial} onChange={(e) => setLicenseData({ ...licenseData, serial: e.target.value })} placeholder="Auto-generated if left empty" style={{ fontFamily: "var(--font-mono)" }} />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={licenseData.isTrial} onChange={(e) => setLicenseData({ ...licenseData, isTrial: e.target.checked })} style={{ width: "16px", height: "16px" }} />
                  Is Trial License
                </label>
              </div>

            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="licenseForm" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Create License"}
          </button>
        </div>
      </div>
    </div>
  );
}
