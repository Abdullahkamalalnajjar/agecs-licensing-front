"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="dashboard-container">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="dashboard-main">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div style={{ marginLeft: "1rem", fontWeight: 600, fontSize: "1.1rem" }}>
            Agecs
          </div>
        </div>

        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
