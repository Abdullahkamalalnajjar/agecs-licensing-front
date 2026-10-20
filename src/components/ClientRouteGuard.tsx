"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, usePermissions } from "./AuthProvider";
import { permissionForPath } from "@/lib/permissions";

// Pages customers can open (their licenses and tickets are tabs on their profile, but the pages still work).
const CUSTOMER_PATHS = ["/home", "/tickets", "/products", "/profile", "/checkout", "/licenses"];

/**
 * Keeps people on the pages they're allowed: customers on the customer pages, staff on the dashboard sections
 * their permissions include (the API enforces the same permissions on every request).
 */
export function ClientRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { can, isStaff } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = pathname.startsWith("/products") || pathname === "/home";
  const needed = permissionForPath(pathname);
  const allowed = !user ? isPublic
    : !isStaff ? CUSTOMER_PATHS.some((p) => pathname.startsWith(p))
    // Customers open /licenses and /tickets for their own items; staff need the section's permission.
    : !needed || can(needed);

  useEffect(() => {
    if (loading || isPublic) return;
    if (!user) { router.push("/login"); return; }
    if (!allowed) router.push("/home");
  }, [user, loading, pathname, router, isPublic, allowed]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-base)" }}>
        <div className="spinner" style={{ width: "24px", height: "24px", borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  if (isPublic) return <>{children}</>;
  // Don't flash a page while redirecting away from it.
  if (!user || !allowed) return null;

  return <>{children}</>;
}
