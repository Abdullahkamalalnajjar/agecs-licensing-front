"use client";
import { useEffect, useState, useCallback } from "react";
import { getApiProductsById, deleteApiProductsById } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ProductFormModal from "@/components/ProductFormModal";
import ProductMediaModal from "@/components/ProductMediaModal";
import ChildProductsModal from "@/components/ChildProductsModal";
import ProductFeaturesModal from "@/components/ProductFeaturesModal";
import { ProductDto } from "@/client/types.gen";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const productId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isChildrenModalOpen, setIsChildrenModalOpen] = useState(false);
  const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);

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
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/products" className="btn btn-secondary" style={{ padding: "0.5rem", borderRadius: "50%" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <h1 style={{ margin: 0, fontSize: "1.8rem", color: "var(--text-primary)" }}>{product.name}</h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setIsFormModalOpen(true)} className="btn btn-primary">Edit Details</button>
          <button onClick={handleDelete} className="btn btn-danger">Delete Product</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        {/* Left Column: Image & Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
            position: "relative",
          }}>
             {product.media && product.media.length > 0 && product.media[0].url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaUrl(product.media[0].url)}
                  alt={product.name || "Product"}
                  style={{ maxHeight: "250px", maxWidth: "100%", objectFit: "contain", filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.3))" }}
                />
              ) : (
                <div style={{
                  width: 150, height: 150,
                  background: "linear-gradient(135deg, var(--accent) 0%, #312e81 100%)",
                  borderRadius: "var(--radius-lg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 12px 32px rgba(124,58,237,0.35)",
                }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                  </svg>
                </div>
              )}
          </div>

          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
          }}>
             <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>Quick Stats</h3>
             <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Visibility</span>
                  {product.hidden ? <span className="badge badge-neutral">Hidden</span> : <span className="badge badge-success">Visible</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Coming Soon</span>
                  <span>{product.comingSoon ? "Yes" : "No"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Base Price</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>${product.prices && product.prices.length > 0 ? (product.prices[0].price || 0).toFixed(2) : "0.00"} / year</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Details & Management */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Details Card */}
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.2rem" }}>Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Full Name</span>
                <span>{product.fullName || "-"}</span>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Family</span>
                <span>{product.family || "-"}</span>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Version</span>
                <span>{product.version || "-"}</span>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Allow Trial</span>
                <span>{product.allowTrial ? `Yes (${product.trialPeriod} days)` : "No"}</span>
              </div>
            </div>
            
            <div style={{ marginTop: "1rem" }}>
               <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Description</span>
               <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                 {product.description || "No description provided."}
               </p>
            </div>
          </div>

          {/* Management Actions */}
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.2rem" }}>Manage</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              
              <button onClick={() => setIsChildrenModalOpen(true)} style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: "var(--radius-md)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", cursor: "pointer", transition: "all 0.2s ease"
              }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-light)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{product.children?.length || 0}</span>
                <span style={{ color: "var(--text-secondary)" }}>Variants & Options</span>
              </button>
              
              <button onClick={() => setIsMediaModalOpen(true)} style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: "var(--radius-md)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", cursor: "pointer", transition: "all 0.2s ease"
              }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-light)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{product.media?.length || 0}</span>
                <span style={{ color: "var(--text-secondary)" }}>Media Files</span>
              </button>

              <button onClick={() => setIsFeaturesModalOpen(true)} style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: "var(--radius-md)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", cursor: "pointer", transition: "all 0.2s ease"
              }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-light)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{product.features?.length || 0}</span>
                <span style={{ color: "var(--text-secondary)" }}>Features List</span>
              </button>

            </div>
          </div>

        </div>
      </div>

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
    </div>
  );
}
