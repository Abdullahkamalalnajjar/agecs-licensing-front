"use client";

import { useState } from "react";
import { ProductDto } from "@/client/types.gen";
import { postApiProductsByParentIdChildren } from "@/client";

type ChildProductsModalProps = {
  product: ProductDto;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ChildProductsModal({ product, onClose, onSuccess }: ChildProductsModalProps) {
  const [childrenList, setChildrenList] = useState<ProductDto[]>(product.children || []);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [newChild, setNewChild] = useState({
    name: "",
    family: product.family || "SES",
    price: 0,
    trialPeriod: 0
  });

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: newChild.name,
        fullName: newChild.name,
        family: newChild.family,
        parentProductId: product.id,
        allowTrial: false,
        trialPeriod: Number(newChild.trialPeriod) || 0,
        comingSoon: false,
        hidden: false,
        order: 0,
        withTaxes: true,
        prices: [
          {
            country: "II",
            price: Number(newChild.price) || 0,
            period: 1,
            active: true
          }
        ]
      };

      const response = await postApiProductsByParentIdChildren({
        path: { parentId: product.id! },
        body: payload as any,
        throwOnError: false
      });

      if (response.data?.isSuccess && response.data.value) {
        setChildrenList([...childrenList, response.data.value]);
        setIsAdding(false);
        setNewChild({ name: "", family: product.family || "SES", price: 0, trialPeriod: 0 });
        onSuccess();
      } else if (response.error || response.data?.isError) {
        const errorMsg = response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to add child product.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while adding child product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container wide">
        <div className="modal-header">
          <h2 className="modal-title">Child Products for {product.name}</h2>
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

          <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            {!isAdding && (
              <button className="btn-primary" onClick={() => setIsAdding(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Child Product
              </button>
            )}
          </div>

          {isAdding && (
            <div style={{ padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginBottom: "2rem", background: "var(--bg-elevated)" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>New Child Product</h3>
              <form onSubmit={handleAddChild}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Name</label>
                    <input required type="text" className="form-input" value={newChild.name} onChange={e => setNewChild({...newChild, name: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Family</label>
                    <select className="form-input" value={newChild.family} onChange={e => setNewChild({...newChild, family: e.target.value})} style={{ appearance: "auto" }}>
                      <option value="SES">SES</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Price</label>
                    <input type="number" className="form-input" value={newChild.price} onChange={e => setNewChild({...newChild, price: Number(e.target.value)})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Trial (days)</label>
                    <input type="number" className="form-input" value={newChild.trialPeriod} onChange={e => setNewChild({...newChild, trialPeriod: Number(e.target.value)})} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button type="button" className="btn-ghost" onClick={() => setIsAdding(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Adding..." : "Add"}</button>
                </div>
              </form>
            </div>
          )}

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Family</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {childrenList.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state" style={{ padding: "2rem" }}>
                        <p className="empty-state-sub">No child products found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  childrenList.map((child) => (
                    <tr key={child.id}>
                      <td className="fw-medium">{child.name}</td>
                      <td><span className="badge badge-neutral">{child.family}</span></td>
                      <td className="mono">${child.prices && child.prices.length > 0 ? child.prices[0].price : "0"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
