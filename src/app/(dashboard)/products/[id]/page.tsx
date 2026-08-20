"use client";
import { useEffect, useState, useCallback } from "react";
import { getApiProductsById, deleteApiProductsById, getApiProductsByIdVersions } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ProductFormModal from "@/components/ProductFormModal";
import ProductMediaModal from "@/components/ProductMediaModal";
import ChildProductsModal from "@/components/ChildProductsModal";
import ProductFeaturesModal from "@/components/ProductFeaturesModal";
import ProductVersionsModal from "@/components/ProductVersionsModal";
import { ProductDto, ProductVersionDto } from "@/client/types.gen";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { useAuth } from "@/components/AuthProvider";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const productId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [activeVersions, setActiveVersions] = useState<ProductVersionDto[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isChildrenModalOpen, setIsChildrenModalOpen] = useState(false);
  const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
        auth: token,
      });

      const response = await getApiProductsById({ path: { id: productId }, throwOnError: false });
      if (response.data?.isSuccess) {
        setProduct(response.data.value || null);
        
        try {
          const versionsResp = await getApiProductsByIdVersions({ path: { id: productId }, query: { onlyActive: true }, throwOnError: false });
          if (versionsResp.data?.isSuccess) {
            setActiveVersions(versionsResp.data.value || []);
          }
        } catch (e) {
          console.error("Failed to fetch versions", e);
        }
      } else if (response.error || response.data?.isError) {
        setError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to load product.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await deleteApiProductsById({ path: { id: productId! }, throwOnError: false });
      if (response.data?.isSuccess) {
        router.push("/products");
      } else {
        alert(response.data?.errors?.map((e: any) => e.description).join(", ") || "Failed to delete.");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting product.");
    }
  };

  const handleModalSuccess = () => {
    fetchProduct();
    setIsFormModalOpen(false);
    setIsMediaModalOpen(false);
    setIsChildrenModalOpen(false);
    setIsFeaturesModalOpen(false);
    setIsVersionsModalOpen(false);
  };

  const handleDownload = () => {
    if (activeVersions.length === 0) return;
    const versionToDownload = activeVersions[0];
    if (versionToDownload.id) {
      const baseUrl = client.getConfig().baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004";
      // Ensure baseUrl does not end with a slash if we append /api
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const downloadUrl = `${cleanBaseUrl}/api/products/${productId}/versions/${versionToDownload.id}/download`;
      window.open(downloadUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div className="skeleton" style={{ height: "400px", borderRadius: "var(--radius-lg)" }}></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ color: "var(--danger)" }}>{error || "Product not found"}</h2>
        <Link href="/products" className="btn btn-primary" style={{ marginTop: "1rem" }}>Back to Products</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
      
      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="product-hero-banner" style={{
        background: "linear-gradient(135deg, #0a1628 0%, #1949a1 50%, #0d2e6b 100%)",
        borderRadius: "var(--radius-xl)",
        padding: "2.5rem 3rem",
        marginBottom: "2rem",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: "3rem",
        minHeight: "300px",
      }}>
        {/* Decorative elements */}
        <div style={{
          position: "absolute", top: "-60px", right: "-60px",
          width: "280px", height: "280px",
          background: "radial-gradient(circle, rgba(254,192,16,0.15) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", left: "30%",
          width: "200px", height: "200px",
          background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px", pointerEvents: "none",
        }} />

        {/* Back button */}
        <Link href="/products" style={{
          position: "absolute", top: "1.25rem", left: "1.25rem",
          width: "36px", height: "36px", borderRadius: "50%",
          background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", transition: "all 0.2s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </Link>

        {/* Product Image */}
        <div className="product-hero-image" style={{
          width: "220px", height: "220px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          {product.media && product.media.length > 0 && product.media[0].url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(product.media[0].url)}
              alt={product.name || "Product"}
              style={{
                maxHeight: "200px", maxWidth: "100%", objectFit: "contain",
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
                transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              }}
              onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = "scale(1.08) rotate(-2deg)"; }}
              onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = "scale(1)"; }}
            />
          ) : (
            <div style={{
              width: 140, height: 140,
              background: "linear-gradient(135deg, rgba(254,192,16,0.3) 0%, rgba(25,73,161,0.3) 100%)",
              borderRadius: "var(--radius-xl)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
              </svg>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            {product.family && (
              <span style={{
                background: "rgba(254,192,16,0.2)", color: "#fec010",
                padding: "0.25rem 0.75rem", borderRadius: "99px",
                fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em",
                textTransform: "uppercase", border: "1px solid rgba(254,192,16,0.3)",
              }}>
                {product.family}
              </span>
            )}
            {product.comingSoon && (
              <span style={{
                background: "rgba(251,191,36,0.15)", color: "#fbbf24",
                padding: "0.25rem 0.75rem", borderRadius: "99px",
                fontSize: "0.75rem", fontWeight: 700,
              }}>
                Coming Soon
              </span>
            )}
          </div>

          <h1 style={{
            margin: "0 0 0.5rem", fontSize: "2.25rem", fontWeight: 800,
            color: "#ffffff", letterSpacing: "-0.5px", lineHeight: 1.2,
          }}>
            {product.name}
          </h1>
          {product.fullName && product.fullName !== product.name && (
            <p style={{ margin: "0 0 1.25rem", fontSize: "1rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
              {product.fullName}
            </p>
          )}

          {/* Price + Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <div style={{
              background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-lg)",
              padding: "0.75rem 1.25rem", display: "flex", alignItems: "baseline", gap: "0.4rem",
            }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fec010", fontFamily: "var(--font-mono)" }}>
                ${product.prices && product.prices.length > 0 ? (product.prices[0].price || 0).toFixed(2) : "0.00"}
              </span>
              <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>/ yr</span>
            </div>

            {user?.role === "Student" ? (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {activeVersions.length > 0 && (
                  <button style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.7rem 1.5rem", borderRadius: "var(--radius-md)",
                    background: "rgba(16, 185, 129, 0.15)", color: "#34d399",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
                    transition: "all 0.2s ease",
                  }}
                  onClick={handleDownload}
                  onMouseEnter={e => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)"; e.currentTarget.style.color = "#34d399"; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download
                  </button>
                )}
                <button style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.7rem 1.5rem", borderRadius: "var(--radius-md)",
                  background: "#fec010", color: "#0a1628",
                  border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem",
                  transition: "all 0.2s ease", boxShadow: "0 4px 16px rgba(254,192,16,0.35)",
                }}
                onClick={() => alert("Cart functionality coming soon!")}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(254,192,16,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(254,192,16,0.35)"; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                  Add to Cart
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setIsFormModalOpen(true)} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.7rem 1.5rem", borderRadius: "var(--radius-md)",
                  background: "rgba(255,255,255,0.12)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Edit
                </button>
                <button onClick={handleDelete} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.7rem 1.5rem", borderRadius: "var(--radius-md)",
                  background: "rgba(239,68,68,0.15)", color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.3)",
                  fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#f87171"; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content Grid ──────────────────────────────── */}
      <div className="product-content-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        
        {/* Description Card */}
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)", padding: "1.75rem",
          gridColumn: "1 / -1",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "var(--accent-dim)", color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
            </div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>Description</h3>
          </div>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {product.description || <span style={{ fontStyle: "italic", opacity: 0.6 }}>No description provided.</span>}
          </p>
        </div>

        {/* Quick Stats Cards */}
        {user?.role !== "Student" && (
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)", padding: "1.75rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px",
                background: "var(--accent-dim)", color: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>Quick Stats</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Visibility</span>
                {product.hidden 
                  ? <span className="badge badge-neutral" style={{ padding: "0.25rem 0.6rem" }}>Hidden</span>
                  : <span className="badge badge-success" style={{ padding: "0.25rem 0.6rem" }}>Visible</span>
                }
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Version</span>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{product.version || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Allow Trial</span>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{product.allowTrial ? `Yes (${product.trialPeriod}d)` : "No"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Release Notes */}
        {activeVersions.length > 0 && activeVersions[0].releaseNotes && (
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)", padding: "1.75rem",
            ...(user?.role === "Student" ? { gridColumn: "1 / -1" } : {}),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px",
                background: "rgba(254,192,16,0.12)", color: "#fec010",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                What&apos;s New in v{activeVersions[0].versionNumber}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {activeVersions[0].releaseNotes}
            </p>
          </div>
        )}
      </div>

      {/* ── Management Section (Admin only) ────────── */}
      {user?.role !== "Student" && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)", padding: "2rem", marginBottom: "2rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "var(--accent-dim)", color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>Management</h3>
          </div>
          
          <div className="product-management-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              { label: "Variants", count: product.children?.length || 0, onClick: () => setIsChildrenModalOpen(true), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg> },
              { label: "Media", count: product.media?.length || 0, onClick: () => setIsMediaModalOpen(true), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> },
              { label: "Features", count: product.features?.length || 0, onClick: () => setIsFeaturesModalOpen(true), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg> },
              { label: "Versions", count: activeVersions.length || 0, onClick: () => setIsVersionsModalOpen(true), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> },
            ].map(item => (
              <button key={item.label} onClick={item.onClick} style={{
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                padding: "1.25rem", borderRadius: "var(--radius-lg)",
                display: "flex", alignItems: "center", gap: "1rem",
                cursor: "pointer", transition: "all 0.25s ease",
                textAlign: "left",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{
                  width: "42px", height: "42px", borderRadius: "10px",
                  background: "var(--accent-dim)", color: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{item.count}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem", fontWeight: 500 }}>{item.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isFormModalOpen && (
        <ProductFormModal initialData={product} onClose={() => setIsFormModalOpen(false)} onSuccess={handleModalSuccess} />
      )}
      {isMediaModalOpen && (
        <ProductMediaModal product={product} onClose={() => setIsMediaModalOpen(false)} onSuccess={handleModalSuccess} />
      )}
      {isChildrenModalOpen && (
        <ChildProductsModal product={product} onClose={() => setIsChildrenModalOpen(false)} onSuccess={handleModalSuccess} onOpenFeatures={() => { setIsChildrenModalOpen(false); setIsFeaturesModalOpen(true); }} />
      )}
      {isFeaturesModalOpen && (
        <ProductFeaturesModal product={product} onClose={() => setIsFeaturesModalOpen(false)} onSuccess={handleModalSuccess} />
      )}
      {isVersionsModalOpen && (
        <ProductVersionsModal product={product} onClose={() => setIsVersionsModalOpen(false)} onSuccess={handleModalSuccess} />
      )}
    </div>
  );
}
