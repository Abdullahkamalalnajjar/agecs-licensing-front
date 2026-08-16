import { ClientRouteGuard } from "@/components/ClientRouteGuard";
import { DashboardLayoutWrapper } from "@/components/DashboardLayoutWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientRouteGuard>
      <DashboardLayoutWrapper>
        {children}
      </DashboardLayoutWrapper>
    </ClientRouteGuard>
  );
}
