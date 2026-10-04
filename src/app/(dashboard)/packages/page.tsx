"use client";
import { useEffect, useState } from "react";
import { getApiPackages, deleteApiPackagesById, patchApiPackagesByIdHidden, putApiPackagesByIdImage, putApiPackagesReorder, deleteApiPackagesByIdImage } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import PackageFormModal from "@/components/PackageFormModal";
import { useToast } from "@/components/ToastProvider";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { PackageDto } from "@/client/types.gen";
import "@/components/product-form.css";

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageDto | null>(null);
  const [imageBusyId, setImageBusyId] = useState<string | null>(null);
  const [hiddenBusyId, setHiddenBusyId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      client.setConfig({
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003",
        auth: token,
      });

      const response = await getApiPackages({ query: { includeHidden: true }, throwOnError: false });
      if (response.data?.isSuccess) {
        setPackages(response.data.value || []);
      } else if (response.error || response.data?.isError) {
        setError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to load packages.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPackages(); }, [router]);

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteApiPackagesById({ path: { id }, throwOnError: false });
      if (response.data?.isSuccess) {
        setPackages(packages.filter((p) => p.id !== id));
        success("Package deleted.");
      } else {
        toastError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to delete.");
      }
    } catch (err: any) {
      toastError(err.message || "Error deleting package.");
    }
  };

  // Moves a package one step up or down, updating the table right away and rolling back if the save fails.
  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= packages.length) return;

    const previous = packages;
    const reordered = [...packages];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setPackages(reordered.map((p, i) => ({ ...p, order: i })));

    try {
      setReordering(true);
      const res = await putApiPackagesReorder({
        body: { packageIds: reordered.map((p) => p.id!).filter(Boolean) },
        throwOnError: false,
      });
      if (res.error || res.data?.isError) {
        setPackages(previous);
        toastError(res.data?.errors?.map((e) => e.description).join(", ") || "Failed to save the new order.");
      }
    } catch (err: any) {
      setPackages(previous);
      toastError(err.message || "Error saving the new order.");
    } finally {
      setReordering(false);
    }
  };

  const handleToggleHidden = async (pkg: PackageDto) => {
    if (!pkg.id) return;
    const hidden = !pkg.hidden;
    try {
      setHiddenBusyId(pkg.id);
      const res = await patchApiPackagesByIdHidden({ path: { id: pkg.id }, body: { hidden }, throwOnError: false });
      if (res.error || res.data?.isError) {
        toastError(res.data?.errors?.map((e) => e.description).join(", ") || "Failed to update visibility.");
        return;
      }
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, hidden } : p)));
      success(hidden ? `${pkg.name} is now hidden.` : `${pkg.name} is now visible.`);
    } catch (err: any) {
      toastError(err.message || "Error updating visibility.");
    } finally {
      setHiddenBusyId(null);
    }
  };

  const handleImageUpload = async (pkg: PackageDto, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!pkg.id || !file) return;
    if (!file.type.startsWith("image/")) {
      toastError("Please choose an image file.");
      return;
    }
    try {
      setImageBusyId(pkg.id);
      const res = await putApiPackagesByIdImage({ path: { id: pkg.id }, body: { File: file }, throwOnError: false });
      if (res.error || res.data?.isError) {
        toastError(res.data?.errors?.map((e) => e.description).join(", ") || "Failed to upload image.");
        return;
      }
      const imageUrl = res.data?.value ?? null;
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, imageUrl } : p)));
      success("Image uploaded.");
    } catch (err: any) {
      toastError(err.message || "Error uploading image.");
    } finally {
      setImageBusyId(null);
    }
  };

  const handleImageRemove = async (pkg: PackageDto) => {
    if (!pkg.id) return;
    try {
      setImageBusyId(pkg.id);
      const res = await deleteApiPackagesByIdImage({ path: { id: pkg.id }, throwOnError: false });
      if (res.error || res.data?.isError) {
        toastError(res.data?.errors?.map((e) => e.description).join(", ") || "Failed to remove image.");
        return;
      }
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, imageUrl: null } : p)));
      success("Image removed.");
    } catch (err: any) {
      toastError(err.message || "Error removing image.");
    } finally {
      setImageBusyId(null);
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    fetchPackages();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Packages</h1>
          <p className="page-subtitle">{loading ? "Loading…" : `${packages.length} package${packages.length !== 1 ? "s" : ""}`}</p>
        </div>
        <button className="btn-primary" onClick={() => { setSelectedPackage(null); setIsModalOpen(true); }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Package
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
              <th style={{ width: "90px" }}>Order</th>
              <th>Name</th>
              <th>Price</th>
              <th>Items</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "20px", width: j === 1 ? "140px" : "80px" }} /></td>
                  ))}
                </tr>
              ))
            ) : packages.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    <p className="empty-state-title">No packages yet</p>
                    <p className="empty-state-sub">Bundle multiple product variations under one fixed price</p>
                  </div>
                </td>
              </tr>
            ) : (
              packages.map((pkg, index) => (
                <tr key={pkg.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", minWidth: "1.2rem", textAlign: "center" }}>
                        {index + 1}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", background: "var(--bg-elevated)", borderRadius: "10px", border: "1px solid var(--border)", overflow: "hidden" }}>
                        <button
                          type="button"
                          style={{ padding: "6px 4px", minHeight: "28px", minWidth: "28px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", cursor: (reordering || index === 0) ? "not-allowed" : "pointer", opacity: (reordering || index === 0) ? 0.3 : 1 }}
                          onClick={() => handleMove(index, -1)}
                          disabled={reordering || index === 0}
                          title="Move up"
                          aria-label={`Move ${pkg.name} up`}
                          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="19" x2="12" y2="5"></line>
                            <polyline points="5 12 12 5 19 12"></polyline>
                          </svg>
                        </button>
                        <button
                          type="button"
                          style={{ padding: "6px 4px", minHeight: "28px", minWidth: "28px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", background: "transparent", border: "none", cursor: (reordering || index === packages.length - 1) ? "not-allowed" : "pointer", opacity: (reordering || index === packages.length - 1) ? 0.3 : 1 }}
                          onClick={() => handleMove(index, 1)}
                          disabled={reordering || index === packages.length - 1}
                          title="Move down"
                          aria-label={`Move ${pkg.name} down`}
                          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <polyline points="19 12 12 19 5 12"></polyline>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {pkg.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveMediaUrl(pkg.imageUrl)}
                          alt={pkg.name || ""}
                          style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{pkg.name}</div>
                        {pkg.description && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "280px" }}>{pkg.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 700 }}>
                    {pkg.price?.toFixed(2)}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {(pkg.items || []).map((item) => (
                        <span key={item.id} style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {item.itemName || item.itemId} · {item.period}d
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                      <label
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: hiddenBusyId === pkg.id ? "wait" : "pointer", opacity: hiddenBusyId === pkg.id ? 0.6 : 1 }}
                        title={pkg.hidden ? "Hidden from customers — click to show" : "Visible to customers — click to hide"}
                      >
                        <span className="pf-toggle-switch">
                          <input
                            type="checkbox"
                            checked={!pkg.hidden}
                            disabled={hiddenBusyId === pkg.id}
                            onChange={() => handleToggleHidden(pkg)}
                          />
                          <span className="pf-toggle-track" />
                        </span>
                        <span style={{ fontSize: "0.8rem", color: pkg.hidden ? "var(--text-muted)" : "var(--text-primary)" }}>
                          {pkg.hidden ? "Hidden" : "Visible"}
                        </span>
                      </label>
                      {pkg.comingSoon && <span className="badge badge-neutral">Coming Soon</span>}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <label
                        className="btn-ghost"
                        style={{ cursor: imageBusyId === pkg.id ? "wait" : "pointer", opacity: imageBusyId === pkg.id ? 0.6 : 1 }}
                        title={pkg.imageUrl ? "Replace the package image" : "Upload a package image"}
                      >
                        {imageBusyId === pkg.id ? "Uploading…" : pkg.imageUrl ? "Change image" : "Upload image"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={imageBusyId === pkg.id}
                          onChange={(e) => handleImageUpload(pkg, e)}
                          style={{ display: "none" }}
                        />
                      </label>
                      {pkg.imageUrl && (
                        <button
                          className="btn-danger-ghost"
                          onClick={() => handleImageRemove(pkg)}
                          disabled={imageBusyId === pkg.id}
                          title="Remove the package image"
                        >
                          Remove image
                        </button>
                      )}
                      <button className="btn-ghost" style={{ color: "var(--accent-light)", borderColor: "var(--accent-border)" }}
                        onClick={() => { setSelectedPackage(pkg); setIsModalOpen(true); }}>
                        Edit
                      </button>
                      <button className="btn-danger-ghost" onClick={() => pkg.id && handleDelete(pkg.id)}>
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

      <PackageFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        pkg={selectedPackage}
      />
    </div>
  );
}
