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
      <div className="modal-container wide" style={{ maxWidth: "860px" }}>
        {/* Header */}
        <div className="modal-header" style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "var(--accent-dim)", color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <div>
              <h2 className="modal-title" style={{ margin: 0, fontSize: "1.15rem" }}>Product Variants</h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "2px" }}>
                {product.fullName || product.name}
              </div>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="modal-body" style={{ padding: "1.5rem 2rem", maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div className="alert-error" style={{ marginBottom: "1.25rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Add Variant Button */}
          {!isAddingChild && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
              <button className="btn-primary" style={{ padding: "0.55rem 1.1rem", fontSize: "0.85rem" }} onClick={() => { setNewChild({ id: "", name: "", fullName: "", janDrozdId: "" }); setIsAddingChild(true); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Variant
              </button>
            </div>
          )}

          {/* Add/Edit Form */}
          {isAddingChild && (
            <div style={{
              padding: "1.5rem", border: "1px solid var(--accent-border)",
              borderRadius: "var(--radius-lg)", marginBottom: "1.25rem",
              background: "var(--accent-dim)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--accent)" }}>
                  {newChild.id ? "Edit Variant" : "New Variant"}
                </span>
              </div>
              <form onSubmit={handleAddChild}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem", marginBottom: "1.25rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.72rem" }}>Name</label>
                    <input required type="text" className="form-input" placeholder="e.g. BASIC" value={newChild.name} onChange={e => setNewChild({...newChild, name: e.target.value})} style={{ fontSize: "0.85rem", padding: "0.6rem 0.85rem" }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.72rem" }}>Full Name</label>
                    <input type="text" className="form-input" placeholder="e.g. AGECS_RCD_BASIC" value={newChild.fullName} onChange={e => setNewChild({...newChild, fullName: e.target.value})} style={{ fontSize: "0.85rem", padding: "0.6rem 0.85rem" }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.72rem" }}>JanDrozd ID</label>
                    <input type="text" className="form-input" placeholder="e.g. 11" value={newChild.janDrozdId} onChange={e => setNewChild({...newChild, janDrozdId: e.target.value})} style={{ fontSize: "0.85rem", padding: "0.6rem 0.85rem" }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button type="button" className="btn-ghost" style={{ fontSize: "0.85rem" }} onClick={() => { setIsAddingChild(false); setNewChild({ id: "", name: "", fullName: "", janDrozdId: "" }); }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {loading ? (
                      <><span className="spinner" style={{ width: 14, height: 14 }}></span> Saving...</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Variants as Cards */}
          {childrenList.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "3rem 2rem",
              background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--border)",
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: "0.75rem" }}><path d="M6 9l6 6 6-6"/></svg>
              <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>No variants found. Add your first variant above.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {childrenList.map((child, index) => (
                <div key={child.id} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "1rem 1.25rem",
                  background: "var(--bg-elevated)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-border)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
                >
                  {/* Index Badge */}
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: "var(--accent-dim)", color: "var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>{child.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.2rem" }}>
                      {child.fullName && (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{child.fullName}</span>
                      )}
                      {child.janDrozdId && (
                        <span style={{
                          fontSize: "0.7rem", fontFamily: "var(--font-mono)",
                          background: "var(--bg-surface)", padding: "0.15rem 0.4rem",
                          borderRadius: "4px", border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                        }}>
                          ID: {child.janDrozdId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                    <button type="button" title="Edit Variant" onClick={() => handleEditClick(child)} style={{
                      width: "32px", height: "32px", borderRadius: "8px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "transparent", border: "1px solid transparent",
                      color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-dim)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent-border)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "transparent"; }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button type="button" title="Delete Variant" onClick={() => handleDeleteChild(child.id!)} style={{
                      width: "32px", height: "32px", borderRadius: "8px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "transparent", border: "1px solid transparent",
                      color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-dim)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "transparent"; }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
        <div className="modal-footer" style={{ padding: "1rem 2rem" }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
