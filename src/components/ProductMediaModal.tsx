"use client";

import { useState } from "react";
import { postApiProductsByProductIdMedia, deleteApiProductsByProductIdMediaByMediaId } from "@/client";
import { ProductDto } from "@/client/types.gen";

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

  const handleAddUrl = async (e: React.FormEvent) => {
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
        // Reset file input
        const fileInput = document.getElementById("mediaFile") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        onSuccess(); // triggers parent refresh
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
        onSuccess(); // triggers parent refresh
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

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ backgroundColor: "#ffffff", color: "#111827", width: "100%", maxWidth: "500px", padding: "24px", borderRadius: "12px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>Media for {product.name}</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "#6b7280", lineHeight: 1 }}>&times;</button>
        </div>

        {error && (
          <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <form onSubmit={handleAddUrl} style={{ display: "flex", gap: "8px" }}>
            <input 
              id="mediaFile"
              type="file" 
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
              required 
              style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none" }} 
            />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: "500" }}>Order:</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                style={{ width: "60px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none" }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !selectedFile} 
              style={{ padding: "8px 16px", background: "#f97316", border: "none", borderRadius: "6px", color: "white", fontSize: "0.875rem", fontWeight: "600", cursor: loading || !selectedFile ? "not-allowed" : "pointer", opacity: loading || !selectedFile ? 0.7 : 1 }}
            >
              Upload File
            </button>
          </form>
        </div>

        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "12px" }}>Existing Media</h3>
          {mediaList.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No media items added yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {mediaList.map((media) => {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";
                const fullUrl = media.url?.startsWith("http") ? media.url : `${apiUrl}${media.url?.startsWith("/") ? "" : "/"}${media.url}`;
                return (
                <li key={media.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                    <div style={{ width: "40px", height: "40px", backgroundColor: "#e5e7eb", borderRadius: "4px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={fullUrl} alt="Media Thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as any).style.display = 'none'; }} />
                    </div>
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontSize: "0.875rem", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "250px" }}>
                      {media.url}
                    </a>
                  </div>
                  <button 
                    onClick={() => handleDelete(media.id!)}
                    disabled={loading}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: "500", opacity: loading ? 0.5 : 1 }}
                  >
                    Delete
                  </button>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
