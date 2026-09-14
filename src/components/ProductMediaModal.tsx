"use client";

import { useState } from "react";
import { 
  postApiProductsByProductIdMedia, 
  deleteApiProductsByProductIdMediaByMediaId, 
  putApiProductsByProductIdMediaByMediaId 
} from "@/client";
import { ProductDto } from "@/client/types.gen";
import { resolveMediaUrl } from "@/lib/mediaUrl";

type ProductMediaModalProps = {
  product: ProductDto;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ProductMediaModal({ product, onClose, onSuccess }: ProductMediaModalProps) {
  const [mediaList, setMediaList] = useState(product.media || []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [order, setOrder] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Edit State
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editOrder, setEditOrder] = useState<number>(0);

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setError("");

    try {
      const response = await postApiProductsByProductIdMedia({
        path: { productId: product.id! },
        body: { File: selectedFile, Order: order },
        throwOnError: false
      });

      if (response.data?.isSuccess && response.data.value) {
        setMediaList([...mediaList, response.data.value]);
        setSelectedFile(null);
        const fileInput = document.getElementById("mediaFile") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        onSuccess();
      } else if (response.error || response.data?.isError) {
        const errorMsg = response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to add media.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while adding media.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await deleteApiProductsByProductIdMediaByMediaId({
        path: { productId: product.id!, mediaId: mediaId },
        throwOnError: false
      });

      if (response.data?.isSuccess) {
        setMediaList(mediaList.filter(m => m.id !== mediaId));
        onSuccess();
      } else if (response.error || response.data?.isError) {
        const errorMsg = response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to delete media.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting media.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (media: any) => {
    setEditingMediaId(media.id);
    setEditOrder(media.order || 0);
    setEditFile(null);
  };

  const cancelEdit = () => {
    setEditingMediaId(null);
    setEditFile(null);
    setEditOrder(0);
  };

  const handleUpdate = async (mediaId: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await putApiProductsByProductIdMediaByMediaId({
        path: { productId: product.id!, mediaId: mediaId },
        body: { File: editFile ?? undefined, Order: editOrder },
        throwOnError: false
      });

      if (response.data?.isSuccess) {
        // تحديث العنصر في القائمة دون إعادة تحميل البيانات بالكامل لتجربة مستخدم أسرع
        setMediaList(mediaList.map(m => m.id === mediaId ? { 
          ...m, 
          order: editOrder, 
          url: editFile && response.data?.value ? (response.data.value as any).url || m.url : m.url 
        } : m));
        cancelEdit();
        onSuccess();
      } else if (response.error || response.data?.isError) {
        const errorMsg = response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to update media.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating media.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">Media for {product.name}</h2>
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

          <div style={{ marginBottom: "2rem" }}>
            <form onSubmit={handleAddMedia} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="form-label" htmlFor="mediaFile">Upload File</label>
                <input 
                  id="mediaFile"
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                  required 
                  className="form-input"
                  style={{ padding: "0.5rem" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, width: "100px" }}>
                <label className="form-label">Order</label>
                <input
                  type="number"
                  className="form-input"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading || !selectedFile} 
                style={{ height: "42px", opacity: loading || !selectedFile ? 0.6 : 1 }}
              >
                {loading ? "Adding..." : "Upload"}
              </button>
            </form>
          </div>

          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Existing Media</h3>
            {mediaList.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <p className="empty-state-sub">No media items added yet.</p>
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {mediaList.sort((a, b) => (a.order || 0) - (b.order || 0)).map((media) => {
                  const fullUrl = resolveMediaUrl(media.url);
                  const isEditing = editingMediaId === media.id;

                  return (
                    <li key={media.id} style={{ display: "flex", flexDirection: isEditing ? "column" : "row", justifyContent: "space-between", alignItems: isEditing ? "stretch" : "center", padding: "0.75rem 1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", gap: "1rem" }}>
                      
                      {isEditing ? (
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
                            <label className="form-label">Replace File (Optional)</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => setEditFile(e.target.files?.[0] || null)} 
                              className="form-input"
                              style={{ padding: "0.5rem" }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0, width: "100px" }}>
                            <label className="form-label">Order</label>
                            <input
                              type="number"
                              className="form-input"
                              value={editOrder}
                              onChange={(e) => setEditOrder(Number(e.target.value))}
                            />
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button 
                              type="button"
                              onClick={() => handleUpdate(media.id!)}
                              disabled={loading}
                              className="btn-primary"
                              style={{ height: "42px", padding: "0 1rem" }}
                            >
                              Save
                            </button>
                            <button 
                              type="button"
                              onClick={cancelEdit}
                              disabled={loading}
                              className="btn-ghost"
                              style={{ height: "42px", padding: "0 1rem" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem", overflow: "hidden" }}>
                            <a href={fullUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none" }} title="Click to view full image">
                              <div style={{ width: "40px", height: "40px", background: "var(--bg-hover)", borderRadius: "var(--radius-sm)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                                <img src={fullUrl} alt="Media Thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as any).style.display = 'none'; }} />
                              </div>
                            </a>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                              Order: {media.order || 0}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button 
                              onClick={() => startEdit(media)}
                              disabled={loading}
                              className="btn-ghost"
                              style={{ padding: "0.3rem 0.6rem" }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(media.id!)}
                              disabled={loading}
                              className="btn-danger-ghost"
                              style={{ padding: "0.3rem 0.6rem" }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
