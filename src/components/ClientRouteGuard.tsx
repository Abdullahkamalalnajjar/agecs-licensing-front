"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function ClientRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role === "Student") {
      // Students can access tickets and products
      if (!pathname.startsWith("/tickets") && !pathname.startsWith("/products")) {
        router.push("/products");
      }
    }
    // SuperAdmin/Admin can access everything, no redirect needed
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-base)" }}>
        <div className="spinner" style={{ width: "24px", height: "24px", borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  // Prevent flash of unauthorized content
  if (user?.role === "Student" && !pathname.startsWith("/tickets") && !pathname.startsWith("/products")) {
    return null;
  }

  return <>{children}</>;
}
