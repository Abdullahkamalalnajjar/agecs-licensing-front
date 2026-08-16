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
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TicketCategoryDto | null>(null);
  const router = useRouter();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
        auth: token,
      });

      const response = await getApiTicketCategories({ throwOnError: false });
      if (response.data) {
        setCategories(response.data as any || []);
      } else if (response.error) {
        // @ts-ignore
        setError(response.error?.title || "Failed to load categories.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    setError("");
    try {
      const response = await deleteApiTicketCategoriesById({ path: { id }, throwOnError: false });
      if (response.data !== undefined && response.error === undefined) {
        fetchCategories();
      } else if (response.error) {
        // @ts-ignore
        setError(response.error?.title || "Failed to delete.");
      }
    } catch (err: any) {
      setError(err.message || "Error deleting category.");
    }
  };

  const openEdit = (c: TicketCategoryDto) => { setEditingCategory(c); setIsFormModalOpen(true); };
  const openCreate = () => { setEditingCategory(null); setIsFormModalOpen(true); };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Ticket Categories</h1>
          <p className="page-subtitle">{loading ? "Loading…" : `${categories.length} categor${categories.length !== 1 ? "ies" : "y"}`}</p>
        </div>
        <button id="create-category-btn" className="btn-primary" onClick={openCreate}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Category
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
              <th>Description</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "20px", width: j === 0 ? "120px" : "80px" }} /></td>
                  ))}
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    <p className="empty-state-title">No categories yet</p>
                    <p className="empty-state-sub">Create categories to organize your tickets</p>
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td className="fw-medium">{category.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{category.description || "—"}</td>
                  <td><span className="badge badge-neutral">#{category.order}</span></td>
                  <td>
                    {category.isActive
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-danger">Inactive</span>}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-ghost" style={{ color: "var(--accent-light)", borderColor: "var(--accent-border)" }} onClick={() => openEdit(category)}>
                        Edit
                      </button>
                      <button className="btn-danger-ghost" onClick={() => handleDelete(category.id!)}>
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
        <TicketCategoryFormModal
          initialData={editingCategory}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => { setIsFormModalOpen(false); fetchCategories(); }}
        />
      )}
    </div>
  );
}
