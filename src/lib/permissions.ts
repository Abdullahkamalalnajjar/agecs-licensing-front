/**
 * Permission strings, the same as the API's Permissions class. The signed-in user's come from
 * GET /identity/my-permissions, the same permissions the API checks on every request.
 * Each dashboard section has :read (show it), :create (add), :update (edit, reorder, hide, images) and :delete.
 */
export const P = {
  dashboard: { read: "dashboard:read" },
  licenses: { read: "licenses:read", create: "licenses:create", update: "licenses:update", delete: "licenses:delete", manage: "licenses:manage" },
  products: { read: "products:read", create: "products:create", update: "products:update", delete: "products:delete" },
  catalog: { read: "catalog:read", create: "catalog:create", update: "catalog:update", delete: "catalog:delete" },
  offers: { read: "offers:read", create: "offers:create", update: "offers:update", delete: "offers:delete" },
  partners: { read: "partners:read", create: "partners:create", update: "partners:update", delete: "partners:delete" },
  promoBars: { read: "promo-bars:read", create: "promo-bars:create", update: "promo-bars:update", delete: "promo-bars:delete" },
  heroSlides: { read: "hero-slides:read", create: "hero-slides:create", update: "hero-slides:update", delete: "hero-slides:delete" },
  overviews: { read: "overviews:read", update: "overviews:update", delete: "overviews:delete" },
  packages: { read: "packages:read", create: "packages:create", update: "packages:update", delete: "packages:delete" },
  promocodes: { read: "promocodes:read", create: "promocodes:create", update: "promocodes:update", delete: "promocodes:delete" },
  tickets: { read: "tickets:read", update: "tickets:update" },
  ticketCategories: { read: "ticket-categories:read", create: "ticket-categories:create", update: "ticket-categories:update", delete: "ticket-categories:delete" },
  users: { read: "users:read", create: "users:create", update: "users:update", delete: "users:delete" },
  roles: { read: "roles:read", create: "roles:create", update: "roles:update", delete: "roles:delete" },
} as const;

/** Dashboard pages and the permission that shows them. */
export const SECTION_PERMISSIONS: { path: string; permission: string }[] = [
  { path: "/licenses", permission: P.licenses.read },
  { path: "/partners", permission: P.partners.read },
  { path: "/promo-bars", permission: P.promoBars.read },
  { path: "/hero-slides", permission: P.heroSlides.read },
  { path: "/overviews", permission: P.overviews.read },
  { path: "/catalog", permission: P.catalog.read },
  { path: "/packages", permission: P.packages.read },
  { path: "/offers", permission: P.offers.read },
  { path: "/promocodes", permission: P.promocodes.read },
  { path: "/ticket-categories", permission: P.ticketCategories.read },
  { path: "/tickets", permission: P.tickets.read },
  { path: "/users", permission: P.users.read },
  { path: "/roles", permission: P.roles.read },
];

/** Staff = can open at least one dashboard section (customers have none). */
export const isStaff = (permissions: readonly string[]) =>
  permissions.includes(P.dashboard.read) || permissions.includes(P.products.read)
  || SECTION_PERMISSIONS.some((s) => permissions.includes(s.permission));

/** The permission a dashboard path needs, or null for pages anyone signed in can open. */
export const permissionForPath = (pathname: string) =>
  SECTION_PERMISSIONS.find((s) => pathname === s.path || pathname.startsWith(`${s.path}/`))?.permission ?? null;
