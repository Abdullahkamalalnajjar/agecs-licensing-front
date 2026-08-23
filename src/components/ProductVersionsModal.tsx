"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getApiProductsByIdVersions, 
  postApiProductsByIdVersions, 
  putApiProductsByProductIdVersionsByVersionIdToggleStatus, 
  deleteApiProductsByProductIdVersionsByVersionId 
} from "@/client";
import { client } from "@/client/client.gen";
import { ProductDto, ProductVersionDto } from "@/client/types.gen";
import { resolveMediaUrl } from "@/lib/mediaUrl";

type ProductVersionsModalProps = {
  product: ProductDto;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ProductVersionsModal({ product, onClose, onSuccess }: ProductVersionsModalProps) {
  const [versions, setVersions] = useState<ProductVersionDto[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [versionNumber, setVersionNumber] = useState<string>("");
  const [releaseNotes, setReleaseNotes] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setUploadProgress(0);
      interval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + Math.random() * 5 : prev));
      }, 500);
    } else {
      setUploadProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVersions = useCallback(async () => {
    setFetchLoading(true);
    setError("");
    try {
      const response = await getApiProductsByIdVersions({
        path: { id: product.id! },
        throwOnError: false
      });
      if (response.data?.isSuccess) {
        setVersions(response.data.value || []);
      } else {
        setError(response.data?.errors?.map((err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => err.description).join(", ") || "Failed to load versions.");
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.message || "An error occurred fetching versions.");
    } finally {
      setFetchLoading(false);
    }
  }, [product.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVersions();
  }, [fetchVersions]);

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !versionNumber) return;
    setLoading(true);
    setError("");

    try {
      const response = await postApiProductsByIdVersions({
        path: { id: product.id! },
        body: { 
          File: selectedFile as unknown as Blob, 
          VersionNumber: versionNumber, 
          ReleaseNotes: releaseNotes || undefined 
        },
        throwOnError: false
      });

      if (response.data?.isSuccess && response.data.value) {
        setVersions([...versions, response.data.value]);
        setSelectedFile(null);
        setVersionNumber("");
        setReleaseNotes("");
        const fileInput = document.getElementById("versionFile") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        onSuccess();
      } else if (response.error || response.data?.isError) {
        const errorMsg = response.data?.errors?.map((err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => err.description).filter(Boolean).join(", ") || "Failed to add version.";
        setError(errorMsg);
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.message || "An error occurred while adding version.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (versionId: string) => {
    setLoading(true);
    setError("");
    const targetVersion = versions.find(v => v.id === versionId);
    if (!targetVersion) return;
    
    try {
      const response = await putApiProductsByProductIdVersionsByVersionIdToggleStatus({
        path: { productId: product.id!, versionId: versionId },
        body: !targetVersion.isActive,
        throwOnError: false
      });
      if (response.data?.isSuccess) {
        setVersions(versions.map(v => v.id === versionId ? { ...v, isActive: !v.isActive } : v));
        onSuccess();
      } else {
        setError(response.data?.errors?.map((err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => err.description).join(", ") || "Failed to toggle status.");
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.message || "An error occurred while toggling status.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm("Are you sure you want to delete this version? This action cannot be undone.")) return;
    setLoading(true);
    setError("");

    try {
      const response = await deleteApiProductsByProductIdVersionsByVersionId({
        path: { productId: product.id!, versionId: versionId },
        throwOnError: false
      });

      if (response.data?.isSuccess) {
        setVersions(versions.filter(v => v.id !== versionId));
        onSuccess();
      } else if (response.error || response.data?.isError) {
        const errorMsg = response.data?.errors?.map((err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => err.description).filter(Boolean).join(", ") || "Failed to delete version.";
        setError(errorMsg);
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.message || "An error occurred while deleting version.");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">Versions for {product.name}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert-error" style={{ marginBottom: "1rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "2.5rem", background: "var(--bg-surface)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>Upload New Version</h3>
            <form onSubmit={handleAddVersion} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                  <label className="form-label" htmlFor="versionFile">Program File (up to 500 MB)</label>
                  <input 
                    id="versionFile"
                    type="file" 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                    required 
                    className="form-input"
                    style={{ padding: "0.5rem" }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="form-label">Version Number (e.g. 1.0.0)</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={versionNumber}
                    onChange={(e) => setVersionNumber(e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Release Notes (Optional)</label>
                <textarea
                  className="form-input"
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="What's new in this version..."
                  rows={2}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                {loading && (
                  <div style={{ width: "100%", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", height: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${uploadProgress}%`, height: "100%", background: "var(--accent)", transition: "width 0.4s ease" }}></div>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {loading ? `Uploading... ${Math.round(uploadProgress)}%` : ""}
                  </span>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading || !selectedFile || !versionNumber} 
                    style={{ opacity: loading || !selectedFile || !versionNumber ? 0.6 : 1 }}
                  >
                    {loading ? "Uploading..." : "Upload Version"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Existing Versions</h3>
            
            {fetchLoading ? (
              <div className="skeleton" style={{ height: "100px", borderRadius: "var(--radius-md)" }}></div>
            ) : versions.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <p className="empty-state-sub">No versions uploaded yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {versions.map((version) => (
                  <div key={version.id} style={{ 
                    padding: "1.25rem", 
                    border: "1px solid var(--border)", 
                    borderRadius: "var(--radius-md)", 
                    background: "var(--bg-elevated)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                            v{version.versionNumber}
                          </span>
                          {version.isActive ? (
                            <span className="badge badge-success" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>Active</span>
                          ) : (
                            <span className="badge badge-neutral" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>Hidden</span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          Size: {version.fileSizeBytes ? formatBytes(version.fileSizeBytes) : "Unknown"} • 
                          Uploaded: {new Date(version.createdAtUtc!).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {version.filePath && (
                          <a 
                            href={`${client.getConfig().baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004"}/api/products/${product.id}/versions/${version.id}/download`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem", textDecoration: "none" }}
                          >
                            Download
                          </a>
                        )}
                        <button 
                          onClick={() => handleToggleStatus(version.id!)}
                          disabled={loading}
                          className="btn-secondary"
                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                        >
                          {version.isActive ? "Hide" : "Make Active"}
                        </button>
                        <button 
                          onClick={() => handleDelete(version.id!)}
                          disabled={loading}
                          className="btn-danger-ghost"
                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {version.releaseNotes && (
                      <div style={{ 
                        fontSize: "0.9rem", 
                        color: "var(--text-secondary)", 
                        background: "var(--bg-surface)", 
                        padding: "0.75rem", 
                        borderRadius: "var(--radius-sm)",
                        borderLeft: "2px solid var(--border)"
                      }}>
                        <strong>Notes:</strong> {version.releaseNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
