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
  const [promoError, setPromoError] = useState("");
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
      setPromoError("");
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
      setPromoError("");
      const res = await postApiV1CartsMyCartPromocode({ body: { promocode: promoCode } });
      
      if (res.error) {
        const errObj = res.error as any;
        const msg = errObj?.description || errObj?.title || "Invalid promo code";
        setPromoError(msg);
      } else if ((res.data as any)?.isError) {
        const errs = (res.data as any)?.errors;
        const msg = errs?.map((e: any) => e.description).join(", ") || "Invalid promo code";
        setPromoError(msg);
      } else {
        await fetchCart();
      }
    } catch (error: any) {
      console.error("Error applying promocode:", error);
      setPromoError(error?.message || "Error applying promo code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    try {
      setIsApplyingPromo(true);
      setPromoError("");
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
          position: "fixed", inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          zIndex: 9998,
          transition: "opacity 0.3s ease",
        }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "420px", maxWidth: "100%",
          backgroundColor: "var(--bg-elevated)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 30px rgba(0,0,0,0.15)",
          zIndex: 9999,
          display: "flex", flexDirection: "column",
          padding: "1.5rem 1.8rem",
          overflowY: "auto",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ padding: '0.4rem', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', color: '#3b82f6' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Your Cart</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--text-secondary)", cursor: "pointer",
              padding: "0.4rem", borderRadius: "8px", transition: "all 0.2s",
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {isLoading && !cart ? (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: "var(--text-muted)" }}>
              <svg className="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading cart...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              {(!cart?.items || cart.items.length === 0) ? (
                <div style={{ flex: 1, display: "flex", flexDirection: 'column', alignItems: 'center', justifyContent: "center", color: "var(--text-muted)", padding: '2rem' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '1rem' }}>
                    <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Your cart is empty</span>
                  <span style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Looks like you haven't added anything yet.</span>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "1rem 1.25rem",
                      backgroundColor: "var(--bg-base)",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                  >
                    <div>
                      <h4 style={{ margin: "0 0 0.35rem 0", color: "var(--text-primary)", fontSize: '1rem', fontWeight: 700 }}>{item.itemName}</h4>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                        Qty: {item.quantity} • Period: {formatPeriod(item.period)}
                      </p>
                      <p style={{ margin: "0.5rem 0 0 0", fontWeight: 800, fontSize: '1.15rem', color: "var(--primary-color)" }}>
                        ${item.unitPrice?.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "0.6rem",
                        borderRadius: "8px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                      title="Remove Item"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              <div style={{ marginBottom: "1.5rem", padding: "1.25rem", backgroundColor: "var(--bg-base)", borderRadius: "12px", border: "1px dashed var(--border)" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", color: "var(--text-primary)", fontSize: '0.9rem', fontWeight: 600 }}>Promo Code</h4>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      if (promoError) setPromoError("");
                    }}
                    placeholder="Enter code"
                    disabled={!!cart?.promocode || isApplyingPromo}
                    style={{
                      flex: 1,
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: promoError ? "1px solid #ef4444" : "1px solid var(--border)",
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      fontSize: '0.9rem',
                      outline: "none",
                      transition: 'border 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => !promoError && !cart?.promocode && (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.3)')}
                    onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                  />
                  {cart?.promocode ? (
                    <button
                      onClick={handleRemovePromo}
                      disabled={isApplyingPromo}
                      style={{ padding: "0 1.2rem", borderRadius: "8px", border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyPromo}
                      disabled={isApplyingPromo || !promoCode.trim()}
                      style={{ padding: "0 1.2rem", borderRadius: "8px", border: 'none', background: promoCode.trim() ? '#3b82f6' : 'var(--border)', color: promoCode.trim() ? '#fff' : 'var(--text-muted)', fontWeight: 600, cursor: promoCode.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}
                      onMouseEnter={e => { if (promoCode.trim()) e.currentTarget.style.background = '#2563eb'; }}
                      onMouseLeave={e => { if (promoCode.trim()) e.currentTarget.style.background = '#3b82f6'; }}
                    >
                      {isApplyingPromo ? "..." : "Apply"}
                    </button>
                  )}
                </div>
                {promoError && (
                  <p style={{ margin: "0.5rem 0 0 0", color: "#ef4444", fontSize: "0.8rem", fontWeight: 500 }}>
                    {promoError}
                  </p>
                )}
              </div>
            )}

            {/* Total & Checkout */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 500 }}>Total amount</span>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: '-0.02em' }}>
                  ${cart?.calculatedTotal?.toFixed(2) || "0.00"}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || !cart?.items || cart.items.length === 0}
                style={{ 
                  width: "100%", padding: "1rem", fontSize: "1.05rem", borderRadius: "10px", fontWeight: 700,
                  border: 'none', cursor: (!cart?.items || cart.items.length === 0) ? 'not-allowed' : 'pointer',
                  background: (!cart?.items || cart.items.length === 0) ? 'var(--border)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: (!cart?.items || cart.items.length === 0) ? 'var(--text-muted)' : '#fff',
                  boxShadow: (!cart?.items || cart.items.length === 0) ? 'none' : '0 4px 12px rgba(59,130,246,0.3)',
                  transition: 'all 0.2s',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                }}
                onMouseEnter={e => { if (cart?.items && cart.items.length > 0) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.4)'; } }}
                onMouseLeave={e => { if (cart?.items && cart.items.length > 0) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)'; } }}
              >
                {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
                {!isCheckingOut && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );

}
