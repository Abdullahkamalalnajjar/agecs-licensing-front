"use client";

import { useEffect, useState } from "react";
import { getApiProductsById, postApiPaymentsRenewByLicenseIdCheckout } from "@/client";
import type { PayablePriceDto } from "@/client/types.gen";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";

interface RenewalCheckoutModalProps {
  isOpen: boolean;
  licenseId: string;
  productId: string;
  onClose: () => void;
}

const formatPeriod = (price: PayablePriceDto) => {
  const n = price.period ?? 1;
  const unit = price.periodType ?? "Day";
  return `${n} ${unit}${n > 1 ? "s" : ""}`;
};

export default function RenewalCheckoutModal({ isOpen, licenseId, productId, onClose }: RenewalCheckoutModalProps) {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [prices, setPrices] = useState<PayablePriceDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    getApiProductsById({ path: { id: productId }, throwOnError: false })
      .then((res) => {
        const active = (res.data?.value?.prices ?? []).filter((p) => p.active);
        setPrices(active);
      })
      .catch(() => toastError("Could not load renewal prices"))
      .finally(() => setIsLoading(false));
  }, [isOpen, productId, toastError]);

  if (!isOpen) return null;

  const handleSelectPrice = async (price: PayablePriceDto) => {
    if (!price.id) return;
    try {
      setIsSubmitting(price.id);

      const [firstName, ...rest] = (user?.email?.split("@")[0] ?? "Customer").split(".");

      const res = await postApiPaymentsRenewByLicenseIdCheckout({
        path: { licenseId },
        body: {
          resourceId: price.id,
          provider: "stripe",
          method: "card",
          currency: "EGP",
          billingData: {
            firstName: firstName || "Customer",
            lastName: rest.join(" ") || "NA",
            email: user?.email ?? "",
            phoneNumber: "NA",
          },
          redirectionUrl: `${window.location.origin}/checkout/success`,
        },
        throwOnError: false,
      });

      const session = res.data?.value;
      if (res.error || !session?.paymentPageUrl) {
        const errObj = res.error as any;
        const msg = errObj?.errors?.[0]?.description || errObj?.description || errObj?.title || "Could not start renewal checkout";
        toastError(msg);
        return;
      }

      if (session.paymentId) {
        try {
          sessionStorage.setItem("lastPaymentId", session.paymentId);
        } catch {
          /* ignore */
        }
      }

      window.location.href = session.paymentPageUrl;
    } catch (err: any) {
      toastError(err?.message || "Error starting renewal checkout");
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-container" style={{ maxWidth: 440, overflow: "hidden" }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontSize: "1.1rem", margin: 0 }}>Renew license</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Choose a renewal period. You&apos;ll be redirected to Stripe to complete the payment.
          </p>

          {isLoading && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>Loading prices…</div>
          )}

          {!isLoading && prices.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
              No renewal prices are configured for this product.
            </div>
          )}

          {!isLoading &&
            prices.map((price) => (
              <button
                key={price.id}
                onClick={() => handleSelectPrice(price)}
                disabled={!!isSubmitting}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.9rem 1.1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  cursor: isSubmitting ? "wait" : "pointer",
                  textAlign: "left",
                }}
              >
                <span>
                  <strong>{formatPeriod(price)}</strong>
                  {price.country && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>({price.country})</span>}
                </span>
                <span style={{ fontWeight: 700 }}>
                  {isSubmitting === price.id ? "Redirecting…" : `${price.price?.toFixed(2)}`}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
