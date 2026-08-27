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

    // Allow /products routes without auth (public browsing)
    if (pathname.startsWith("/products")) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if ((user.role === "Student" || user.role === "NormalUser")) {
      // Students can access tickets, products, and profile
      if (!pathname.startsWith("/tickets") && !pathname.startsWith("/products") && !pathname.startsWith("/profile")) {
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

  // Allow /products pages for everyone (including unauthenticated)
  if (pathname.startsWith("/products")) {
    return <>{children}</>;
  }

  // Prevent flash of unauthorized content
  if ((user?.role === "Student" || user?.role === "NormalUser") && !pathname.startsWith("/tickets") && !pathname.startsWith("/products") && !pathname.startsWith("/profile")) {
    return null;
  }

  return <>{children}</>;
}
