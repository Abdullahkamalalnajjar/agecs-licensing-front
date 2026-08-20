"use client";

import TopNavbar from "./TopNavbar";

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-container">
      <TopNavbar />
      
      <main className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
