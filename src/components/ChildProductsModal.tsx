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
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ backgroundColor: "#ffffff", color: "#111827", width: "100%", maxWidth: "700px", padding: "24px", borderRadius: "12px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>Child Products for {product.name}</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "#6b7280", lineHeight: 1 }}>&times;</button>
        </div>

        {error && (
          <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end" }}>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)} 
              style={{ padding: "8px 16px", background: "#0ea5e9", border: "none", borderRadius: "6px", color: "white", fontSize: "0.875rem", fontWeight: "600", cursor: "pointer" }}
            >
              + Add Child Product
            </button>
          )}
        </div>

        {isAdding && (
          <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "24px", backgroundColor: "#f9fafb" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: "600" }}>New Child Product</h3>
            <form onSubmit={handleAddChild}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500" }}>Name</label>
                  <input required type="text" value={newChild.name} onChange={e => setNewChild({...newChild, name: e.target.value})} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500" }}>Family</label>
                  <select value={newChild.family} onChange={e => setNewChild({...newChild, family: e.target.value})} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}>
                    <option value="SES">SES</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500" }}>Price</label>
                  <input type="number" value={newChild.price} onChange={e => setNewChild({...newChild, price: Number(e.target.value)})} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500" }}>Trial Period (days)</label>
                  <input type="number" value={newChild.trialPeriod} onChange={e => setNewChild({...newChild, trialPeriod: Number(e.target.value)})} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" onClick={() => setIsAdding(false)} style={{ padding: "6px 12px", background: "white", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: "6px 12px", background: "#f97316", color: "white", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Adding..." : "Add"}</button>
              </div>
            </form>
          </div>
        )}

        <div className="data-table-wrapper" style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", fontSize: "0.875rem", color: "#6b7280" }}>Name</th>
                <th style={{ padding: "12px 8px", fontSize: "0.875rem", color: "#6b7280" }}>Family</th>
                <th style={{ padding: "12px 8px", fontSize: "0.875rem", color: "#6b7280" }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {childrenList.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "#6b7280", fontSize: "0.875rem" }}>No child products found.</td>
                </tr>
              ) : (
                childrenList.map(child => (
                  <tr key={child.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px 8px", fontSize: "0.875rem", fontWeight: "500" }}>{child.name}</td>
                    <td style={{ padding: "12px 8px", fontSize: "0.875rem" }}>{child.family}</td>
                    <td style={{ padding: "12px 8px", fontSize: "0.875rem" }}>
                      ${child.prices && child.prices.length > 0 ? (child.prices[0].price || 0).toFixed(2) : "0.00"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
