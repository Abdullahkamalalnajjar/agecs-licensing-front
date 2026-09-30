"use client";
import { useEffect, useState } from "react";
import { getApiPackages, deleteApiPackagesById, postApiV1CartsMyCartItems } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import PackageFormModal from "@/components/PackageFormModal";
import { useToast } from "@/components/ToastProvider";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { PackageDto } from "@/client/types.gen";

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageDto | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
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

  const handleAddToCart = async (pkg: PackageDto) => {
    if (!pkg.id) return;
    try {
      setAddingId(pkg.id);
      const res = await postApiV1CartsMyCartItems({
        body: { itemType: "Package", itemId: pkg.id, quantity: 1 },
        throwOnError: false,
      });
      if (res.error || (res.data as any)?.isError) {
        toastError((res.data as any)?.errors?.map((e: any) => e.description).join(", ") || "Failed to add to cart.");
        return;
      }
      window.dispatchEvent(new Event("cartUpdated"));
      success(`${pkg.name} added to cart — open the cart to check out.`);
    } catch (err: any) {
      toastError(err.message || "Error adding to cart.");
    } finally {
      setAddingId(null);
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
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "20px", width: j === 0 ? "140px" : "80px" }} /></td>
                  ))}
                </tr>
              ))
            ) : packages.length === 0 ? (
              <tr>
                <td colSpan={5}>
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
              packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{pkg.name}</div>
                    {pkg.description && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "280px" }}>{pkg.description}</div>
                    )}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 700 }}>
                    {pkg.price?.toFixed(2)}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {(pkg.items || []).map((item) => {
                        const thumb = item.media?.[0]?.url;
                        return (
                          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={resolveMediaUrl(thumb)}
                                alt={item.itemName || ""}
                                style={{ width: "28px", height: "28px", borderRadius: "6px", objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "var(--bg-elevated)", border: "1px solid var(--border)", flexShrink: 0 }} />
                            )}
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              {item.itemName || item.itemId} · {item.period}d
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                      {pkg.hidden ? <span className="badge badge-neutral">Hidden</span> : <span className="badge badge-success">Visible</span>}
                      {pkg.comingSoon && <span className="badge badge-neutral">Coming Soon</span>}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-ghost"
                        onClick={() => handleAddToCart(pkg)}
                        disabled={addingId === pkg.id}
                        title="Add to my cart to test checkout"
                      >
                        {addingId === pkg.id ? "Adding…" : "Add to cart"}
                      </button>
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
