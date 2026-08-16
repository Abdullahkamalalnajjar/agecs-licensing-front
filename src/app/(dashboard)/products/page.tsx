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
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [mediaProduct, setMediaProduct] = useState<ProductDto | null>(null);
  const [childrenProduct, setChildrenProduct] = useState<ProductDto | null>(null);

  const router = useRouter();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
        auth: token
      });

      const response = await getApiProducts({ throwOnError: false });
      if (response.data?.isSuccess) {
        setProducts(response.data.value || []);
      } else if (response.error || response.data?.isError) {
        const errorMsg = response.data?.errors?.map(e => e.description).join(", ") || "Failed to load products.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching products.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    setError("");
    try {
      const response = await deleteApiProductsById({ path: { id }, throwOnError: false });
      if (response.data?.isSuccess) {
        fetchProducts();
      } else if (response.error || response.data?.isError) {
        const errorMsg = response.data?.errors?.map((e: any) => e.description).filter(Boolean).join(", ") || "Failed to delete product.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting product.");
    }
  };

  const openEditModal = (product: ProductDto) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsFormModalOpen(false);
    setMediaProduct(null);
    setChildrenProduct(null);
    fetchProducts();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <button className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.95rem" }} onClick={openCreateModal}>
          + New Product
        </button>
      </div>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      <div className="data-table-wrapper" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Family</th>
              <th>Version</th>
              <th>Price</th>
              <th>Hidden</th>
              <th>Coming Soon</th>
              <th style={{ minWidth: "300px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>Loading products...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                  No products found.
                </td>
              </tr>
            ) : (
              products.filter(p => !p.parentProductId).map((product) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: "500" }}>{product.name}</td>
                  <td>{product.family || "-"}</td>
                  <td>{product.version || "-"}</td>
                  <td>${product.prices && product.prices.length > 0 ? (product.prices[0].price || 0).toFixed(2) : "0.00"}</td>
                  <td>
                    {product.hidden ? (
                      <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#fee2e2", color: "#dc2626", fontSize: "0.8rem", fontWeight: "600" }}>Yes</span>
                    ) : (
                      <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#f3f4f6", color: "#6b7280", fontSize: "0.8rem", fontWeight: "600" }}>No</span>
                    )}
                  </td>
                  <td>
                    {product.comingSoon ? (
                      <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#dbeafe", color: "#2563eb", fontSize: "0.8rem", fontWeight: "600" }}>Yes</span>
                    ) : (
                      <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#f3f4f6", color: "#6b7280", fontSize: "0.8rem", fontWeight: "600" }}>No</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => setChildrenProduct(product)} style={{ background: "none", border: "1px solid #e5e7eb", padding: "4px 8px", borderRadius: "4px", color: "#4f46e5", cursor: "pointer", marginRight: "0.5rem", fontSize: "0.8rem", fontWeight: "500" }}>
                      Children ({product.children?.length || 0})
                    </button>
                    <button onClick={() => setMediaProduct(product)} style={{ background: "none", border: "1px solid #e5e7eb", padding: "4px 8px", borderRadius: "4px", color: "#0ea5e9", cursor: "pointer", marginRight: "1rem", fontSize: "0.8rem", fontWeight: "500" }}>
                      Media ({product.media?.length || 0})
                    </button>
                    <button onClick={() => openEditModal(product)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", marginRight: "1rem", fontSize: "0.85rem", fontWeight: "500" }}>Edit</button>
                    <button onClick={() => handleDeleteProduct(product.id!)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormModalOpen && (
        <ProductFormModal 
          initialData={editingProduct} 
          onClose={() => setIsFormModalOpen(false)} 
          onSuccess={handleModalSuccess} 
        />
      )}

      {mediaProduct && (
        <ProductMediaModal 
          product={mediaProduct} 
          onClose={() => setMediaProduct(null)} 
          onSuccess={handleModalSuccess} 
        />
      )}

      {childrenProduct && (
        <ChildProductsModal 
          product={childrenProduct} 
          onClose={() => setChildrenProduct(null)} 
          onSuccess={handleModalSuccess} 
        />
      )}
    </div>
  );
}
