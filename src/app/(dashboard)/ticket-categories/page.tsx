"use client";
import { useEffect, useState, useCallback } from "react";
import { getApiTicketCategories, deleteApiTicketCategoriesById, putApiTicketCategoriesReorder, patchApiTicketCategoriesByIdActive } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import TicketCategoryFormModal from "@/components/TicketCategoryFormModal";
import { TicketCategoryDto } from "@/client/types.gen";
import "@/components/product-form.css";
import { usePermissions } from "@/components/AuthProvider";
import { P } from "@/lib/permissions";

export default function TicketCategoriesPage() {
  const { can, canField, canUpdateAny } = usePermissions();
  const canCreate = can(P.ticketCategories.create);
  const canUpdate = canUpdateAny("ticket-categories");
  const canReorder = canField("ticket-categories", "order");
  const canToggleActive = canField("ticket-categories", "active");
  const canDelete = can(P.ticketCategories.delete);
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TicketCategoryDto | null>(null);
  const [reordering, setReordering] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
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

  // Swaps a category with its neighbour and saves the whole order; the list goes back if the save fails.
  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const previous = categories;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
    setError("");
    setReordering(true);
    try {
      const res = await putApiTicketCategoriesReorder({ body: { categoryIds: next.map((c) => c.id!) }, throwOnError: false });
      if (res.error || res.data?.isError) {
        setCategories(previous);
        setError(res.data?.errors?.map((e) => e.description).filter(Boolean).join(", ") || "Failed to save the new order.");
      }
    } catch (err) {
      setCategories(previous);
      setError((err instanceof Error && err.message) || "Failed to save the new order.");
    } finally {
      setReordering(false);
    }
  };

  // Flips the switch right away and puts it back if the save fails.
  const toggleActive = async (category: TicketCategoryDto) => {
    const isActive = !category.isActive;
    const setActive = (value: boolean) =>
      setCategories((prev) => prev.map((c) => (c.id === category.id ? { ...c, isActive: value } : c)));
    setActive(isActive);
    setError("");
    setTogglingId(category.id!);
    try {
      const res = await patchApiTicketCategoriesByIdActive({ path: { id: category.id! }, body: { isActive }, throwOnError: false });
      if (res.error || res.data?.isError) {
        setActive(!isActive);
        setError(res.data?.errors?.map((e) => e.description).filter(Boolean).join(", ") || "Failed to update the status.");
      }
    } catch (err) {
      setActive(!isActive);
      setError((err instanceof Error && err.message) || "Failed to update the status.");
    } finally {
      setTogglingId(null);
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
        {canCreate && <button id="create-category-btn" className="btn-primary" onClick={openCreate}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Category
        </button>}
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
              categories.map((category, index) => (
                <tr key={category.id}>
                  <td className="fw-medium">{category.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{category.description || "—"}</td>
                  <td>
                    {canReorder && (
                      <div className="table-actions">
                        <button type="button" className="btn-ghost" onClick={() => move(index, -1)} disabled={reordering || index === 0} aria-label="Move up" title="Move up">↑</button>
                        <button type="button" className="btn-ghost" onClick={() => move(index, 1)} disabled={reordering || index === categories.length - 1} aria-label="Move down" title="Move down">↓</button>
                      </div>
                    )}
                  </td>
                  <td>
                    {!canToggleActive ? (
                      <span style={{ fontSize: "0.85rem", color: category.isActive ? "var(--success)" : "var(--text-muted)" }}>
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    ) : (
                    <label
                      title={category.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", opacity: togglingId === category.id ? 0.6 : 1 }}
                    >
                      <span className="pf-toggle-switch">
                        <input type="checkbox" checked={!!category.isActive} disabled={togglingId === category.id} onChange={() => toggleActive(category)} aria-label={`${category.name} active`} />
                        <span className="pf-toggle-track" />
                      </span>
                      <span style={{ fontSize: "0.85rem", color: category.isActive ? "var(--success)" : "var(--text-muted)" }}>
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </label>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      {canUpdate && <button className="btn-ghost" style={{ color: "var(--accent-light)", borderColor: "var(--accent-border)" }} onClick={() => openEdit(category)}>
                        Edit
                      </button>}
                      {canDelete && <button className="btn-danger-ghost" onClick={() => handleDelete(category.id!)}>
                        Delete
                      </button>}
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
