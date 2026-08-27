"use client";

import { useEffect, useState } from "react";
import {
  getApiV1CartsMyCart,
  deleteApiV1CartsMyCartItemsByItemId,
  postApiV1CartsMyCartPromocode,
  deleteApiV1CartsMyCartPromocode,
  CartDto
} from "@/client";
// Using the explicit method name provided by the user instruction
// If it's not generated yet, you will need to regenerate your OpenAPI client
// import { postApiV1CheckoutCart } from "@/client";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatPeriod = (days?: number | null) => {
  if (!days) return "Lifetime";
  if (days % 365 === 0) return `${days / 365} Year${days / 365 > 1 ? "s" : ""}`;
  if (days % 30 === 0) return `${days / 30} Month${days / 30 > 1 ? "s" : ""}`;
  if (days % 7 === 0) return `${days / 7} Week${days / 7 > 1 ? "s" : ""}`;
  return `${days} Day${days > 1 ? "s" : ""}`;
};


export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const [cart, setCart] = useState<CartDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const res = await getApiV1CartsMyCart();
      if (res.data?.value) {
        setCart(res.data.value);
        if (res.data.value.promocode) {
          setPromoCode(res.data.value.promocode);
        }
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  const handleRemoveItem = async (itemId?: string) => {
    if (!itemId) return;
    try {
      await deleteApiV1CartsMyCartItemsByItemId({ path: { itemId } });
      await fetchCart();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      setIsApplyingPromo(true);
      await postApiV1CartsMyCartPromocode({ body: { promocode: promoCode } });
      await fetchCart();
    } catch (error) {
      console.error("Error applying promocode:", error);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    try {
      setIsApplyingPromo(true);
      await deleteApiV1CartsMyCartPromocode();
      setPromoCode("");
      await fetchCart();
    } catch (error) {
      console.error("Error removing promocode:", error);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleCheckout = async () => {
    if (!cart?.id) return;
    try {
      setIsCheckingOut(true);
      // As requested by user instruction:
      // await postApiV1CheckoutCart({ body: { cartId: cart.id, provider: "System", method: "Free" } });
      alert("Checkout triggered! Please ensure postApiV1CheckoutCart is available in the generated client.");
      onClose();
    } catch (error) {
      console.error("Error during checkout:", error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "400px",
          maxWidth: "100%",
          backgroundColor: "var(--bg-elevated)",
          boxShadow: "-4px 0 15px rgba(0,0,0,0.2)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem",
          overflowY: "auto",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)" }}>Your Cart</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              cursor: "pointer",
              padding: "0.5rem",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {isLoading && !cart ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Loading cart...</span>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              {(!cart?.items || cart.items.length === 0) ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  Your cart is empty.
                </div>
              ) : (
                cart.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      backgroundColor: "var(--bg-base)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div>
                      <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--text-primary)" }}>{item.itemName}</h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Qty: {item.quantity} | Period: {formatPeriod(item.period)}
                      </p>
                      <p style={{ margin: "0.25rem 0 0 0", fontWeight: 600, color: "var(--primary-color)" }}>
                        ${item.unitPrice?.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--danger-color, #ef4444)",
                        cursor: "pointer",
                        padding: "0.5rem",
                      }}
                      title="Remove Item"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Promo Code Section */}
            {cart?.items && cart.items.length > 0 && (
              <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--bg-base)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>Promo Code</h4>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    disabled={!!cart?.promocode || isApplyingPromo}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                    }}
                  />
                  {cart?.promocode ? (
                    <button
                      onClick={handleRemovePromo}
                      disabled={isApplyingPromo}
                      className="btn-danger-ghost btn-sm"
                      style={{ padding: "0.5rem 1rem", borderRadius: "6px" }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyPromo}
                      disabled={isApplyingPromo || !promoCode.trim()}
                      className="btn-primary"
                      style={{ padding: "0.5rem 1rem", borderRadius: "6px" }}
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Total & Checkout */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>Total:</span>
                <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary-color)" }}>
                  ${cart?.calculatedTotal?.toFixed(2) || "0.00"}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || !cart?.items || cart.items.length === 0}
                className="btn-primary"
                style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", borderRadius: "8px", fontWeight: 600 }}
              >
                {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
