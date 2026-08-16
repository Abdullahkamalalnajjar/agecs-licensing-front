"use client";
import { useEffect, useState, useCallback } from "react";
import { getApiLicenses, getApiProducts, getIdentityUsers } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import LicenseFormModal from "@/components/LicenseFormModal";
import { ProductDto } from "@/client/types.gen";

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any | null>(null);

  const router = useRouter();

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
        auth: token,
      });

      const [licensesRes, productsRes, usersRes] = await Promise.all([
        getApiLicenses({ throwOnError: false }),
        getApiProducts({ throwOnError: false }),
        getIdentityUsers({ throwOnError: false })
      ]);

      if (usersRes.data?.isSuccess) {
        setUsers((usersRes.data.value as any) || []);
      }

      if (productsRes.data?.isSuccess) {
        setProducts(productsRes.data.value || []);
      }

      if (licensesRes.data) {
        // Backend returns an array directly for GetLicenses
        setLicenses((licensesRes.data as any) || []);
      } else if (licensesRes.error) {
        setError("Failed to load licenses.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  const openCreateModal = () => { setEditingLicense(null); setIsFormModalOpen(true); };
  const openEditModal = (license: any) => { setEditingLicense(license); setIsFormModalOpen(true); };
  const handleModalSuccess = () => { setIsFormModalOpen(false); fetchLicenses(); };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} ${product.version ? `(${product.version})` : ""}` : productId;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Licenses</h1>
          <p className="page-subtitle">{loading ? "Loading…" : `${licenses.length} license${licenses.length !== 1 ? "s" : ""}`}</p>
        </div>
        <button id="create-license-btn" className="btn-primary" onClick={openCreateModal}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New License
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
              <th>Client</th>
              <th>Product</th>
              <th>Key / Serial</th>
              <th>Licenses</th>
              <th>Migrations</th>
              <th>Expiry</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "20px", width: j === 0 ? "120px" : "80px" }} /></td>
                  ))}
                </tr>
              ))
            ) : licenses.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <p className="empty-state-title">No licenses yet</p>
                    <p className="empty-state-sub">Create your first license to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              licenses.map((license) => (
                <tr key={license.id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="fw-medium">{license.name || "—"}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{license.email || "—"}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{getProductName(license.productId)}</td>
                  <td className="mono" style={{ fontSize: "0.85rem", letterSpacing: "0.025em" }}>{license.serial || "—"}</td>
                  <td>
                    <span className="badge badge-neutral">
                      {license.usedCount || 0} / {license.licenseCount || 1}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {license.migrationCount || 0} / {license.migrationLimit || 1}
                    </span>
                  </td>
                  <td>
                    {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : "Never"}
                  </td>
                  <td>
                    {license.isTrial
                      ? <span className="badge badge-warning">Trial</span>
                      : <span className="badge badge-success">Paid</span>}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-ghost" onClick={() => openEditModal(license)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormModalOpen && (
        <LicenseFormModal
          initialData={editingLicense}
          products={products}
          users={users}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
