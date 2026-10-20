"use client";

import { useState, useEffect } from "react";
import { postApiLicenses, postApiLicensesPackage, getApiPackages, putApiLicensesById, postIdentityClients, postApiLicensesAdminByIdHwids, deleteApiLicensesAdminByIdHwidsByHwid } from "@/client";
import { usePermissions } from "./AuthProvider";
import { P } from "@/lib/permissions";
import { ClientDto, CreatePackageLicensesResponse, PackageDto, ProductDto } from "@/client/types.gen";
import ClientPicker from "./ClientPicker";
import "./client-picker.css";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

type ClientMode = "existing" | "new";
/** Create mode: one license for a product, or one license per item of a package. */
type IssueMode = "product" | "package";

const itemPeriodLabel = (item: NonNullable<PackageDto["items"]>[number]) =>
  item.periodValue && item.periodType
    ? `${item.periodValue} ${item.periodType}${item.periodValue === 1 ? "" : "s"}`
    : `${item.period ?? 0} days`;

const emptyNewClient = { email: "", userName: "", password: "" };

type LicenseFormModalProps = {
  isOpen: boolean;
  initialData?: any;
  products: ProductDto[];
  users: any[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function LicenseFormModal({ isOpen, initialData, products, users, onClose, onSuccess }: LicenseFormModalProps) {
  const isEditing = !!initialData;
  const [licenseData, setLicenseData] = useState({
    userId: "",
    name: "",
    email: "",
    productId: "",
    licenseCount: 1,
    migrationLimit: 1,
    expiryDate: "",
    hwidSalt: "",
    isTrial: false,
    isActive: true,
    version: "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [generatedLicense, setGeneratedLicense] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Create mode: issue to an existing account, or create a User account first.
  const [clientMode, setClientMode] = useState<ClientMode>("existing");
  const [selectedClient, setSelectedClient] = useState<ClientDto | null>(null);
  const [newClient, setNewClient] = useState(emptyNewClient);
  // Set once the account exists, so a retry after a failed license doesn't try to create it again.
  const [createdClient, setCreatedClient] = useState<ClientDto | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [issueMode, setIssueMode] = useState<IssueMode>("product");
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [packageId, setPackageId] = useState("");
  const [packageResult, setPackageResult] = useState<CreatePackageLicensesResponse | null>(null);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const selectedPackage = packages.find((p) => p.id === packageId);

  // Devices (HWIDs). They live in JanDrozd, so they're added/removed through the HWID endpoints after the license
  // itself is saved; in edit mode only the difference from what the license already had is sent.
  // The HWID endpoints (POST/DELETE /api/licenses/admin/{id}/hwids) need licenses:manage.
  const { can, canField } = usePermissions();
  const canManageHwids = can(P.licenses.manage);
  const locked = (field: string) => isEditing && !canField("licenses", field);
  const [hwids, setHwids] = useState<string[]>([]);
  const [originalHwids, setOriginalHwids] = useState<string[]>([]);
  const [hwidInput, setHwidInput] = useState("");
  const [hwidReport, setHwidReport] = useState("");

  const topLevelProducts = products.filter(p => !p.parentProductId);

  const getVariants = (parentId: string) => {
    const parent = products.find(p => p.id === parentId);
    if (!parent) return [];
    if (parent.children && parent.children.length > 0) return parent.children;
    return products.filter(p => p.parentProductId === parentId);
  };

  const [selectedParentId, setSelectedParentId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setGeneratedLicense(null);
      setError("");
      setCopied(false);
      setClientMode("existing");
      setSelectedClient(null);
      setNewClient(emptyNewClient);
      setCreatedClient(null);
      setPasswordCopied(false);
      setHwids([]);
      setOriginalHwids([]);
      setHwidInput("");
      setHwidReport("");
      setIssueMode("product");
      setPackageId("");
      setPackageResult(null);

      // The license response carries its registered HWIDs, so editing starts from them.
      if (initialData?.janDrozdId) {
        const current: string[] = initialData.hwids ?? [];
        setHwids(current);
        setOriginalHwids(current);
      }

      if (initialData) {
        setLicenseData({
          userId: initialData.userId || "",
          name: initialData.name || "",
          email: initialData.email || "",
          productId: initialData.productId || "",
          licenseCount: initialData.licenseCount || 1,
          // ?? keeps a saved 0, so an untouched (or hidden) limit is sent back unchanged.
          migrationLimit: initialData.migrationLimit ?? 1,
          expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : "",
          hwidSalt: initialData.hwidSalt || "",
          isTrial: initialData.isTrial || false,
          isActive: initialData.isActive ?? true,
          version: initialData.version || "",
        });
        // A lifetime license shows an empty expiry date.
        if (initialData.willExpire === false) setLicenseData(prev => ({ ...prev, expiryDate: "" }));

        // Determine parent vs child
        const directMatch = products.find(p => p.id === initialData.productId);
        if (directMatch && !directMatch.parentProductId) {
          setSelectedParentId(directMatch.id || "");
        } else if (directMatch && directMatch.parentProductId) {
          setSelectedParentId(directMatch.parentProductId);
        } else {
          for (const p of products) {
            if (p.children?.some(c => c.id === initialData.productId)) {
              setSelectedParentId(p.id || "");
              break;
            }
          }
        }
      } else {
        setLicenseData({
          userId: "",
          name: "",
          email: "",
          productId: "",
          licenseCount: 1,
          migrationLimit: 1,
          expiryDate: "",
          hwidSalt: "",
          isTrial: false,
          isActive: true,
          version: "",
        });
        setSelectedParentId("");
      }
    }
  }, [isOpen, initialData, products, canManageHwids]);

  // Packages (hidden ones too) for issuing a whole package from the create form.
  useEffect(() => {
    if (!isOpen || isEditing) return;
    getApiPackages({ baseUrl, query: { includeHidden: true }, throwOnError: false })
      .then((res) => setPackages((res.data?.value ?? []).filter((p) => (p.items?.length ?? 0) > 0)))
      .catch(() => { /* the Package option just has nothing to pick */ });
  }, [isOpen, isEditing]);

  const availableVariants = selectedParentId ? getVariants(selectedParentId) : [];

  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    const variants = getVariants(parentId);
    let newVariantId = parentId;
    if (variants.length > 0) {
      newVariantId = variants[0].id || "";
    }
    setLicenseData(prev => ({ ...prev, productId: newVariantId }));
  };

  const handleVariantChange = (variantId: string) => {
    setLicenseData(prev => ({ ...prev, productId: variantId }));
  };

  const handleUserSelect = (userId: string) => {
    const selectedUser = users.find((u: any) => u.userId === userId || u.id === userId);
    setLicenseData(prev => ({
      ...prev,
      userId: userId,
      email: selectedUser ? (selectedUser.email || prev.email) : prev.email,
      name: selectedUser ? (selectedUser.userName || selectedUser.name || prev.name) : prev.name,
    }));
  };

  /** Whether HWIDs can be attached: the product (a variation counts through its parent) is linked to JanDrozd. */
  const productLinkedToJanDrozd = (() => {
    if (isEditing) return !!initialData?.janDrozdId;
    if (!licenseData.productId) return false;
    const direct = products.find((p) => p.id === licenseData.productId);
    const parent = direct?.parentProductId
      ? products.find((p) => p.id === direct.parentProductId)
      : products.find((p) => p.children?.some((c) => c.id === licenseData.productId));
    if (direct && !direct.parentProductId && !parent) return !!direct.janDrozdId;
    return !!(parent ?? direct)?.janDrozdId;
  })();
  const hwidsDisabledReason = !canManageHwids
    ? "You don't have permission to register devices."
    : !productLinkedToJanDrozd
      ? (isEditing ? "This license isn't in JanDrozd, so devices can't be registered." : "This product isn't linked to JanDrozd, so devices can't be registered.")
      : "";
  // Edit mode: fields the user can't change are hidden (their saved values are still sent). HWIDs have their own permission.
  const noneEditable = isEditing && !!hwidsDisabledReason
    && ["client", "product", "seats", "migrationLimit", "expiry", "trial", "active", "version"].every(locked);
  const seatLimit = Math.max(1, Number(licenseData.licenseCount) || 1);
  const tooManyHwids = !hwidsDisabledReason && hwids.length > seatLimit;

  const addHwidFromInput = () => {
    // Several can be pasted at once, one per line or comma-separated.
    const entered = hwidInput.split(/[\n,]+/).map((h) => h.trim()).filter(Boolean);
    if (entered.length === 0) return;
    setHwids((prev) => Array.from(new Set([...prev, ...entered])));
    setHwidInput("");
  };

  /** Removes HWIDs one by one, adds the new ones in a single call, and returns the ones that failed with the reason. */
  const syncHwids = async (licenseId: string, toAdd: string[], toRemove: string[]) => {
    type ApiErrors = { errors?: { description?: string | null }[] | null; title?: string; isError?: boolean };
    // Failed calls come back as a Result body (data) or a problem-details body (error); both list "errors".
    const failedReason = (res: { data?: unknown; error?: unknown }) => {
      const data = res.data as ApiErrors | undefined;
      const error = res.error as ApiErrors | undefined;
      if (!error && !data?.isError) return null;
      return [...(data?.errors ?? []), ...(error?.errors ?? [])].map((e) => e.description).filter(Boolean).join(", ")
        || error?.title || "failed";
    };
    const failures: string[] = [];
    for (const hwid of toRemove) {
      const why = failedReason(await deleteApiLicensesAdminByIdHwidsByHwid({ path: { id: licenseId, hwid }, throwOnError: false }));
      if (why) failures.push(`remove ${hwid} (${why})`);
    }
    if (toAdd.length > 0) {
      const res = await postApiLicensesAdminByIdHwids({ path: { id: licenseId }, body: { hwids: toAdd }, throwOnError: false });
      const why = failedReason(res);
      // The whole call failed, or JanDrozd accepted some and rejected the rest.
      const rejected = why ? toAdd : res.data?.value?.failed ?? [];
      for (const hwid of rejected) failures.push(`add ${hwid} (${why || "rejected by JanDrozd"})`);
    }
    return failures;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const issuingPackage = !isEditing && issueMode === "package";
    if (issuingPackage && !selectedPackage) {
      setError("Choose the package to issue.");
      return;
    }
    if (!issuingPackage && tooManyHwids) {
      setError(`This license allows ${seatLimit} device${seatLimit !== 1 ? "s" : ""}; remove some HWIDs or raise the license count.`);
      return;
    }
    setSaving(true);
    setError("");
    setHwidReport("");

    try {
      let userId = licenseData.userId;
      let email = licenseData.email;

      if (!isEditing) {
        if (clientMode === "existing") {
          if (!selectedClient?.userId) {
            setError("Choose the client account this license belongs to.");
            return;
          }
          userId = selectedClient.userId;
          email = licenseData.email || selectedClient.email || "";
        } else {
          let created = createdClient;
          if (!created) {
            const clientRes = await postIdentityClients({
              baseUrl,
              body: {
                email: newClient.email.trim(),
                userName: newClient.userName.trim(),
                password: newClient.password,
              },
              throwOnError: false,
            });
            created = clientRes.data?.value ?? null;
            if (!created || clientRes.data?.isError) {
              const err = clientRes.error as any;
              setError(
                clientRes.data?.errors?.map((e) => e.description).filter(Boolean).join(", ")
                  || err?.errors?.map?.((e: any) => e.description).filter(Boolean).join(", ")
                  || err?.title || err?.detail
                  || "Failed to create the client account."
              );
              return;
            }
            setCreatedClient(created);
          }
          userId = created.userId || "";
          email = created.email || newClient.email.trim();
        }
      }

      if (issuingPackage) {
        const res = await postApiLicensesPackage({
          baseUrl,
          body: {
            packageId,
            userId: userId || undefined,
            name: (clientMode === "new" ? newClient.userName.trim() : licenseData.name) || undefined,
            email: email || undefined,
            hwidSalt: (clientMode === "new" ? newClient.userName : licenseData.hwidSalt).trim(),
            licenseCount: Number(licenseData.licenseCount) || 1,
            migrationLimit: Number(licenseData.migrationLimit) || 1,
            isTrial: licenseData.isTrial,
          },
          throwOnError: false,
        });
        if (res.data?.isSuccess && res.data.value) {
          setPackageResult(res.data.value);
        } else {
          const err = res.error as { title?: string; errors?: { description?: string }[] } | undefined;
          const errorMsg = res.data?.errors?.map((e) => e.description).filter(Boolean).join(", ")
            || err?.errors?.map?.((e) => e.description).filter(Boolean).join(", ")
            || err?.title || "Failed to issue the package licenses.";
          setError(clientMode === "new"
            ? `The client account was created, but the licenses failed: ${errorMsg} Fix it and submit again; the account won't be created twice.`
            : errorMsg);
        }
        return;
      }

      const payload = {
        userId: userId || undefined,
        name: (!isEditing && clientMode === "new" ? newClient.userName.trim() : licenseData.name) || undefined,
        email: email || undefined,
        productId: licenseData.productId || undefined,
        licenseCount: Number(licenseData.licenseCount) || 1,
        migrationLimit: Number(licenseData.migrationLimit) || 1,
        expiryDate: licenseData.expiryDate ? new Date(licenseData.expiryDate).toISOString() : undefined,
        // The HWID salt is the client's username; for a new client it's the user name typed for the account.
        hwidSalt: (!isEditing && clientMode === "new" ? newClient.userName : licenseData.hwidSalt).trim(),
        isTrial: licenseData.isTrial,
      };

      let response: any;
      if (isEditing) {
        const editBody = {
          id: initialData.id,
          userId: licenseData.userId || undefined,
          productId: licenseData.productId || undefined,
          name: licenseData.name.trim(),
          email: licenseData.email.trim(),
          hwidSalt: licenseData.hwidSalt.trim(),
          licenseCount: Number(licenseData.licenseCount) || 1,
          migrationLimit: Math.max(0, Number(licenseData.migrationLimit) || 0),
          // Blank expiry = lifetime. A locked expiry is sent back as saved, so re-formatting it doesn't count as a change.
          ...(locked("expiry")
            ? { willExpire: initialData.willExpire ?? !!initialData.expiryDate, expiryDate: initialData.expiryDate ?? undefined }
            : { willExpire: !!licenseData.expiryDate, expiryDate: licenseData.expiryDate ? new Date(licenseData.expiryDate).toISOString() : undefined }),
          isTrial: licenseData.isTrial,
          isActive: licenseData.isActive,
          // An empty string clears it on the server. Serial and JanDrozd ID aren't sent, so they stay as issued.
          version: locked("version") ? initialData.version : licenseData.version.trim(),
        };
        response = await putApiLicensesById({
          path: { id: initialData.id },
          body: editBody,
          throwOnError: false
        });

        if (response.data !== undefined && response.error === undefined) {
          if (!hwidsDisabledReason) {
            const toAdd = hwids.filter((h) => !originalHwids.includes(h));
            const toRemove = originalHwids.filter((h) => !hwids.includes(h));
            const failures = await syncHwids(initialData.id, toAdd, toRemove);
            if (failures.length > 0) {
              // The license itself is saved; keep the form open so the devices can be retried.
              const ok = new Set([...originalHwids.filter((h) => !toRemove.includes(h) || failures.some((f) => f.startsWith(`remove ${h} `))),
                ...toAdd.filter((h) => !failures.some((f) => f.startsWith(`add ${h} `)))]);
              setOriginalHwids(Array.from(ok));
              setError(`License saved, but some devices weren't updated: ${failures.join("; ")}.`);
              onSuccess();
              return;
            }
          }
          onSuccess();
          onClose();
        } else if (response.error || response.data?.isError) {
          const errorMsg = response.error?.title || response.error?.detail || response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to update license.";
          setError(errorMsg);
        }
      } else {
        response = await postApiLicenses({ body: payload, throwOnError: false });

        if (response.data !== undefined && response.error === undefined) {
          const licenseObj = response.data?.value || response.data;
          if (hwids.length > 0 && !hwidsDisabledReason && licenseObj?.id) {
            if (!licenseObj.janDrozdId) {
              setHwidReport(`Devices not registered: the license wasn't issued through JanDrozd.`);
            } else {
              const failures = await syncHwids(licenseObj.id, hwids, []);
              const added = hwids.length - failures.length;
              setHwidReport(failures.length === 0
                ? `${added} device${added !== 1 ? "s" : ""} registered.`
                : `${added} of ${hwids.length} devices registered. Failed: ${failures.join("; ")}. Add them from the license's HWID list.`);
            }
          }
          setGeneratedLicense(licenseObj);
        } else if (response.error || response.data?.isError) {
          const errorMsg = response.error?.title || response.error?.detail || response.data?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to create license.";
          setError(clientMode === "new"
            ? `The client account was created, but the license failed: ${errorMsg} Fix it and submit again; the account won't be created twice.`
            : errorMsg);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the license.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (generatedLicense || packageResult) {
      onSuccess();
    }
    setGeneratedLicense(null);
    setPackageResult(null);
    onClose();
  };

  if (!isOpen) return null;

  const showLicenseEmail = isEditing || clientMode === "existing";

  const getProductName = (prodId?: string) => {
    if (!prodId) return "";
    const p = products.find(prod => prod.id === prodId);
    if (p) return p.name || "";
    for (const prod of products) {
      const child = prod.children?.find(c => c.id === prodId);
      if (child) return `${prod.name} - ${child.name}`;
    }
    return "";
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) handleClose(); }}>
      <div className="modal-container medium" style={{ maxWidth: generatedLicense || packageResult ? 560 : 620, overflow: "hidden" }}>
        
        {/* ── HEADER ─────────────────────────── */}
        <div className="modal-header" style={{
          background: "linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)",
          padding: "1.25rem 1.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--radius-md)",
              background: generatedLicense || packageResult ? "var(--success-dim)" : "var(--accent-dim)",
              color: generatedLicense || packageResult ? "var(--success)" : "var(--accent-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {generatedLicense || packageResult ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              )}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                {packageResult ? "Package Licenses Generated" : generatedLicense ? "License Generated Successfully" : isEditing ? "Edit License" : "Generate AGECS Serial"}
              </h2>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {packageResult ? `${packageResult.license?.licenses?.length ?? 0} serial${(packageResult.license?.licenses?.length ?? 0) !== 1 ? "s" : ""} issued for ${packageResult.license?.packageName ?? selectedPackage?.name ?? "the package"}` : generatedLicense ? "License key is active and ready to use" : isEditing ? "Update license configuration" : "Create and assign a new product serial"}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={handleClose} disabled={saving}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* ── PACKAGE SUCCESS VIEW ────────────── */}
        {packageResult ? (
          <div className="modal-body" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {createdClient && (
              <div className="lf-credentials">
                <p className="lf-credentials-title">New client account created</p>
                <dl style={{ margin: 0 }}>
                  <div className="lf-credential-row"><dt>Email</dt><dd>{createdClient.email}</dd></div>
                  <div className="lf-credential-row"><dt>User name</dt><dd>{createdClient.userName}</dd></div>
                  <div className="lf-credential-row"><dt>Password</dt><dd>{newClient.password}</dd></div>
                </dl>
              </div>
            )}

            {(packageResult.license?.licenses ?? []).map((l) => (
              <div key={l.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "0.85rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.75rem" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{l.productName || getProductName(l.productId) || "Product"}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    Expires {l.expiryDate ? new Date(l.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "never"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <code style={{ flex: 1, minWidth: 0, background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 700, wordBreak: "break-all", userSelect: "all" }}>
                    {l.serial || "N/A"}
                  </code>
                  <button type="button" className="btn-ghost" style={{ whiteSpace: "nowrap" }} disabled={!l.serial}
                    onClick={() => {
                      navigator.clipboard.writeText(l.serial || "");
                      setCopiedSerial(l.id ?? null);
                      setTimeout(() => setCopiedSerial(null), 2000);
                    }}>
                    {copiedSerial === l.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}

            {(packageResult.failed?.length ?? 0) > 0 && (
              <div className="alert-error" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                <strong>Not issued:</strong>
                {packageResult.failed!.map((f) => (
                  <span key={f.productId}>{f.productName || getProductName(f.productId) || f.productId}: {f.reason}</span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
              <button type="button" className="btn-primary" style={{ flex: 1 }}
                onClick={() => {
                  const text = (packageResult.license?.licenses ?? []).map((l) => `${l.productName || getProductName(l.productId)}: ${l.serial}`).join("\n");
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}>
                {copied ? "All serials copied!" : "Copy all serials"}
              </button>
              <button type="button" className="btn-ghost" style={{ minWidth: 100 }} onClick={handleClose}>Done</button>
            </div>
          </div>
        ) : generatedLicense ? (
          <div className="modal-body" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* Client Card */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem 1.25rem",
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: `hsl(${((generatedLicense.name || "C").charCodeAt(0) * 7) % 360}, 65%, 40%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#ffffff", fontWeight: 700, fontSize: "1.1rem",
                flexShrink: 0,
              }}>
                {(generatedLicense.name || generatedLicense.email || "C").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Serial Generated For
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {generatedLicense.name || "Client"}
                </div>
                {generatedLicense.email && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {generatedLicense.email}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                <span className="badge badge-success">Active</span>
                {generatedLicense.isTrial && <span className="badge badge-warning">Trial</span>}
              </div>
            </div>

            {/* New client account credentials (shown once) */}
            {createdClient && (
              <div className="lf-credentials">
                <p className="lf-credentials-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                  New client account created
                </p>
                <dl style={{ margin: 0 }}>
                  <div className="lf-credential-row"><dt>Email</dt><dd>{createdClient.email}</dd></div>
                  <div className="lf-credential-row"><dt>User name</dt><dd>{createdClient.userName}</dd></div>
                  <div className="lf-credential-row">
                    <dt>Password</dt>
                    <dd>{newClient.password}</dd>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                      onClick={() => {
                        navigator.clipboard.writeText(`Email: ${createdClient.email}\nPassword: ${newClient.password}`);
                        setPasswordCopied(true);
                        setTimeout(() => setPasswordCopied(false), 2000);
                      }}
                    >
                      {passwordCopied ? "Copied!" : "Copy login"}
                    </button>
                  </div>
                </dl>
              </div>
            )}

            {/* Serial Number Display Box */}
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--accent-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.25rem",
              position: "relative",
              boxShadow: "0 4px 20px var(--accent-glow)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Serial Key
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Click copy to clipboard
                </span>
              </div>
              <div style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1rem",
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "0.06em",
                wordBreak: "break-all",
                textAlign: "center",
                userSelect: "all",
              }}>
                {generatedLicense.serial || "N/A"}
              </div>
            </div>

            {/* Details Summary Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.2rem" }}>
                  {generatedLicense.productName || getProductName(generatedLicense.productId) || "Standard"}
                </div>
              </div>

              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expiry</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: generatedLicense.expiryDate ? "var(--text-primary)" : "var(--success)", marginTop: "0.2rem" }}>
                  {generatedLicense.expiryDate ? new Date(generatedLicense.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Lifetime"}
                </div>
              </div>

              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Seats / Migrations</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.2rem" }}>
                  {generatedLicense.licenseCount ?? 1} Seat{(generatedLicense.licenseCount ?? 1) !== 1 ? "s" : ""} • {generatedLicense.migrationLimit ?? 1} Mig.
                </div>
              </div>
            </div>

            {hwidReport && (
              <div className={hwidReport.includes("Failed") || hwidReport.startsWith("Devices not") ? "alert-error" : ""}
                style={hwidReport.includes("Failed") || hwidReport.startsWith("Devices not") ? undefined : { fontSize: "0.85rem", color: "var(--success)", fontWeight: 600 }}>
                {hwidReport}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn-primary"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.25rem",
                }}
                onClick={() => {
                  navigator.clipboard.writeText(generatedLicense.serial || "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Serial Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy Serial Key</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-ghost"
                style={{ minWidth: 100, padding: "0.75rem 1.25rem" }}
                onClick={handleClose}
              >
                Done
              </button>
            </div>

          </div>
        ) : (
          /* ── FORM VIEW ───────────────────────── */
          <>
            <div className="modal-body" style={{ padding: "1.75rem" }}>
              {error && (
                <div className="alert-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              
              <form id="licenseForm" onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  
                  {/* Client: existing account or a new one (create mode) */}
                  {!isEditing && (
                    <div className="lf-client">
                      <div className="lf-client-head">
                        <p className="lf-client-title">Client account</p>
                        <div className="lf-toggle" role="tablist" aria-label="Client account">
                          <button type="button" role="tab" aria-selected={clientMode === "existing"} className={clientMode === "existing" ? "is-active" : ""}
                            disabled={!!createdClient} onClick={() => setClientMode("existing")}>
                            Existing client
                          </button>
                          <button type="button" role="tab" aria-selected={clientMode === "new"} className={clientMode === "new" ? "is-active" : ""}
                            onClick={() => setClientMode("new")}>
                            New client
                          </button>
                        </div>
                      </div>

                      {clientMode === "existing" ? (
                        <ClientPicker
                          value={selectedClient}
                          onChange={(client) => {
                            setSelectedClient(client);
                            setLicenseData(prev => ({
                              ...prev,
                              userId: client?.userId || "",
                              email: client?.email || "",
                              name: prev.name || (client?.userName && client.userName !== client.email ? client.userName : ""),
                              hwidSalt: client?.userName || "",
                            }));
                          }}
                        />
                      ) : createdClient ? (
                        <p className="lf-note is-success">
                          Account <strong>{createdClient.email}</strong> was created. Submit again to issue the license.
                        </p>
                      ) : (
                        <>
                          <div className="lf-grid-2">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label htmlFor="newClientEmail" className="form-label">Email *</label>
                              <input id="newClientEmail" type="email" className="form-input" required placeholder="client@company.com" autoComplete="off"
                                value={newClient.email} onChange={(e) => setNewClient(c => ({ ...c, email: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label htmlFor="newClientUserName" className="form-label" title="Also used as the license's HWID salt">User name * <span style={{ textTransform: "none", fontWeight: 500, opacity: 0.7 }}>(HWID salt)</span></label>
                              <input id="newClientUserName" type="text" className="form-input" required maxLength={256} placeholder="e.g. Ahmed Ali" autoComplete="off"
                                value={newClient.userName} onChange={(e) => setNewClient(c => ({ ...c, userName: e.target.value }))} />
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label htmlFor="newClientPassword" className="form-label">Password *</label>
                            <input id="newClientPassword" type="text" className="form-input" required minLength={6} autoComplete="new-password"
                              placeholder="At least 6 characters"
                              value={newClient.password} onChange={(e) => setNewClient(c => ({ ...c, password: e.target.value }))} />
                          </div>
                          <p className="lf-note">A member account (User) is created first, then the license is issued to it. The client signs in with the email.</p>
                        </>
                      )}
                    </div>
                  )}

                  {noneEditable && (
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>You don&apos;t have permission to edit any field here.</p>
                  )}

                  {/* User Selection (edit mode) */}
                  {isEditing && !locked("client") && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="userId" className="form-label">Select User Account</label>
                    <select
                      id="userId"
                      className="form-input"
                      value={licenseData.userId}
                      onChange={(e) => handleUserSelect(e.target.value)}
                      style={{ appearance: "auto" }}
                    >
                      <option value="">Choose an existing user (optional)...</option>
                      {users.map((u: any) => (
                        <option key={u.userId || u.id} value={u.userId || u.id}>
                          {u.email} {u.userName ? `(${u.userName})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  )}

                  {/* Name & Email. A new client's license uses the account's user name and email instead. */}
                  {showLicenseEmail && !locked("client") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="name" className="form-label">Client Name *</label>
                      <input
                        id="name"
                        type="text"
                        className="form-input"
                        placeholder="e.g. John Doe"
                        value={licenseData.name}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="email" className="form-label">License Email</label>
                      <input
                        id="email"
                        type="email"
                        className="form-input"
                        placeholder="user@example.com"
                        value={licenseData.email}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  )}

                  {/* HWID salt = the client's username: required, no default; fixed once the license exists.
                      For a new client the account's User name is used, so the field is only shown for existing clients. */}
                  {(isEditing || clientMode === "existing") && !locked("client") && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="hwidSalt" className="form-label">Username (HWID salt) *</label>
                      <input
                        id="hwidSalt"
                        type="text"
                        className="form-input"
                        required
                        maxLength={500}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Filled from the selected client's username"
                        value={licenseData.hwidSalt}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, hwidSalt: e.target.value }))}
                        style={{ fontFamily: "var(--font-mono)" }}
                      />
                    </div>
                  )}

                  {/* Product or package (create mode) */}
                  {!isEditing && (
                    <div className="lf-client-head">
                      <p className="lf-client-title">Issue for</p>
                      <div className="lf-toggle" role="tablist" aria-label="Issue for">
                        <button type="button" role="tab" aria-selected={issueMode === "product"} className={issueMode === "product" ? "is-active" : ""}
                          onClick={() => setIssueMode("product")}>
                          Product
                        </button>
                        <button type="button" role="tab" aria-selected={issueMode === "package"} className={issueMode === "package" ? "is-active" : ""}
                          onClick={() => setIssueMode("package")} disabled={packages.length === 0} title={packages.length === 0 ? "No packages with items yet" : undefined}>
                          Package
                        </button>
                      </div>
                    </div>
                  )}

                  {!isEditing && issueMode === "package" ? (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="packageId" className="form-label">Package *</label>
                      <select id="packageId" className="form-input" value={packageId} onChange={(e) => setPackageId(e.target.value)} required style={{ appearance: "auto" }}>
                        <option value="">Select a package...</option>
                        {packages.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}{p.hidden ? " (hidden)" : ""}</option>
                        ))}
                      </select>
                      {selectedPackage && (
                        <ul style={{ margin: "0.6rem 0 0", padding: "0.6rem 0.85rem", listStyle: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem" }}>
                          {(selectedPackage.items ?? []).map((item) => (
                            <li key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                              <span>{getProductName(item.itemId) || item.itemName || "Product"}</span>
                              <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{itemPeriodLabel(item)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="lf-note">One license is issued per item, each expiring after its own period. Seats, migrations and trial below apply to all of them.</p>
                    </div>
                  ) : locked("product") ? null : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="parentProductId" className="form-label">Product *</label>
                      <select 
                        id="parentProductId" 
                        className="form-input" 
                        value={selectedParentId} 
                        onChange={(e) => handleParentChange(e.target.value)} 
                        required 
                        style={{ appearance: "auto" }}
                      >
                        <option value="">Select a product...</option>
                        {topLevelProducts.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} {p.version ? `(${p.version})` : ""}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="variantId" className="form-label">Variant</label>
                      <select 
                        id="variantId" 
                        className="form-input" 
                        value={licenseData.productId} 
                        onChange={(e) => handleVariantChange(e.target.value)} 
                        style={{ appearance: "auto" }}
                        disabled={!selectedParentId || availableVariants.length === 0}
                      >
                        {availableVariants.length === 0 ? (
                          <option value={selectedParentId || ""}>Parent product (no variant)</option>
                        ) : (
                          availableVariants.map((v: any) => (
                            <option key={v.id} value={v.id}>{v.name} {v.version ? `(${v.version})` : ""}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                  )}

                  {/* License Count & Migration Limit */}
                  {!(locked("seats") && locked("migrationLimit")) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {!locked("seats") && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="licenseCount" className="form-label">License Count (Seats) *</label>
                      <input
                        id="licenseCount"
                        type="number"
                        min="1"
                        className="form-input"
                        value={licenseData.licenseCount}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, licenseCount: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    )}
                    {!locked("migrationLimit") && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="migrationLimit" className="form-label">Migration Limit *</label>
                      <input
                        id="migrationLimit"
                        type="number"
                        min="0"
                        className="form-input"
                        value={licenseData.migrationLimit}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, migrationLimit: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    )}
                  </div>
                  )}

                  {/* Expiry (a package's licenses use each item's period) */}
                  {(isEditing || issueMode === "product") && !locked("expiry") && (
                  <div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="expiryDate" className="form-label">Expiry Date (Blank = Lifetime)</label>
                      <input
                        id="expiryDate"
                        type="date"
                        className="form-input"
                        value={licenseData.expiryDate}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  )}

                  {/* Devices (HWIDs); a package issues several licenses, so devices are added per license afterwards */}
                  {(isEditing || issueMode === "product") && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <label htmlFor="hwidInput" className="form-label">Devices / HWIDs (optional)</label>
                      {!hwidsDisabledReason && (
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: tooManyHwids ? "var(--danger)" : "var(--text-muted)" }}>
                          {hwids.length} / {seatLimit}
                        </span>
                      )}
                    </div>
                    {hwidsDisabledReason ? (
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{hwidsDisabledReason}</p>
                    ) : (
                      <>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input
                            id="hwidInput"
                            type="text"
                            className="form-input"
                            placeholder="Paste a HWID and press Enter"
                            value={hwidInput}
                            onChange={(e) => setHwidInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHwidFromInput(); } }}
                            style={{ fontFamily: "var(--font-mono)" }}
                          />
                          <button type="button" className="btn-ghost" onClick={addHwidFromInput} disabled={!hwidInput.trim()}>Add</button>
                        </div>
                        {hwids.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                            {hwids.map((h) => (
                              <span key={h} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.3rem 0.2rem 0.6rem", borderRadius: "999px", border: "1px solid var(--border)", background: "var(--bg-elevated)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", maxWidth: "100%" }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={h}>{h}</span>
                                <button type="button" onClick={() => setHwids((prev) => prev.filter((x) => x !== h))} aria-label={`Remove ${h}`} title="Remove"
                                  style={{ border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: "0 0.2rem", lineHeight: 1, fontSize: "1rem" }}>×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <p style={{ margin: "0.35rem 0 0", fontSize: "0.76rem", color: tooManyHwids ? "var(--danger)" : "var(--text-muted)" }}>
                          {tooManyHwids
                            ? `More devices than the license count (${seatLimit}). Remove some or raise the count.`
                            : isEditing ? "Removing a device here unregisters it in JanDrozd when you save." : "Registered in JanDrozd right after the license is created."}
                        </p>
                      </>
                    )}
                  </div>
                  )}

                  {/* Trial Toggle */}
                  {!locked("trial") && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    background: "var(--bg-elevated)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}>
                    <input
                      id="isTrialCheckbox"
                      type="checkbox"
                      checked={licenseData.isTrial}
                      onChange={(e) => setLicenseData(prev => ({ ...prev, isTrial: e.target.checked }))}
                      style={{ width: "18px", height: "18px", accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                    <label htmlFor="isTrialCheckbox" style={{ fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)", fontWeight: 500 }}>
                      Mark as Trial License (Evaluation / Demo)
                    </label>
                  </div>
                  )}

                  {isEditing && (
                    <>
                      {/* Active toggle: off = revoked */}
                      {!locked("active") && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        background: "var(--bg-elevated)",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${licenseData.isActive ? "var(--border)" : "rgba(220,38,38,0.35)"}`,
                      }}>
                        <input
                          id="isActiveCheckbox"
                          type="checkbox"
                          checked={licenseData.isActive}
                          onChange={(e) => setLicenseData(prev => ({ ...prev, isActive: e.target.checked }))}
                          style={{ width: "18px", height: "18px", accentColor: "var(--accent)", cursor: "pointer" }}
                        />
                        <label htmlFor="isActiveCheckbox" style={{ fontSize: "0.875rem", cursor: "pointer", color: "var(--text-primary)", fontWeight: 500 }}>
                          License is active {licenseData.isActive ? "" : "(revoked — the client can't use it)"}
                        </label>
                      </div>
                      )}

                      {!locked("version") && (
                      <button type="button" className="btn-ghost" onClick={() => setShowAdvanced(v => !v)} style={{ alignSelf: "flex-start", fontSize: "0.8rem" }}>
                        {showAdvanced ? "Hide version" : "Show version"}
                      </button>
                      )}

                      {showAdvanced && !locked("version") && (
                        <div className="form-group" style={{ marginBottom: 0, maxWidth: 220 }}>
                          <label htmlFor="version" className="form-label">Version</label>
                          <input id="version" type="text" className="form-input" maxLength={100} placeholder="e.g. 26"
                            value={licenseData.version} onChange={(e) => setLicenseData(prev => ({ ...prev, version: e.target.value }))} />
                        </div>
                      )}
                    </>
                  )}

                </div>
              </form>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={handleClose} disabled={saving}>
                Cancel
              </button>
              <button
                type="submit"
                form="licenseForm"
                className="btn-primary"
                disabled={saving || noneEditable}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {saving ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }}></span>
                    <span>Saving...</span>
                  </>
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span>{issueMode === "package" ? "Generate Package Serials" : "Generate Serial"}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
