"use client";

import { P } from "@/lib/permissions";
import { usePermissions } from "@/components/AuthProvider";
import { useState } from "react";
import { postApiPackagesByIdImages, deleteApiPackagesByIdImagesByImageId, putApiPackagesByIdImagesReorder } from "@/client";
import type { PackageDto, PackageImageDto } from "@/client/types.gen";
import { useToast } from "@/components/ToastProvider";
import { resolveMediaUrl } from "@/lib/mediaUrl";

type PackageImagesModalProps = {
  pkg: PackageDto | null; // null = closed
  onClose: () => void;
  /** Called with the package's images (in order) after every change, so the table stays in sync. */
  onChange: (packageId: string, images: PackageImageDto[]) => void;
};

const errorText = (data: unknown, fallback: string) =>
  (data as { errors?: { description?: string | null }[] | null } | undefined)?.errors
    ?.map((e) => e.description)
    .filter(Boolean)
    .join(", ") || fallback;

export default function PackageImagesModal({ pkg, onClose, onChange }: PackageImagesModalProps) {
  const { can, canField } = usePermissions();
  const canCreate = can(P.packages.create);
  const canReorder = canField("packages", "images");
  const canDelete = can(P.packages.delete);
  const [busy, setBusy] = useState(false);
  const { success, error: toastError } = useToast();

  if (!pkg?.id) return null;
  const packageId = pkg.id;
  const images = (pkg.images ?? [])
    .filter((img, i, all) => all.findIndex((other) => other.id === img.id) === i)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (files.some((f) => !f.type.startsWith("image/"))) {
      toastError("Please choose image files only.");
      return;
    }
    try {
      setBusy(true);
      const res = await postApiPackagesByIdImages({ path: { id: packageId }, body: { Files: files }, throwOnError: false });
      if (res.error || res.data?.isError) {
        toastError(errorText(res.data ?? res.error, "Failed to upload images."));
        return;
      }
      onChange(packageId, res.data?.value ?? []);
      success(files.length === 1 ? "Image uploaded." : `${files.length} images uploaded.`);
    } catch (err) {
      toastError((err instanceof Error && err.message) || "Error uploading images.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (image: PackageImageDto) => {
    if (!image.id) return;
    try {
      setBusy(true);
      const res = await deleteApiPackagesByIdImagesByImageId({ path: { id: packageId, imageId: image.id }, throwOnError: false });
      if (res.error || res.data?.isError) {
        toastError(errorText(res.data ?? res.error, "Failed to remove image."));
        return;
      }
      onChange(packageId, images.filter((i) => i.id !== image.id));
      success("Image removed.");
    } catch (err) {
      toastError((err instanceof Error && err.message) || "Error removing image.");
    } finally {
      setBusy(false);
    }
  };

  // Saves a new order; the first image becomes the cover. Rolls back if the save fails.
  const saveOrder = async (reordered: PackageImageDto[]) => {
    const withOrder = reordered.map((img, i) => ({ ...img, order: i }));
    onChange(packageId, withOrder);
    try {
      setBusy(true);
      const res = await putApiPackagesByIdImagesReorder({
        path: { id: packageId },
        body: { imageIds: withOrder.map((i) => i.id!).filter(Boolean) },
        throwOnError: false,
      });
      if (res.error || res.data?.isError) {
        onChange(packageId, images);
        toastError(errorText(res.data ?? res.error, "Failed to save the new order."));
      }
    } catch (err) {
      onChange(packageId, images);
      toastError((err instanceof Error && err.message) || "Error saving the new order.");
    } finally {
      setBusy(false);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    saveOrder(reordered);
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    const reordered = [...images];
    const [image] = reordered.splice(index, 1);
    saveOrder([image, ...reordered]);
  };

  const iconButton: React.CSSProperties = {
    width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-surface)",
    color: "var(--text-secondary)", cursor: busy ? "wait" : "pointer", padding: 0,
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">Images · {pkg.name}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="modal-body">
          <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            The first image is the cover shown in package lists. Use the arrows or “Make cover” to change the order.
          </p>

          {images.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem 1rem" }}>
              <p className="empty-state-title">No images yet</p>
              <p className="empty-state-sub">Upload one or more images for this package</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem" }}>
              {images.map((image, index) => (
                <div key={image.id} style={{ border: `1px solid ${index === 0 ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--bg-elevated)" }}>
                  <div style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveMediaUrl(image.url ?? "")} alt="" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }} />
                    {index === 0 && (
                      <span className="badge badge-success" style={{ position: "absolute", top: "0.4rem", left: "0.4rem" }}>Cover</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem" }}>
                    {canReorder && (
                      <>
                        <button type="button" style={{ ...iconButton, opacity: index === 0 ? 0.35 : 1 }} disabled={busy || index === 0} onClick={() => move(index, -1)} title="Move earlier" aria-label="Move earlier">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        <button type="button" style={{ ...iconButton, opacity: index === images.length - 1 ? 0.35 : 1 }} disabled={busy || index === images.length - 1} onClick={() => move(index, 1)} title="Move later" aria-label="Move later">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      </>
                    )}
                    {canReorder && index !== 0 && (
                      <button type="button" className="btn-ghost" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} disabled={busy} onClick={() => makeCover(index)}>
                        Make cover
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" style={{ ...iconButton, marginLeft: "auto", color: "var(--danger)" }} disabled={busy} onClick={() => handleDelete(image)} title="Remove image" aria-label="Remove image">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Done</button>
          {canCreate && (
            <label className="btn-primary" style={{ cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
              {busy ? "Working…" : "Upload images"}
              <input type="file" accept="image/*" multiple disabled={busy} onChange={handleUpload} style={{ display: "none" }} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
