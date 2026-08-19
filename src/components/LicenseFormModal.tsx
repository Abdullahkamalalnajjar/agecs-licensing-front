"use client";

import { useState, useEffect } from "react";
import { postApiLicenses, putApiLicensesById } from "@/client";
import { ProductDto } from "@/client/types.gen";

type LicenseFormModalProps = {
  isOpen: boolean;
  initialData?: any;
  products: ProductDto[];
  users: any[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function LicenseFormModal({ isOpen, initialData, products, users, onClose, onSuccess }: LicenseFormModalProps) {
  const isEditing = !!initialData;
  const [licenseData, setLicenseData] = useState({
    userId: "",
    name: "",
    email: "",
    productId: "",
    licenseCount: 1,
    migrationLimit: 1,
    expiryDate: "",
    serial: "",
    janDrozdId: "",
    isTrial: false,
    type: "Basic",
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [generatedLicense, setGeneratedLicense] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const topLevelProducts = products.filter(p => !p.parentProductId);

  const getVariants = (parentId: string) => {
    const parent = products.find(p => p.id === parentId);
    if (!parent) return [];
    if (parent.children && parent.children.length > 0) return parent.children;
    return products.filter(p => p.parentProductId === parentId);
  };

  const [selectedParentId, setSelectedParentId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setGeneratedLicense(null);
      setError("");
      setCopied(false);

      if (initialData) {
        setLicenseData({
          userId: initialData.userId || "",
          name: initialData.name || "",
          email: initialData.email || "",
          productId: initialData.productId || "",
          licenseCount: initialData.licenseCount || 1,
          migrationLimit: initialData.migrationLimit || 1,
          expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : "",
          serial: initialData.serial || "",
          janDrozdId: initialData.janDrozdId || "",
          isTrial: initialData.isTrial || false,
          type: initialData.type || "Basic",
        });

        // Determine parent vs child
        const directMatch = products.find(p => p.id === initialData.productId);
        if (directMatch && !directMatch.parentProductId) {
          setSelectedParentId(directMatch.id || "");
        } else if (directMatch && directMatch.parentProductId) {
          setSelectedParentId(directMatch.parentProductId);
        } else {
          for (const p of products) {
            if (p.children?.some(c => c.id === initialData.productId)) {
              setSelectedParentId(p.id || "");
              break;
            }
          }
        }
      } else {
        setLicenseData({
          userId: "",
          name: "",
          email: "",
          productId: "",
          licenseCount: 1,
          migrationLimit: 1,
          expiryDate: "",
          serial: "",
          janDrozdId: "",
          isTrial: false,
          type: "Basic",
        });
        setSelectedParentId("");
      }
    }
  }, [isOpen, initialData, products]);

  const availableVariants = selectedParentId ? getVariants(selectedParentId) : [];

  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    const variants = getVariants(parentId);
    let newVariantId = parentId;
    if (variants.length > 0) {
      newVariantId = variants[0].id || "";
    }
    setLicenseData(prev => ({ ...prev, productId: newVariantId }));
  };

  const handleVariantChange = (variantId: string) => {
    setLicenseData(prev => ({ ...prev, productId: variantId }));
  };

  const handleUserSelect = (userId: string) => {
    const selectedUser = users.find((u: any) => u.userId === userId || u.id === userId);
    setLicenseData(prev => ({
      ...prev,
      userId: userId,
      email: selectedUser ? (selectedUser.email || prev.email) : prev.email,
      name: selectedUser ? (selectedUser.userName || selectedUser.name || prev.name) : prev.name,
    }));
  };

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
        type: licenseData.type,
      };

      let response: any;
      if (isEditing) {
        response = await putApiLicensesById({ 
          path: { id: initialData.id }, 
          body: { id: initialData.id, ...payload } as any, 
          throwOnError: false 
        });

        if (response.data !== undefined && response.error === undefined) {
          onSuccess();
          onClose();
        } else if (response.error || response.data?.isError) {
          const errorMsg = response.error?.title || response.error?.detail || response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to update license.";
          setError(errorMsg);
        }
      } else {
        response = await postApiLicenses({ body: payload, throwOnError: false });

        if (response.data !== undefined && response.error === undefined) {
          const licenseObj = response.data?.value || response.data;
          setGeneratedLicense(licenseObj);
        } else if (response.error || response.data?.isError) {
          const errorMsg = response.error?.title || response.error?.detail || response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to create license.";
          setError(errorMsg);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the license.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (generatedLicense) {
      onSuccess();
    }
    setGeneratedLicense(null);
    onClose();
  };

  if (!isOpen) return null;

  const getProductName = (prodId?: string) => {
    if (!prodId) return "";
    const p = products.find(prod => prod.id === prodId);
    if (p) return p.name || "";
    for (const prod of products) {
      const child = prod.children?.find(c => c.id === prodId);
      if (child) return `${prod.name} - ${child.name}`;
    }
    return "";
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) handleClose(); }}>
      <div className="modal-container medium" style={{ maxWidth: generatedLicense ? 560 : 620, overflow: "hidden" }}>
        
        {/* ── HEADER ─────────────────────────── */}
        <div className="modal-header" style={{
          background: "linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)",
          padding: "1.25rem 1.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--radius-md)",
              background: generatedLicense ? "var(--success-dim)" : "var(--accent-dim)",
              color: generatedLicense ? "var(--success)" : "var(--accent-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {generatedLicense ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              )}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                {generatedLicense ? "License Generated Successfully" : isEditing ? "Edit License" : "Generate AGECS Serial"}
              </h2>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {generatedLicense ? "License key is active and ready to use" : isEditing ? "Update license configuration" : "Create and assign a new product serial"}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={handleClose} disabled={saving}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* ── SUCCESS VIEW ────────────────────── */}
        {generatedLicense ? (
          <div className="modal-body" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* Client Card */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem 1.25rem",
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: `hsl(${((generatedLicense.name || "C").charCodeAt(0) * 7) % 360}, 65%, 40%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#ffffff", fontWeight: 700, fontSize: "1.1rem",
                flexShrink: 0,
              }}>
                {(generatedLicense.name || generatedLicense.email || "C").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Serial Generated For
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {generatedLicense.name || "Client"}
                </div>
                {generatedLicense.email && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {generatedLicense.email}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                <span className="badge badge-success">Active</span>
                {generatedLicense.isTrial && <span className="badge badge-warning">Trial</span>}
              </div>
            </div>

            {/* Serial Number Display Box */}
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--accent-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.25rem",
              position: "relative",
              boxShadow: "0 4px 20px var(--accent-glow)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Serial Key
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Click copy to clipboard
                </span>
              </div>
              <div style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1rem",
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "0.06em",
                wordBreak: "break-all",
                textAlign: "center",
                userSelect: "all",
              }}>
                {generatedLicense.serial || "N/A"}
              </div>
            </div>

            {/* Details Summary Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.2rem" }}>
                  {generatedLicense.productName || getProductName(generatedLicense.productId) || "Standard"}
                </div>
              </div>

              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>License Type</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.2rem", textTransform: "capitalize" }}>
                  {generatedLicense.type || (generatedLicense.isTrial ? "Trial" : "Basic")}
                </div>
              </div>

              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expiry</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: generatedLicense.expiryDate ? "var(--text-primary)" : "var(--success)", marginTop: "0.2rem" }}>
                  {generatedLicense.expiryDate ? new Date(generatedLicense.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Lifetime"}
                </div>
              </div>

              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Seats / Migrations</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.2rem" }}>
                  {generatedLicense.licenseCount ?? 1} Seat{(generatedLicense.licenseCount ?? 1) !== 1 ? "s" : ""} • {generatedLicense.migrationLimit ?? 1} Mig.
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn-primary"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.25rem",
                }}
                onClick={() => {
                  navigator.clipboard.writeText(generatedLicense.serial || "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Serial Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy Serial Key</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-ghost"
                style={{ minWidth: 100, padding: "0.75rem 1.25rem" }}
                onClick={handleClose}
              >
                Done
              </button>
            </div>

          </div>
        ) : (
          /* ── FORM VIEW ───────────────────────── */
          <>
            <div className="modal-body" style={{ padding: "1.75rem" }}>
              {error && (
                <div className="alert-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              
              <form id="licenseForm" onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  
                  {/* User Selection */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="userId" className="form-label">Select User Account</label>
                    <select
                      id="userId"
                      className="form-input"
                      value={licenseData.userId}
                      onChange={(e) => handleUserSelect(e.target.value)}
                      style={{ appearance: "auto" }}
                    >
                      <option value="">Choose an existing user (optional)...</option>
                      {users.map((u: any) => (
                        <option key={u.userId || u.id} value={u.userId || u.id}>
                          {u.email} {u.userName ? `(${u.userName})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name & Email */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="name" className="form-label">Client Name *</label>
                      <input
                        id="name"
                        type="text"
                        className="form-input"
                        placeholder="e.g. John Doe"
                        value={licenseData.name}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="email" className="form-label">Client Email</label>
                      <input
                        id="email"
                        type="email"
                        className="form-input"
                        placeholder="user@example.com"
                        value={licenseData.email}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Product & Variant */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="parentProductId" className="form-label">Product *</label>
                      <select 
                        id="parentProductId" 
                        className="form-input" 
                        value={selectedParentId} 
                        onChange={(e) => handleParentChange(e.target.value)} 
                        required 
                        style={{ appearance: "auto" }}
                      >
                        <option value="">Select a product...</option>
                        {topLevelProducts.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} {p.version ? `(${p.version})` : ""}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="variantId" className="form-label">Variant</label>
                      <select 
                        id="variantId" 
                        className="form-input" 
                        value={licenseData.productId} 
                        onChange={(e) => handleVariantChange(e.target.value)} 
                        style={{ appearance: "auto" }}
                        disabled={!selectedParentId || availableVariants.length === 0}
                      >
                        {availableVariants.length === 0 ? (
                          <option value={selectedParentId || ""}>Parent product (no variant)</option>
                        ) : (
                          availableVariants.map((v: any) => (
                            <option key={v.id} value={v.id}>{v.name} {v.version ? `(${v.version})` : ""}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {/* License Count & Migration Limit */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="licenseCount" className="form-label">License Count (Seats) *</label>
                      <input
                        id="licenseCount"
                        type="number"
                        min="1"
                        className="form-input"
                        value={licenseData.licenseCount}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, licenseCount: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="migrationLimit" className="form-label">Migration Limit *</label>
                      <input
                        id="migrationLimit"
                        type="number"
                        min="0"
                        className="form-input"
                        value={licenseData.migrationLimit}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, migrationLimit: Number(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>

                  {/* Type & Expiry */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="type" className="form-label">Type</label>
                      <select
                        id="type"
                        className="form-input"
                        value={licenseData.type}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, type: e.target.value }))}
                        style={{ appearance: "auto" }}
                      >
                        <option value="Basic">Basic</option>
                        <option value="All">All</option>
                        <option value="Edu">Edu</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="expiryDate" className="form-label">Expiry Date (Blank = Lifetime)</label>
                      <input
                        id="expiryDate"
                        type="date"
                        className="form-input"
                        value={licenseData.expiryDate}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Custom Serial & JanDrozd ID */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="serial" className="form-label">Custom Serial (Optional)</label>
                      <input
                        id="serial"
                        type="text"
                        className="form-input"
                        value={licenseData.serial}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, serial: e.target.value }))}
                        placeholder="Auto-generated if empty"
                        style={{ fontFamily: "var(--font-mono)" }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="janDrozdId" className="form-label">JanDrozd ID (Optional)</label>
                      <input
                        id="janDrozdId"
                        type="text"
                        className="form-input"
                        placeholder="External ID"
                        value={licenseData.janDrozdId}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, janDrozdId: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Trial Toggle */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    background: "var(--bg-elevated)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}>
                    <input
                      id="isTrialCheckbox"
                      type="checkbox"
                      checked={licenseData.isTrial}
                      onChange={(e) => setLicenseData(prev => ({ ...prev, isTrial: e.target.checked }))}
                      style={{ width: "18px", height: "18px", accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                    <label htmlFor="isTrialCheckbox" style={{ fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)", fontWeight: 500 }}>
                      Mark as Trial License (Evaluation / Demo)
                    </label>
                  </div>

                </div>
              </form>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={handleClose} disabled={saving}>
                Cancel
              </button>
              <button
                type="submit"
                form="licenseForm"
                className="btn-primary"
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {saving ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }}></span>
                    <span>Saving...</span>
                  </>
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span>Generate Serial</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
