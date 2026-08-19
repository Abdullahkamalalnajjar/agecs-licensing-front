/**
 * Resolves a media URL from the backend.
 *
 * The backend stores paths like `/uploads/products/xxx.webp`.
 * This helper prefixes them with NEXT_PUBLIC_API_URL so the correct
 * server is used in both local dev and production.
 *
 * - If the url is already absolute (http/https) it is returned as-is.
 * - If the url is relative it is joined with the API base URL.
 * - If url is null/undefined an empty string is returned.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base =
    (process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:5003").replace(/\/$/, "");

  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}
