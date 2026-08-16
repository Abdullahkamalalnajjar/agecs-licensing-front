"use client";
import { useEffect, useState, useCallback } from "react";
import { getApiTicketCategories, deleteApiTicketCategoriesById } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import TicketCategoryFormModal from "@/components/TicketCategoryFormModal";
import { TicketCategoryDto } from "@/client/types.gen";

export default function TicketCategoriesPage() {
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TicketCategoryDto | null>(null);

  const router = useRouter();

  const fetchCategories = useCallback(async () => {
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

      const response = await getApiTicketCategories({ throwOnError: false });
      // The response structure might be different based on result pattern
      // Usually it's response.data
      if (response.data) {
        setCategories(response.data as any || []);
      } else if (response.error) {
        // @ts-ignore
        const errorMsg = response.error?.title || "Failed to load categories.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching categories.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    setError("");
    try {
      const response = await deleteApiTicketCategoriesById({ path: { id }, throwOnError: false });
      if (response.data !== undefined && response.error === undefined) {
        fetchCategories();
      } else if (response.error) {
        // @ts-ignore
        const errorMsg = response.error?.title || "Failed to delete category.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting category.");
    }
  };

  const openEditModal = (category: TicketCategoryDto) => {
    setEditingCategory(category);
    setIsFormModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsFormModalOpen(false);
    fetchCategories();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ticket Categories</h1>
        <button className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.95rem" }} onClick={openCreateModal}>
          + New Category
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
              <th>Description</th>
              <th>Order</th>
              <th>Active</th>
              <th style={{ minWidth: "150px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>Loading categories...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td style={{ fontWeight: "500" }}>{category.name}</td>
                  <td>{category.description || "-"}</td>
                  <td>{category.order}</td>
                  <td>
                    {category.isActive ? (
                      <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#d1fae5", color: "#059669", fontSize: "0.8rem", fontWeight: "600" }}>Yes</span>
                    ) : (
                      <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#fee2e2", color: "#dc2626", fontSize: "0.8rem", fontWeight: "600" }}>No</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => openEditModal(category)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", marginRight: "1rem", fontSize: "0.85rem", fontWeight: "500" }}>Edit</button>
                    <button onClick={() => handleDeleteCategory(category.id!)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormModalOpen && (
        <TicketCategoryFormModal 
          initialData={editingCategory} 
          onClose={() => setIsFormModalOpen(false)} 
          onSuccess={handleModalSuccess} 
        />
      )}
    </div>
  );
}
