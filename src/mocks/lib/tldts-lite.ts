// Stand-in for `tldts` inside the simulated backend's bundle (vite.config.ts
// aliases it). MSW's cookie store (tough-cookie) only calls getDomain() to
// scope cookies, and the simulated API sends no cookies (the session is a
// Bearer token), so the full Public Suffix List (~190 kB) is not shipped.
// Limitation: multi-label public suffixes (e.g. "co.uk") are not recognized.

/** Registrable domain: the last two labels ("kurio.test"), or null for IPs and single labels. */
export function getDomain(hostname: string): string | null {
  if (!hostname || hostname.includes(":") || /^[\d.]+$/.test(hostname)) return null;
  const labels = hostname.split(".").filter(Boolean);
  return labels.length >= 2 ? labels.slice(-2).join(".") : null;
}
