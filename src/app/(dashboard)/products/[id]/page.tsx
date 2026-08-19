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
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <Link href="/products" className="btn btn-secondary" style={{ padding: "0.6rem", borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s ease, border-color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'var(--accent-light)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(90deg, var(--text-primary) 0%, var(--accent-light) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {product.name}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => setIsFormModalOpen(true)} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 12px rgba(124,58,237,0.25)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit Details
          </button>
          <button onClick={handleDelete} className="btn" style={{ 
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)",
            boxShadow: "0 4px 12px rgba(239,68,68,0.15)", fontWeight: 600, transition: "all 0.2s ease"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--danger)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(239,68,68,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.15)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Delete Product
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) 2fr", gap: "2rem" }}>
        {/* Left Column: Image & Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Enhanced Image Container */}
          <div style={{
            background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "3rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "320px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2) inset",
          }}>
            {/* Decorative Grid */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              opacity: 0.4,
              pointerEvents: "none",
            }} />
            
             {product.media && product.media.length > 0 && product.media[0].url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaUrl(product.media[0].url)}
                  alt={product.name || "Product"}
                  style={{ position: "relative", maxHeight: "280px", maxWidth: "100%", objectFit: "contain", filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))", transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
                  onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = "scale(1.1)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = "scale(1)"; }}
                />
              ) : (
                <div style={{
                  position: "relative",
                  width: 160, height: 160,
                  background: "linear-gradient(135deg, var(--accent) 0%, #312e81 100%)",
                  borderRadius: "var(--radius-xl)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 20px 40px rgba(124,58,237,0.4)",
                }}>
                  <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                  </svg>
                </div>
              )}
          </div>

          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "1.75rem",
          }}>
             <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-light)" }}><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
               Quick Stats
             </h3>
             <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--border)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Visibility</span>
                  {product.hidden ? <span className="badge badge-neutral" style={{ padding: "0.3rem 0.6rem" }}>Hidden</span> : <span className="badge badge-success" style={{ padding: "0.3rem 0.6rem" }}>Visible</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--border)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Coming Soon</span>
                  <span style={{ fontWeight: 600 }}>{product.comingSoon ? "Yes" : "No"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Base Price</span>
                  <span style={{ 
                    fontFamily: "var(--font-mono)", 
                    fontWeight: 700, 
                    fontSize: "1.1rem", 
                    color: "var(--accent-light)",
                    background: "var(--accent-dim)",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--accent-border)"
                  }}>
                    ${product.prices && product.prices.length > 0 ? (product.prices[0].price || 0).toFixed(2) : "0.00"}
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal", marginLeft: "0.2rem" }}>/ yr</span>
                  </span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Details & Management */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Details Card */}
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "2rem" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-light)" }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Information
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
              <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Full Name
                </span>
                <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>{product.fullName || "—"}</span>
              </div>
              <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  Family
                </span>
                <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>{product.family || "—"}</span>
              </div>
              <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Version
                </span>
                <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>{product.version || "—"}</span>
              </div>
              <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Allow Trial
                </span>
                <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>{product.allowTrial ? `Yes (${product.trialPeriod} days)` : "No"}</span>
              </div>
            </div>
            
            <div style={{ marginTop: "1.5rem", background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
               <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
                 Description
               </span>
               <p style={{ margin: 0, fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                 {product.description || <span style={{ fontStyle: "italic", opacity: 0.7 }}>No description provided.</span>}
               </p>
            </div>
          </div>

          {/* Management Actions */}
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "2rem", flex: 1 }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-light)" }}><path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9z"/><path d="M12 8v8M8 12h8"/></svg>
              Management
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              
              <button onClick={() => setIsChildrenModalOpen(true)} style={{
                background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)", 
                border: "1px solid var(--border)", 
                padding: "1.5rem", 
                borderRadius: "var(--radius-lg)",
                display: "flex", alignItems: "center", gap: "1rem", 
                cursor: "pointer", 
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                textAlign: "left"
              }} 
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "var(--accent-light)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)"; }} 
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ 
                  width: "48px", height: "48px", borderRadius: "12px", 
                  background: "var(--accent-dim)", color: "var(--accent-light)", 
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{product.children?.length || 0}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.3rem", fontWeight: 500 }}>Variants & Options</div>
                </div>
              </button>
              
              <button onClick={() => setIsMediaModalOpen(true)} style={{
                background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)", 
                border: "1px solid var(--border)", 
                padding: "1.5rem", 
                borderRadius: "var(--radius-lg)",
                display: "flex", alignItems: "center", gap: "1rem", 
                cursor: "pointer", 
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                textAlign: "left"
              }} 
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "var(--accent-light)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)"; }} 
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ 
                  width: "48px", height: "48px", borderRadius: "12px", 
                  background: "var(--accent-dim)", color: "var(--accent-light)", 
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{product.media?.length || 0}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.3rem", fontWeight: 500 }}>Media Files</div>
                </div>
              </button>

              <button onClick={() => setIsFeaturesModalOpen(true)} style={{
                background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)", 
                border: "1px solid var(--border)", 
                padding: "1.5rem", 
                borderRadius: "var(--radius-lg)",
                display: "flex", alignItems: "center", gap: "1rem", 
                cursor: "pointer", 
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                textAlign: "left"
              }} 
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "var(--accent-light)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)"; }} 
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ 
                  width: "48px", height: "48px", borderRadius: "12px", 
                  background: "var(--accent-dim)", color: "var(--accent-light)", 
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{product.features?.length || 0}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.3rem", fontWeight: 500 }}>Features List</div>
                </div>
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
