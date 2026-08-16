"use client";

import { useState } from "react";
import { postApiTicketCategories, putApiTicketCategoriesById } from "@/client";

type TicketCategoryFormModalProps = {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
};

export default function TicketCategoryFormModal({ initialData, onClose, onSuccess }: TicketCategoryFormModalProps) {
  const isEditing = !!initialData;
  const [categoryData, setCategoryData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    order: initialData?.order || 0,
    isActive: initialData?.isActive ?? true,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: categoryData.name,
        description: categoryData.description || undefined,
        order: Number(categoryData.order),
        isActive: categoryData.isActive,
      };

      let response;
      if (isEditing) {
        response = await putApiTicketCategoriesById({ 
          path: { id: initialData.id }, 
          body: { id: initialData.id, ...payload }, 
          throwOnError: false 
        });
      } else {
        response = await postApiTicketCategories({ body: payload, throwOnError: false });
      }

      if (response.data !== undefined && response.error === undefined) {
        onSuccess();
      } else if (response.error) {
        // @ts-ignore
        const errorMsg = response.error?.title || response.error?.detail || "Failed to save category.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? "Edit Category" : "Add Category"}</h2>
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
          
          <form id="categoryForm" onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="name" className="form-label">Name</label>
                <input id="name" type="text" className="form-input" value={categoryData.name} onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })} required />
              </div>

              {isEditing && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea id="description" className="form-input" value={categoryData.description} onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })} rows={3} style={{ resize: "vertical" }} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="order" className="form-label">Order (Priority)</label>
                    <input id="order" type="number" className="form-input" value={categoryData.order} onChange={(e) => setCategoryData({ ...categoryData, order: Number(e.target.value) })} required />
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={categoryData.isActive} onChange={(e) => setCategoryData({ ...categoryData, isActive: e.target.checked })} style={{ width: "16px", height: "16px" }} />
                  Active
                </label>
              </div>

            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="categoryForm" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </div>
    </div>
  );
}
