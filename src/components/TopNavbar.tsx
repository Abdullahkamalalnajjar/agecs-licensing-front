"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import StudentUpgradeModal from "./StudentUpgradeModal";
import CartSidebar from "./CartSidebar";
import { getApiV1CartsMyCart } from "@/client";
import Image from "next/image";
import { ThemeSwitcher } from "./ThemeSwitcher";

const navItems = [
  { name: "Home", path: "/home" },
  { name: "Licenses", path: "/licenses" },
  { name: "Products", path: "/products" },
  { name: "Promocodes", path: "/promocodes" },
  { name: "Tickets", path: "/tickets" },
  { name: "Categories", path: "/ticket-categories" },
  { name: "Users", path: "/users" },
  { name: "Profile", path: "/profile" },
];

function TopNavbarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showPromoBar, setShowPromoBar] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Fetch cart count on load if user is logged in
  useEffect(() => {
    const fetchCartCount = () => {
      if (user) {
        getApiV1CartsMyCart().then(res => {
          if (res.data?.value?.items) {
            setCartItemCount(res.data.value.items.length);
          }
        }).catch(err => console.error("Error fetching cart count:", err));
      }
    };

    fetchCartCount();

    // Listen for custom event from other components (like Add to Cart)
    window.addEventListener("cartUpdated", fetchCartCount);
    return () => {
      window.removeEventListener("cartUpdated", fetchCartCount);
    };
  }, [user, isCartOpen]); // Refresh count when cart closes as well

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
  };

  const handleUpgradeSuccess = () => {
    setShowUpgradeModal(false);
    window.location.reload();
  };

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item => {
    if (!user) {
      return item.name === "Products";
    }
    if (user?.role === "Student" || user?.role === "NormalUser") {
      return item.name === "Home" || item.name === "Tickets" || item.name === "Products" || item.name === "Profile";
    }
    return true; // SuperAdmin/Admin sees all
  });

  return (
    <>
      {showPromoBar && (
        <div className="promo-bar" style={{ position: 'relative', paddingRight: '3rem' }}>
          <span className="discount">20% OFF</span>
          Your First Year License for nanoCAD 26
          <a href="#products" className="buy">Buy Now</a>
          <button
            onClick={() => setShowPromoBar(false)}
            aria-label="Dismiss"
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.75rem',
              lineHeight: 1,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            ✕
          </button>
        </div>
      )}
      <header className="site-header">
        <div className="container nav">
          {/* Brand */}
          <div className="navbar-brand-section">
            <Link href="/home" style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src="/agecs-logo-color.png"
                alt="AGECS Software Solutions"
                className="brand-logo-img"
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
          </div>

          <nav className="menu desktop-only">
            {filteredNavItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={isActive ? "current" : ""}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* ── RIGHT TOOLS ── */}
          <div className="right-tools">

{/* 1. User identity pill & Dropdown menu */}
            {user && (
              <div className="desktop-only" style={{ position: 'relative' }}>
                <div 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.25rem 0.75rem 0.25rem 0.5rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    background: 'rgba(148, 163, 184, 0.06)',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.06)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)'; }}
                >
                  {/* Text: email + role badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1, textAlign: 'right' }}>
                    <span 
                      className="profile-email-text"
                      style={{
                        fontSize: '0.8rem', fontWeight: 600,
                        maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                      {user.email}
                    </span>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 800,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      color: user.role === 'SuperAdmin' ? '#c084fc'
                           : user.role === 'SystemAdmin' ? '#8b5cf6'
                           : user.role === 'Admin' ? '#3b82f6'
                           : user.role === 'Student' ? '#eab308'
                           : user.role === 'Sales' ? '#10b981'
                           : user.role === 'Support' ? '#14b8a6'
                           : 'var(--text-secondary)',
                    }}>
                      {user.role}
                    </span>
                  </div>

                  {/* Avatar circle */}
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0,
                    letterSpacing: '0.02em',
                    boxShadow: '0 2px 8px rgba(59,130,246,0.35), inset 0 1px 2px rgba(255,255,255,0.25)',
                    userSelect: 'none',
                    marginLeft: '2px'
                  }}>
                    {(user.email || '').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Dropdown Chevron */}
                  <svg style={{ marginLeft: '4px', color: 'var(--text-muted)', transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <>
                    <div 
                      onClick={() => setIsProfileMenuOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                    />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                      minWidth: '220px', padding: '0.5rem',
                      background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset',
                      zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.25rem',
                      animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      transformOrigin: 'top right'
                    }}>
                      
                      {/* Triangle pointer */}
                      <div style={{
                        position: 'absolute', top: '-6px', right: '16px',
                        width: '12px', height: '12px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        borderLeft: '1px solid rgba(255,255,255,0.1)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        transform: 'rotate(45deg)',
                        zIndex: -1
                      }} />

                      {user?.role !== "Admin" && (
                        <div style={{ padding: '0.65rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>Appearance</span>
                          <ThemeSwitcher />
                        </div>
                      )}
                      
                      {user?.role !== "Admin" && <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />}

                      <button
                        onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem',
                          padding: '0.65rem 0.75rem', borderRadius: '8px', border: 'none',
                          background: 'transparent', color: '#f87171',
                          fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.2s ease', textAlign: 'left'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#f87171'; }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
{/* 2. Thin divider */}
            {user && <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0, margin: '0 0.1rem' }} />}
            {/* 3. Currency */}
            <div className="currency">EGP</div>

            {/* 4. Cart icon */}
            {user && (
              <button
                onClick={() => setIsCartOpen(true)}
                title="View Cart"
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer', position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0.45rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartItemCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '0px', right: '0px',
                    background: '#ef4444', color: 'white',
                    fontSize: '0.6rem', fontWeight: 800,
                    padding: '0.08rem 0.32rem',
                    borderRadius: '999px', minWidth: '15px', textAlign: 'center',
                    lineHeight: 1.4,
                  }}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Upgrade button (kept in navbar) */}
            {user && user.role === "NormalUser" && (
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  style={{
                    padding: '0.38rem 1rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    borderRadius: '8px', cursor: 'pointer',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: '#fff',
                    letterSpacing: '0.02em',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.55)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.35)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  ✦ Upgrade
                </button>
              </div>
            )}

                        {/* Sign In (guest) */}
            {!user && (
              <button
                onClick={() => router.push("/login")}
                className="hl-btn btn-blue desktop-only"
                style={{ minHeight: '36px', padding: '0 1.25rem', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <nav className="mobile-nav">
            {filteredNavItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`mobile-nav-link ${isActive ? "active" : ""}`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mobile-nav-footer">

            {user && (
              <div style={{ marginBottom: "1rem", padding: "1rem", background: "var(--bg-elevated)", borderRadius: "16px", border: "1px solid var(--border)", width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem', flexShrink: 0, boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
                    {(user.email || '').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: '160px', fontSize: '0.9rem' }}>{user.email}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px", fontWeight: 500 }}>Role: {user.role}</div>
                  </div>
                </div>
                {user.role === "NormalUser" && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowUpgradeModal(true);
                    }}
                    style={{ padding: '0.75rem', width: '100%', fontSize: '0.9rem', borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', fontWeight: 700, boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
                  >
                    ✦ Upgrade to Student
                  </button>
                )}
              </div>
            )}

            {!user ? (
              <button onClick={() => router.push("/login")} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}>
                Sign In
              </button>
            ) : (
              <button onClick={handleLogout} className="btn-danger-ghost" style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}>
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <StudentUpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={handleUpgradeSuccess}
        />
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
}

export default function TopNavbar() {
  return <TopNavbarInner />;
}
