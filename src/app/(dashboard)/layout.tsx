import Sidebar from "@/components/Sidebar";
import { ClientRouteGuard } from "@/components/ClientRouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientRouteGuard>
      <div className="dashboard-container">
        <Sidebar />
        <main className="dashboard-main">
          <div className="dashboard-content">
            {children}
          </div>
        </main>
      </div>
    </ClientRouteGuard>
  );
}
