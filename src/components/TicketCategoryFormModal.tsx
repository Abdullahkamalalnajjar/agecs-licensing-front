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
        // We have to add id to payload according to UpdateTicketCategoryCommand
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
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ backgroundColor: "#ffffff", color: "#111827", width: "100%", maxWidth: "500px", padding: "24px", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>{isEditing ? "Edit Category" : "Add Category"}</h2>
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
              <input id="name" type="text" value={categoryData.name} onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })} required style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", color: "#111827" }} />
            </div>

            {isEditing && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="description" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Description</label>
                  <textarea id="description" value={categoryData.description} onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })} rows={3} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", resize: "vertical", color: "#111827" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="order" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Order (Priority)</label>
                  <input id="order" type="number" value={categoryData.order} onChange={(e) => setCategoryData({ ...categoryData, order: Number(e.target.value) })} required style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", color: "#111827" }} />
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: "16px", marginTop: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "#111827", cursor: "pointer", fontWeight: "500" }}>
                <input type="checkbox" checked={categoryData.isActive} onChange={(e) => setCategoryData({ ...categoryData, isActive: e.target.checked })} style={{ width: "16px", height: "16px", borderRadius: "4px", accentColor: "#10b981" }} /> Active
              </label>
            </div>

          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", color: "#111827", fontSize: "0.875rem", fontWeight: "600" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: "10px 20px", background: "#10b981", border: "none", borderRadius: "8px", cursor: "pointer", color: "#ffffff", fontSize: "0.875rem", fontWeight: "600" }}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
