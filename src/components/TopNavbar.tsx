"use client";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import StudentUpgradeModal from "./StudentUpgradeModal";
import CartSidebar from "./CartSidebar";
import { getApiV1CartsMyCart, getApiProducts } from "@/client";
import type { ProductDto } from "@/client/types.gen";
import Image from "next/image";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useCurrency, CURRENCIES, SupportedCurrency } from "@/context/CurrencyContext";

const navItems = [
  { name: "Home", path: "/home" },
  { name: "Licenses", path: "/licenses" },
  { name: "Products", path: "/products" },
  { name: "Packages", path: "/packages" },
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
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const { currency, setCurrency, currentCurrencyMeta } = useCurrency();

  // Products dropdown
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [activeCompanyTab, setActiveCompanyTab] = useState<"AGECS" | "NanoCAD">("AGECS");
  const [navProducts, setNavProducts] = useState<ProductDto[]>([]);
  const [navProductsLoaded, setNavProductsLoaded] = useState(false);
  const productsDropdownRef = useRef<HTMLDivElement>(null);
  const productsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productsSubmenuRef = useRef<HTMLDivElement>(null);
  const [activeParent, setActiveParent] = useState<{ id: string; top: number } | null>(null);

  const fetchNavProducts = useCallback(() => {
    if (navProductsLoaded) return;
    getApiProducts({ query: { includeHidden: false }, throwOnError: false })
      .then(res => {
        if (res.data?.value) {
          setNavProducts(res.data.value.filter(p => !p.parentProductId));
          setNavProductsLoaded(true);
        }
      })
      .catch(() => {});
  }, [navProductsLoaded]);

  const handleProductsMouseEnter = () => {
    if (productsTimeoutRef.current) clearTimeout(productsTimeoutRef.current);
    fetchNavProducts();
    setIsProductsDropdownOpen(true);
  };

  const handleProductsMouseLeave = () => {
    productsTimeoutRef.current = setTimeout(() => {
      setIsProductsDropdownOpen(false);
      setActiveParent(null);
    }, 200);
  };

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
      return item.name === "Home" || item.name === "Licenses" || item.name === "Tickets" || item.name === "Products" || item.name === "Profile";
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
              <BrandLogo height={34} alt="AGECS Software Solutions" />
            </Link>
          </div>

          <nav className="menu desktop-only">
            {filteredNavItems.map((item) => {
              const isActive = pathname.startsWith(item.path);

              // Products gets a special dropdown
              if (item.name === "Products") {
                return (
                  <div
                    key={item.path}
                    ref={productsDropdownRef}
                    className="nav-products-trigger"
                    onMouseEnter={handleProductsMouseEnter}
                    onMouseLeave={handleProductsMouseLeave}
                    style={{ position: 'relative' }}
                  >
                    {/* Opens the dropdown only; it does not navigate. An <a> without href keeps the navbar link styling. */}
                    <a
                      role="button"
                      tabIndex={0}
                      aria-haspopup="menu"
                      aria-expanded={isProductsDropdownOpen}
                      className={isActive ? "current" : ""}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => {
                        fetchNavProducts();
                        setIsProductsDropdownOpen(true);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          fetchNavProducts();
                          setIsProductsDropdownOpen(open => !open);
                        } else if (e.key === 'Escape') {
                          setIsProductsDropdownOpen(false);
                        }
                      }}
                    >
                      {item.name}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isProductsDropdownOpen ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
                    </a>

                    {isProductsDropdownOpen && (() => {
                      const agecsProducts = navProducts.filter(p => p.company !== "NanoCAD");
                      const nanocadProducts = navProducts.filter(p => p.company === "NanoCAD");
                      const activeProducts = activeCompanyTab === "AGECS" ? agecsProducts : nanocadProducts;

                      const companies = [
                        { key: "AGECS" as const, label: "AGECS", icon: "🏗️", products: agecsProducts },
                        { key: "NanoCAD" as const, label: "NanoCAD", icon: "✏️", products: nanocadProducts },
                      ];
                      const activeIndex = companies.findIndex(c => c.key === activeCompanyTab);
                      const submenuTop = activeIndex * 28;
                      const activeParentProduct = activeParent ? activeProducts.find(p => p.id === activeParent.id) : undefined;
                      const chevron = (
                        <svg className="pmd-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
                      );

                      return (
                        <div
                          className="pmd-wrap"
                          onMouseEnter={() => { if (productsTimeoutRef.current) clearTimeout(productsTimeoutRef.current); }}
                          onMouseLeave={handleProductsMouseLeave}
                        >
                          {/* Main menu: companies */}
                          <div className="pmd-menu" role="menu">
                            {companies.map(c => (
                              <button
                                key={c.key}
                                type="button"
                                role="menuitem"
                                aria-haspopup="menu"
                                aria-expanded={activeCompanyTab === c.key}
                                className={`pmd-item ${activeCompanyTab === c.key ? "pmd-item-active" : ""}`}
                                onMouseEnter={() => { setActiveCompanyTab(c.key); setActiveParent(null); }}
                                onFocus={() => { setActiveCompanyTab(c.key); setActiveParent(null); }}
                              >
                                <span className="pmd-item-icon">{c.icon}</span>
                                <span className="pmd-item-label">{c.label}</span>
                                {navProductsLoaded && <span className="pmd-item-meta">{c.products.length}</span>}
                                {chevron}
                              </button>
                            ))}
                          </div>

                          {/* Submenu: products of the hovered company */}
                          <div
                            ref={productsSubmenuRef}
                            className="pmd-menu pmd-submenu"
                            role="menu"
                            style={{ top: submenuTop }}
                            onScroll={() => setActiveParent(null)}
                          >
                            {!navProductsLoaded ? (
                              <div className="pmd-item pmd-item-disabled">Loading…</div>
                            ) : activeProducts.length === 0 ? (
                              <div className="pmd-item pmd-item-disabled">No products yet</div>
                            ) : (
                              activeProducts.map(product => {
                                const hasChildren = !!product.children && product.children.length > 0;
                                const isOpen = activeParent?.id === product.id;
                                return (
                                  <Link
                                    key={product.id}
                                    href={`/products/${product.id}`}
                                    role="menuitem"
                                    aria-haspopup={hasChildren ? "menu" : undefined}
                                    aria-expanded={hasChildren ? isOpen : undefined}
                                    className={`pmd-item ${isOpen ? "pmd-item-active" : ""}`}
                                    onMouseEnter={e => {
                                      if (!hasChildren || !product.id) { setActiveParent(null); return; }
                                      const scroll = productsSubmenuRef.current?.scrollTop ?? 0;
                                      // offsetTop includes the submenu's 5px padding; the variations menu has the same padding.
                                      setActiveParent({ id: product.id, top: submenuTop + e.currentTarget.offsetTop - scroll - 5 });
                                    }}
                                    onClick={() => setIsProductsDropdownOpen(false)}
                                  >
                                    <span className="pmd-item-label">{product.name}</span>
                                    {hasChildren && chevron}
                                  </Link>
                                );
                              })
                            )}
                          </div>

                          {/* Third level: variations of the hovered parent product */}
                          {activeParentProduct && activeParentProduct.children && activeParentProduct.children.length > 0 && (
                            <div
                              key={activeParentProduct.id}
                              className="pmd-menu pmd-submenu pmd-submenu-2"
                              role="menu"
                              style={{ top: activeParent!.top }}
                            >
                              {activeParentProduct.children.map(child => (
                                <Link
                                  key={child.id}
                                  href={`/products/${activeParentProduct.id}`}
                                  role="menuitem"
                                  className="pmd-item"
                                  onClick={() => setIsProductsDropdownOpen(false)}
                                >
                                  <span className="pmd-item-label">{child.name}</span>
                                  {child.version && <span className="pmd-item-meta">v{child.version}</span>}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              }

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
            {/* 3. Currency Switcher */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.3rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s', letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <span>{currentCurrencyMeta.flag}</span>
                <span>{currentCurrencyMeta.label}</span>
                <svg style={{ color: 'var(--text-muted)', transform: isCurrencyMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              </button>

              {isCurrencyMenuOpen && (
                <>
                  <div onClick={() => setIsCurrencyMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    minWidth: '140px', padding: '0.4rem',
                    background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(12px)', borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100,
                    display: 'flex', flexDirection: 'column', gap: '0.15rem',
                  }}>
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { setCurrency(c.code as SupportedCurrency); setIsCurrencyMenuOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.55rem 0.75rem', borderRadius: '8px', border: 'none',
                          background: currency === c.code ? 'rgba(59,130,246,0.15)' : 'transparent',
                          color: currency === c.code ? '#60a5fa' : '#e2e8f0',
                          fontSize: '0.85rem', fontWeight: currency === c.code ? 700 : 500,
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (currency !== c.code) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        onMouseLeave={e => { if (currency !== c.code) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span>{c.flag}</span>
                        <span>{c.label}</span>
                        {currency === c.code && (
                          <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

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
