// Stand-in for tldts (aliased in vite.config.ts): MSW only uses it for cookies,
// which the mock API never sets

export function getDomain(hostname: string): string | null {
  if (!hostname || hostname.includes(":") || /^[\d.]+$/.test(hostname)) return null;
  const labels = hostname.split(".").filter(Boolean);
  return labels.length >= 2 ? labels.slice(-2).join(".") : null;
}
