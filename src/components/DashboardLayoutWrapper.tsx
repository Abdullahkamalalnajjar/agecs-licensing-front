"use client";

import TopNavbar from "./TopNavbar";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";
import { usePermissions } from "./AuthProvider";

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isStaff } = usePermissions();
  const pathname = usePathname();
  const isHome = pathname === "/home" || pathname === "/";
  // Anyone with a dashboard section gets the sidebar layout.
  const isAdminLayout = isStaff;

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
        <div className={isHome ? "landing-content" : "dashboard-content"}>
          {children}
        </div>
      </main>
    </div>
  );
}
