"use client";
import { useEffect, useState, useCallback } from "react";
import { getApiProducts, deleteApiProductsById } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductDto } from "@/client/types.gen";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import ProductFormModal from "@/components/ProductFormModal";
import ProductMediaModal from "@/components/ProductMediaModal";
import ChildProductsModal from "@/components/ChildProductsModal";
import ProductVersionsModal from "@/components/ProductVersionsModal";

import { useAuth } from "@/components/AuthProvider";

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDto | null>(null);
  const [mediaProduct, setMediaProduct] = useState<ProductDto | null>(null);
  const [variationProduct, setVariationProduct] = useState<ProductDto | null>(null);
  const [versionsProduct, setVersionsProduct] = useState<ProductDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openCreateModal = () => setIsCreateModalOpen(true);

  const isAdmin = user?.role !== "Student" && user?.role !== "NormalUser";

  const router = useRouter();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
        auth: token,
      });

      const response = await getApiProducts({ throwOnError: false });
      if (response.data?.isSuccess) {
        setProducts(response.data.value || []);
      } else if (response.error || response.data?.isError) {
        setError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to load products.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await deleteApiProductsById({ path: { id } });
      if (response.data?.isSuccess) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        setError("Failed to delete product.");
      }
    } catch {
      setError("Failed to delete product.");
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const rootProducts = products.filter((p) => !p.parentProductId);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{loading ? "Loading…" : `${rootProducts.length} product${rootProducts.length !== 1 ? "s" : ""}`}</p>
        </div>
        {isAdmin && (
          <button id="create-product-btn" className="btn-primary" onClick={openCreateModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Product
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        isAdmin ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}></th>
                  <th>Product</th>
                  <th>Family</th>
                  <th>Version</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: "160px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}><div className="skeleton" style={{ height: "1rem", borderRadius: "var(--radius-sm)" }} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.75rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "340px", borderRadius: "var(--radius-lg)" }} />
            ))}
          </div>
        )
      ) : rootProducts.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <p className="empty-state-title">No products yet</p>
          <p className="empty-state-sub">Create your first product to get started</p>
        </div>
      ) : (
        isAdmin ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
              <tr>
                <th style={{ width: "60px" }}></th>
                <th>Product</th>
                <th>Family</th>
                <th>Version</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ width: "160px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rootProducts.map((product) => (
                <tr key={product.id}>
                  {/* Thumbnail */}
                  <td>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, var(--accent-dim), var(--bg-elevated))",
                      border: "1px solid var(--border)",
                      flexShrink: 0,
                    }}>
                      {product.media && product.media.length > 0 && product.media[0].url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveMediaUrl(product.media[0].url)}
                          alt={product.name || "Product"}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                        </svg>
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--accent-light)" }}>{product.name || "—"}</span>
                    {product.miniDescription && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.miniDescription}
                      </div>
                    )}
                  </td>

                  {/* Family */}
                  <td>
                    <span style={{ color: "var(--text-secondary)" }}>{product.family || "—"}</span>
                  </td>

                  {/* Version */}
                  <td>
                    {product.version ? (
                      <span className="mono" style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "0.15rem 0.45rem",
                        fontSize: "0.8rem",
                      }}>
                        v{product.version}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>

                  {/* Price */}
                  <td>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      background: "var(--accent-dim)",
                      border: "1px solid var(--accent-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.15rem 0.5rem",
                    }}>
                      ${product.prices && product.prices.length > 0 ? (product.prices[0].price || 0).toFixed(2) : "0.00"}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      {product.hidden
                        ? <span className="badge badge-neutral">Hidden</span>
                        : <span className="badge badge-success">Visible</span>}
                      {product.comingSoon && <span className="badge badge-warning">Soon</span>}
                    </div>
                  </td>

                  {/* Created */}
                  <td>
                    <span className="mono" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {product.createdAtUtc ? new Date(product.createdAtUtc).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      {/* View */}
                      <button
                        title="View Details"
                        onClick={() => router.push(`/products/${product.id}`)}
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "0.35rem",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--accent-border)";
                          e.currentTarget.style.color = "var(--accent-light)";
                          e.currentTarget.style.background = "var(--accent-dim)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.color = "var(--text-secondary)";
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>

                      {/* Variations */}
                      <button
                        title="Variations"
                        onClick={() => setVariationProduct(product)}
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "0.35rem",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)";
                          e.currentTarget.style.color = "#10b981";
                          e.currentTarget.style.background = "rgba(16,185,129,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.color = "var(--text-secondary)";
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                        </svg>
                      </button>

                      {/* Media */}
                      <button
                        title="Media"
                        onClick={() => setMediaProduct(product)}
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "0.35rem",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)";
                          e.currentTarget.style.color = "#a855f7";
                          e.currentTarget.style.background = "rgba(168,85,247,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.color = "var(--text-secondary)";
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </button>

                      {/* Versions */}
                      <button
                        title="Versions"
                        onClick={() => setVersionsProduct(product)}
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "0.35rem",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
                          e.currentTarget.style.color = "#f59e0b";
                          e.currentTarget.style.background = "rgba(245,158,11,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.color = "var(--text-secondary)";
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                        </svg>
                      </button>

                      {isAdmin && (
                        <>
                          {/* Edit */}
                          <button
                            title="Edit Product"
                            onClick={() => setEditProduct(product)}
                            style={{
                              background: "none",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              padding: "0.35rem",
                              cursor: "pointer",
                              color: "var(--text-secondary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "var(--accent-border)";
                              e.currentTarget.style.color = "var(--accent-light)";
                              e.currentTarget.style.background = "var(--accent-dim)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--border)";
                              e.currentTarget.style.color = "var(--text-secondary)";
                              e.currentTarget.style.background = "none";
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>

                          {/* Delete */}
                          {deleteConfirmId === product.id ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <button
                                title="Confirm Delete"
                                onClick={() => handleDelete(product.id!)}
                                disabled={deletingId === product.id}
                                style={{
                                  background: "rgba(239,68,68,0.12)",
                                  border: "1px solid rgba(239,68,68,0.3)",
                                  borderRadius: "var(--radius-sm)",
                                  padding: "0.35rem",
                                  cursor: deletingId === product.id ? "not-allowed" : "pointer",
                                  color: "#ef4444",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: deletingId === product.id ? 0.5 : 1,
                                }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 6 9 17l-5-5"/>
                                </svg>
                              </button>
                              <button
                                title="Cancel"
                                onClick={() => setDeleteConfirmId(null)}
                                style={{
                                  background: "none",
                                  border: "1px solid var(--border)",
                                  borderRadius: "var(--radius-sm)",
                                  padding: "0.35rem",
                                  cursor: "pointer",
                                  color: "var(--text-muted)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              title="Delete Product"
                              onClick={() => setDeleteConfirmId(product.id!)}
                              style={{
                                background: "none",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-sm)",
                                padding: "0.35rem",
                                cursor: "pointer",
                                color: "var(--text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                                e.currentTarget.style.color = "#ef4444";
                                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--border)";
                                e.currentTarget.style.color = "var(--text-secondary)";
                                e.currentTarget.style.background = "none";
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.75rem" }}>
            {rootProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                textDecoration: "none",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";
                e.currentTarget.style.borderColor = "var(--accent-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              >
                {/* ── Product Image Area ── */}
                <div style={{
                  position: "relative",
                  background: "linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2rem 1.5rem",
                  minHeight: 200,
                  borderBottom: "1px solid var(--border)",
                }}>
                  {/* Decorative dot grid */}
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                    opacity: 0.5,
                    pointerEvents: "none",
                  }} />

                  {product.media && product.media.length > 0 && product.media[0].url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(product.media[0].url)}
                      alt={product.name || "Product"}
                      style={{
                        position: "relative",
                        maxHeight: 160,
                        maxWidth: "100%",
                        objectFit: "contain",
                        display: "block",
                        filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.4))",
                        transition: "transform 0.3s ease",
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = "scale(1.06)"; }}
                      onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = "scale(1)"; }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div style={{
                      position: "relative",
                      width: 110, height: 110,
                      background: "linear-gradient(135deg, var(--accent) 0%, #312e81 100%)",
                      borderRadius: "var(--radius-lg)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 12px 32px rgba(124,58,237,0.35)",
                    }}>
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                      </svg>
                    </div>
                  )}

                  {/* Status badges */}
                  <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-end" }}>
                    {product.hidden
                      ? <span className="badge badge-neutral">Hidden</span>
                      : <span className="badge badge-success">Visible</span>}
                    {product.comingSoon && <span className="badge badge-warning">Soon</span>}
                  </div>
                </div>

                {/* ── Info ── */}
                <div style={{ padding: "1.1rem 1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.7rem", flex: 1 }}>

                  {/* Title */}
                  <div>
                    <h3 style={{ margin: "0 0 0.15rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-light)" }}>
                      {product.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {product.family && <span>{product.family}</span>}
                      {product.family && product.version && <span>·</span>}
                      {product.version && <span>v{product.version}</span>}
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", flexWrap: "wrap", marginTop: "auto" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Starts from</span>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      background: "var(--accent-dim)",
                      border: "1px solid var(--accent-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.1rem 0.45rem",
                    }}>
                      ${product.prices && product.prices.length > 0 ? (product.prices[0].price || 0).toFixed(2) : "0.00"}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>per year</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {isCreateModalOpen && (
        <ProductFormModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchProducts();
          }}
        />
      )}

      {editProduct && (
        <ProductFormModal
          initialData={editProduct}
          onClose={() => setEditProduct(null)}
          onSuccess={() => {
            setEditProduct(null);
            fetchProducts();
          }}
        />
      )}

      {variationProduct && (
        <ChildProductsModal
          product={variationProduct}
          onClose={() => setVariationProduct(null)}
          onSuccess={() => {
            setVariationProduct(null);
            fetchProducts();
          }}
          onOpenFeatures={() => {}}
        />
      )}

      {mediaProduct && (
        <ProductMediaModal
          product={mediaProduct}
          onClose={() => setMediaProduct(null)}
          onSuccess={() => {
            setMediaProduct(null);
            fetchProducts();
          }}
        />
      )}

      {versionsProduct && (
        <ProductVersionsModal
          product={versionsProduct}
          onClose={() => setVersionsProduct(null)}
          onSuccess={() => {
            setVersionsProduct(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
