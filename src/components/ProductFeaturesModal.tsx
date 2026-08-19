"use client";

import { useState } from "react";
import { ProductDto, ProductFeatureDto } from "@/client/types.gen";
import { 
  postApiProductsByProductIdFeatures,
  deleteApiProductsByProductIdFeaturesByFeatureId 
} from "@/client";

type ProductFeaturesModalProps = {
  product: ProductDto;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ProductFeaturesModal({ product, onClose, onSuccess }: ProductFeaturesModalProps) {
  const [featuresList, setFeaturesList] = useState<ProductFeatureDto[]>(product.features || []);
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [newFeature, setNewFeature] = useState({
    featureName: "",
    featureType: "Allowed",
    janDrozdFeatureId: ""
  });

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await postApiProductsByProductIdFeatures({
        path: { productId: product.id! },
        body: {
          featureName: newFeature.featureName,
          featureType: newFeature.featureType,
          janDrozdFeatureId: newFeature.janDrozdFeatureId || undefined
        },
        throwOnError: false
      });

      if (response.data?.isSuccess && response.data.value) {
        setFeaturesList([...featuresList, response.data.value]);
        setIsAddingFeature(false);
        setNewFeature({ featureName: "", featureType: "Allowed", janDrozdFeatureId: "" });
        onSuccess();
      } else if (response.error || response.data?.isError) {
        const errorMsg = response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to add feature.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while adding feature.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm("Are you sure you want to delete this feature?")) return;
    setLoading(true);
    setError("");

    try {
      const response = await deleteApiProductsByProductIdFeaturesByFeatureId({
        path: { productId: product.id!, featureId },
        throwOnError: false
      });

      if (response.data?.isSuccess) {
        setFeaturesList(featuresList.filter(f => f.id !== featureId));
        onSuccess();
      } else {
        setError(response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to delete feature.");
      }
    } catch (err: any) {
      setError(err.message || "Error deleting feature.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container wide">
        <div className="modal-header">
          <h2 className="modal-title">
            Features for <span style={{ color: "var(--accent-light)" }}>{product.name}</span>
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div className="alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", margin: 0 }}>FEATURES</h3>
              {!isAddingFeature && (
                <button className="btn-primary" onClick={() => setIsAddingFeature(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Feature
                </button>
              )}
            </div>

            {isAddingFeature && (
              <div style={{ padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginBottom: "1rem", background: "var(--bg-elevated)" }}>
                <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: "600" }}>New Feature</h4>
                <form onSubmit={handleAddFeature}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Feature Name</label>
                      <input required type="text" className="form-input" value={newFeature.featureName} onChange={e => setNewFeature({...newFeature, featureName: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Type</label>
                      <select className="form-input" value={newFeature.featureType} onChange={e => setNewFeature({...newFeature, featureType: e.target.value})} style={{ appearance: "auto" }}>
                        <option value="Allowed">Allowed</option>
                        <option value="Denied">Denied</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">JanDrozd Feature ID</label>
                      <input type="text" className="form-input" value={newFeature.janDrozdFeatureId} onChange={e => setNewFeature({...newFeature, janDrozdFeatureId: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button type="button" className="btn-ghost" onClick={() => setIsAddingFeature(false)}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
                  </div>
                </form>
              </div>
            )}

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>JanDrozd ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {featuresList.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state" style={{ padding: "2rem" }}>
                          <p className="empty-state-sub">No features found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    featuresList.map((feat) => (
                      <tr key={feat.id}>
                        <td className="fw-medium">{feat.featureName}</td>
                        <td>
                          <span className={`badge ${feat.featureType === 'Allowed' ? 'badge-success' : 'badge-danger'}`}>
                            {feat.featureType}
                          </span>
                        </td>
                        <td className="mono">{feat.janDrozdFeatureId || "—"}</td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-danger-ghost" onClick={() => handleDeleteFeature(feat.id!)} disabled={loading}>
                              Delete
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

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
