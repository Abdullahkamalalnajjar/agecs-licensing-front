"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeProvider, useTheme, type Theme } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import StudentUpgradeModal from "./StudentUpgradeModal";
import CartSidebar from "./CartSidebar";
import { getApiV1CartsMyCart } from "@/client";

const navItems = [
  // { name: "Dashboard", path: "/dashboard" },
  // { name: "Licenses", path: "/licenses" },
  { name: "Products", path: "/products" },
  // { name: "Promocodes", path: "/promocodes" },
  // { name: "Tickets", path: "/tickets" },
  { name: "Categories", path: "/ticket-categories" },
  // { name: "Users", path: "/users" },
  { name: "Profile", path: "/profile" },
];

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    ),
  },
  {
    value: "glass",
    label: "Glass",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/>
        <path d="M12 2a10 10 0 0 1 7 17"/><path d="M12 2a10 10 0 0 0-4 19.2"/>
      </svg>
    ),
  },
];

function TopNavbarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

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
      return false;
    }
    if ((user?.role === "Admin" || user?.role === "SuperAdmin") && item.name === "Dashboard") {
      return false;
    }
    return true;
  });

  return (
    <>
      <header className="top-navbar">
        <div className="navbar-container">
          {/* Brand */}
          <div className="navbar-brand-section">
            <div className="navbar-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="navbar-brand">
              <span className="navbar-brand-name">AGECS Software Solutions</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="navbar-nav desktop-only">
            {filteredNavItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`navbar-link ${isActive ? "active" : ""}`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="navbar-actions desktop-only">
            {/* Cart Icon */}
            {user && (
              <button 
                onClick={() => setIsCartOpen(true)}
                title="View Cart"
                style={{ 
                  background: 'transparent', border: 'none', color: 'var(--text-primary)', 
                  cursor: 'pointer', position: 'relative', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', padding: '0.5rem',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartItemCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '2px', right: '0px',
                    background: 'var(--primary-color, #3b82f6)', color: 'white',
                    fontSize: '0.65rem', fontWeight: 'bold', padding: '0.1rem 0.35rem',
                    borderRadius: '999px', minWidth: '16px', textAlign: 'center'
                  }}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Theme switcher */}
            <div className="theme-switcher-inline" title="Switch theme">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  id={`theme-${opt.value}`}
                  className={`theme-btn-inline ${theme === opt.value ? "active" : ""}`}
                  onClick={() => setTheme(opt.value)}
                  title={opt.label}
                >
                  {opt.icon}
                </button>
              ))}
            </div>

            {user && user.role !== "Student" && user.role !== "NormalUser" && (
              <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="user-email">{user.email}</span>
                  <span className="user-role">{user.role}</span>
                </div>
              </div>
            )}

            {!user ? (
              <button onClick={() => router.push("/login")} className="btn-primary btn-sm">
                Sign In
              </button>
            ) : (
              <button onClick={handleLogout} className="btn-danger-ghost btn-sm">
                Sign Out
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
          {navItems.filter((item) => {
            if (user?.role === "Student" || user?.role === "NormalUser") return false;
            if ((user?.role === "Admin" || user?.role === "SuperAdmin") && item.name === "Dashboard") return false;
            return true;
          }).map((item) => {
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
            <div className="theme-switcher" title="Switch theme" style={{ marginBottom: "1rem", display: 'flex', width: '100%' }}>
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  id={`theme-${opt.value}-mobile`}
                  className={`theme-btn ${theme === opt.value ? "active" : ""}`}
                  onClick={() => setTheme(opt.value)}
                  title={opt.label}
                  style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: '0.25rem', padding: '0.5rem' }}
                >
                  {opt.icon} <span style={{fontSize: '0.75rem'}}>{opt.label}</span>
                </button>
              ))}
            </div>

            {user && (
              <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: "8px", fontSize: "0.85rem", width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "2px" }}>Role: {user.role}</div>
                {user.role === "NormalUser" && (
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowUpgradeModal(true);
                    }}
                    className="btn-primary" 
                    style={{ padding: '0.5rem', width: '100%', fontSize: '0.875rem', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Upgrade to Student
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
  return (
    <ThemeProvider>
      <TopNavbarInner />
    </ThemeProvider>
  );
}
