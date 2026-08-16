"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { name: "Products", path: "/products", icon: "📦" },
    { name: "Promocodes", path: "/promocodes", icon: "🏷️" },
    { name: "Tickets", path: "/tickets", icon: "🎫" },
    { name: "Categories", path: "/ticket-categories", icon: "📁" },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Agecs</h2>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Licensing</span>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link key={item.path} href={item.path} className={`sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-icon">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-link" style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", color: "#ef4444" }}>
          <span className="sidebar-icon">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
