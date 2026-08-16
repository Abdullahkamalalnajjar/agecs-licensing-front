"use client";
import { useEffect, useState, useCallback } from "react";
import { getApiProducts, deleteApiProductsById } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import ProductFormModal from "@/components/ProductFormModal";
import ProductMediaModal from "@/components/ProductMediaModal";
import ChildProductsModal from "@/components/ChildProductsModal";
import { ProductDto } from "@/client/types.gen";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [mediaProduct, setMediaProduct] = useState<ProductDto | null>(null);
  const [childrenProduct, setChildrenProduct] = useState<ProductDto | null>(null);

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
    if (!confirm("Delete this product?")) return;
    setError("");
    try {
      const response = await deleteApiProductsById({ path: { id }, throwOnError: false });
      if (response.data?.isSuccess) {
        fetchProducts();
      } else {
        setError(response.data?.errors?.map((e: any) => e.description).join(", ") || "Failed to delete.");
      }
    } catch (err: any) {
      setError(err.message || "Error deleting product.");
    }
  };

  const openEditModal = (product: ProductDto) => { setEditingProduct(product); setIsFormModalOpen(true); };
  const openCreateModal = () => { setEditingProduct(null); setIsFormModalOpen(true); };
  const handleModalSuccess = () => { setIsFormModalOpen(false); setMediaProduct(null); setChildrenProduct(null); fetchProducts(); };

  const rootProducts = products.filter((p) => !p.parentProductId);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{loading ? "Loading…" : `${rootProducts.length} product${rootProducts.length !== 1 ? "s" : ""}`}</p>
        </div>
        <button id="create-product-btn" className="btn-primary" onClick={openCreateModal}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Product
        </button>
      </div>

      {error && (
        <div className="alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Family</th>
              <th>Version</th>
              <th>Price</th>
              <th>Visibility</th>
              <th>Coming Soon</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "20px", width: j === 0 ? "120px" : "80px" }} /></td>
                  ))}
                </tr>
              ))
            ) : rootProducts.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    <p className="empty-state-title">No products yet</p>
                    <p className="empty-state-sub">Create your first product to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              rootProducts.map((product) => (
                <tr key={product.id}>
                  <td className="fw-medium">{product.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{product.family || "—"}</td>
                  <td><span className="badge badge-neutral">{product.version || "—"}</span></td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                    ${product.prices && product.prices.length > 0 ? (product.prices[0].price || 0).toFixed(2) : "0.00"}
                  </td>
                  <td>
                    {product.hidden
                      ? <span className="badge badge-neutral">Hidden</span>
                      : <span className="badge badge-success">Visible</span>}
                  </td>
                  <td>
                    {product.comingSoon
                      ? <span className="badge badge-warning">Soon</span>
                      : <span className="badge badge-neutral">No</span>}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-ghost" onClick={() => setChildrenProduct(product)}>
                        Children ({product.children?.length || 0})
                      </button>
                      <button className="btn-ghost" onClick={() => setMediaProduct(product)}>
                        Media ({product.media?.length || 0})
                      </button>
                      <button className="btn-ghost" style={{ color: "var(--accent-light)", borderColor: "var(--accent-border)" }} onClick={() => openEditModal(product)}>
                        Edit
                      </button>
                      <button className="btn-danger-ghost" onClick={() => handleDelete(product.id!)}>
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

      {isFormModalOpen && (
        <ProductFormModal initialData={editingProduct} onClose={() => setIsFormModalOpen(false)} onSuccess={handleModalSuccess} />
      )}
      {mediaProduct && (
        <ProductMediaModal product={mediaProduct} onClose={() => setMediaProduct(null)} onSuccess={handleModalSuccess} />
      )}
      {childrenProduct && (
        <ChildProductsModal product={childrenProduct} onClose={() => setChildrenProduct(null)} onSuccess={handleModalSuccess} />
      )}
    </div>
  );
}
