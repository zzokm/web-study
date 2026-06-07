/** Container / dev ports that must not appear in public lecture links. */
export const INTERNAL_CONTAINER_PORTS = new Set(["3000", "7821"]);

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function hasInternalPortOnPublicHost(
  hostname: string,
  port: string
): boolean {
  return Boolean(
    port && INTERNAL_CONTAINER_PORTS.has(port) && !isLocalHostname(hostname)
  );
}

/** Remove internal container ports from a full origin string. */
export function stripInternalPortFromOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (hasInternalPortOnPublicHost(url.hostname, url.port)) {
      url.port = "";
      return url.origin;
    }
    return origin;
  } catch {
    return origin;
  }
}

/**
 * Canonical site origin for analytics and redirects.
 * Prefer NEXT_PUBLIC_SITE_URL in production builds; always strip internal ports.
 */
export function getPublicOrigin(): string {
  if (typeof window === "undefined") return "";

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return stripInternalPortFromOrigin(fromEnv);

  const { protocol, hostname, port } = window.location;
  if (hasInternalPortOnPublicHost(hostname, port)) {
    return `${protocol}//${hostname}`;
  }
  return window.location.origin;
}

/** Same-origin asset path; avoid prefixing window.location.origin (keeps :3000 out of PDF URLs). */
export function sameOriginAssetPath(path: string): string {
  if (path.startsWith("http")) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export function absolutePublicUrl(path: string): string {
  if (path.startsWith("http")) return sanitizePublicUrl(path);
  const origin = getPublicOrigin();
  const normalized = sameOriginAssetPath(path);
  return origin ? `${origin}${normalized}` : normalized;
}

/** Normalize any absolute URL so public hosts never keep container ports. */
export function sanitizePublicUrl(url: string, base?: string): string {
  try {
    const parsed = new URL(
      url,
      base ?? (typeof window !== "undefined" ? window.location.href : undefined)
    );
    if (hasInternalPortOnPublicHost(parsed.hostname, parsed.port)) {
      parsed.port = "";
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/** True when the browser URL uses an internal port on a non-local host. */
export function shouldRedirectFromContainerPort(): boolean {
  if (typeof window === "undefined") return false;
  const { hostname, port } = window.location;
  return hasInternalPortOnPublicHost(hostname, port);
}

export function canonicalPathFromLocation(
  loc: Pick<Location, "pathname" | "search" | "hash"> = typeof window !== "undefined"
    ? window.location
    : { pathname: "/", search: "", hash: "" }
): string {
  return `${loc.pathname}${loc.search}${loc.hash}`;
}

export function canonicalPublicUrl(): string {
  return `${getPublicOrigin()}${canonicalPathFromLocation()}`;
}

/** Hard reload on the canonical origin (used after deploy chunk failures). */
export function reloadOnCleanOrigin(
  path: string = canonicalPathFromLocation()
): void {
  if (typeof window === "undefined") return;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  window.location.replace(`${getPublicOrigin()}${normalized}`);
}
