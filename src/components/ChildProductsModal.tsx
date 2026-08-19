"use client";

import { useState } from "react";
import { ProductDto } from "@/client/types.gen";
import { postApiProductsByParentIdChildren, putApiProductsById, deleteApiProductsById } from "@/client";

type ChildProductsModalProps = {
  product: ProductDto;
  onClose: () => void;
  onSuccess: () => void;
  onOpenFeatures: (product: ProductDto) => void;
};

export default function ChildProductsModal({ product, onClose, onSuccess, onOpenFeatures }: ChildProductsModalProps) {
  const [childrenList, setChildrenList] = useState<ProductDto[]>(product.children || []);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [newChild, setNewChild] = useState({
    id: "",
    name: "",
    fullName: "",
    janDrozdId: ""
  });

  const handleEditClick = (child: ProductDto) => {
    setNewChild({
      id: child.id || "",
      name: child.name || "",
      fullName: child.fullName || "",
      janDrozdId: child.janDrozdId || ""
    });
    setIsAddingChild(true);
    setError("");
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;
    setLoading(true);
    setError("");
    try {
      const response = await deleteApiProductsById({ path: { id: childId }, throwOnError: false });
      if (response.data?.isSuccess) {
        setChildrenList(childrenList.filter(c => c.id !== childId));
        onSuccess();
      } else {
        const errorMsg = response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to delete variant.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting variant.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: newChild.name,
        fullName: newChild.fullName,
        janDrozdId: newChild.janDrozdId,
        family: product.family || "SES", 
        parentProductId: product.id,
        allowTrial: false,
        trialPeriod: 0,
        comingSoon: false,
        hidden: false,
        order: 0,
        withTaxes: true,
        prices: [{ country: "II", price: 0, period: 1, active: true }]
      };

      let response;
      if (newChild.id) {
        response = await putApiProductsById({
          path: { id: newChild.id },
          body: { ...payload, id: newChild.id } as any,
          throwOnError: false
        });
      } else {
        response = await postApiProductsByParentIdChildren({
          path: { parentId: product.id! },
          body: payload as any,
          throwOnError: false
        });
      }

      if (response?.data?.isSuccess && response.data.value) {
        if (newChild.id) {
          setChildrenList(childrenList.map(c => c.id === newChild.id ? response.data!.value! : c));
        } else {
          setChildrenList([...childrenList, response.data!.value!]);
        }
        setIsAddingChild(false);
        setNewChild({ id: "", name: "", fullName: "", janDrozdId: "" });
        onSuccess();
      } else if (response?.error || response?.data?.isError) {
        const errorMsg = response?.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to save variant.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving variant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container wide">
        <div className="modal-header">
          <h2 className="modal-title">
            Product Variants
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: "normal", marginTop: "0.25rem" }}>
              {product.fullName || product.name}
            </div>
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div className="alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", margin: 0, color: "var(--text-secondary)" }}>VARIANTS</h3>
              {!isAddingChild && (
                <button className="btn-primary" onClick={() => { setNewChild({ id: "", name: "", fullName: "", janDrozdId: "" }); setIsAddingChild(true); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Variant
                </button>
              )}
            </div>

            {isAddingChild && (
              <div style={{ padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginBottom: "1rem", background: "var(--bg-elevated)" }}>
                <form onSubmit={handleAddChild}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Name</label>
                      <input required type="text" className="form-input" placeholder="e.g. BASIC" value={newChild.name} onChange={e => setNewChild({...newChild, name: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Full Name</label>
                      <input type="text" className="form-input" placeholder="e.g. AGECS_RCD_BASIC" value={newChild.fullName} onChange={e => setNewChild({...newChild, fullName: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>JanDrozd ID</label>
                      <input type="text" className="form-input" placeholder="e.g. 11" value={newChild.janDrozdId} onChange={e => setNewChild({...newChild, janDrozdId: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button type="button" className="btn-ghost" onClick={() => { setIsAddingChild(false); setNewChild({ id: "", name: "", fullName: "", janDrozdId: "" }); }}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                      {loading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="data-table-wrapper" style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                  <tr>
                    <th style={{ width: "30%", padding: "0.875rem 1.25rem", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Name</th>
                    <th style={{ width: "40%", padding: "0.875rem 1.25rem", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Full Name</th>
                    <th style={{ width: "15%", padding: "0.875rem 1.25rem", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>JanDrozd ID</th>
                    <th style={{ width: "15%", padding: "0.875rem 1.25rem", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {childrenList.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "1rem" }}>
                        <div className="empty-state" style={{ padding: "2rem", textAlign: "center" }}>
                          <p className="empty-state-sub" style={{ margin: 0 }}>No variants found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    childrenList.map((child) => (
                      <tr key={child.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="fw-medium" style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", flexShrink: 0 }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                            {child.name}
                          </div>
                        </td>
                        <td style={{ color: "var(--text-secondary)", padding: "1rem 1.25rem" }}>{child.fullName || "—"}</td>
                        <td style={{ color: "var(--text-secondary)", padding: "1rem 1.25rem" }}>{child.janDrozdId || "—"}</td>
                        <td style={{ textAlign: "right", padding: "1rem 1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                            <button type="button" title="Edit Variant" onClick={() => handleEditClick(child)} style={{ padding: "0.25rem", color: "var(--text-secondary)", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button type="button" title="Delete Variant" onClick={() => handleDeleteChild(child.id!)} style={{ padding: "0.25rem", color: "var(--danger)", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        <div className="modal-footer" style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
