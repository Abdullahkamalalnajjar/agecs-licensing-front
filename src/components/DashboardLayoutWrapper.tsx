"use client";

import TopNavbar from "./TopNavbar";
import Sidebar from "./Sidebar";
import { useAuth } from "./AuthProvider";

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isAdminLayout = user?.role === "Admin" || user?.role === "SuperAdmin";

  return (
    <div className={`dashboard-container ${isAdminLayout ? 'dashboard-sidebar-layout' : ''}`}>
      {!isAdminLayout && <TopNavbar />}
      {isAdminLayout && (
        <>
          <div className="desktop-only-sidebar">
            <Sidebar />
          </div>
          <div className="mobile-only-topbar">
            <TopNavbar />
          </div>
        </>
      )}
      
      <main className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
