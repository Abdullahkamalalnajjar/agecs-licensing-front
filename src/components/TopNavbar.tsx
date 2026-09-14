"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import StudentUpgradeModal from "./StudentUpgradeModal";
import CartSidebar from "./CartSidebar";
import { getApiV1CartsMyCart } from "@/client";
import Image from "next/image";
import { ThemeToggleButton } from "./ThemeToggleButton";

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
      <header className="top-navbar">
        <div className="navbar-container">
          {/* Brand */}
          <div className="navbar-brand-section">
            <Image
              src="/agecs-logo-gray.png"
              alt="AGECS Software Solutions"
              width={140}
              height={50}
              className="brand-logo"
            />
          </div>

          <div className="promo-bar" style={{ borderBottom: 'none', background: 'transparent', flex: 1, minHeight: 'unset', padding: '0 1rem' }}>
            <span className="discount">20% OFF</span>
            <span className="desktop-only" style={{ fontSize: '12px' }}>Your First Year License for nanoCAD 26</span>
            <Link href="/home#products" className="buy" style={{ padding: '4px 12px', fontSize: '11px' }}>Buy Now</Link>
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
                    background: '#CF4500', color: 'white',
                    fontSize: '0.65rem', fontWeight: 'bold', padding: '0.1rem 0.35rem',
                    borderRadius: '999px', minWidth: '16px', textAlign: 'center'
                  }}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            <ThemeToggleButton />

            {user && (
              <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="user-email">{user.email}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                {user.role === "NormalUser" && (
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="btn-primary" 
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '20px', cursor: 'pointer' }}
                  >
                    Upgrade to Student
                  </button>
                )}
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
          {navItems.map((item) => {
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
              <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#F4F4F4", borderRadius: "20px", fontSize: "0.85rem", width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "2px" }}>Role: {user.role}</div>
                {user.role === "NormalUser" && (
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowUpgradeModal(true);
                    }}
                    className="btn-primary" 
                    style={{ padding: '0.5rem', width: '100%', fontSize: '0.875rem', borderRadius: '20px', cursor: 'pointer' }}
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
  return <TopNavbarInner />;
}
