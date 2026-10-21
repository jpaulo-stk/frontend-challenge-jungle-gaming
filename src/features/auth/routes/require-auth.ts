import { redirect, type ParsedLocation } from "@tanstack/react-router";

import { readSession } from "@/features/auth/api/session-stub";

/** `beforeLoad` guard for private routes; keeps the target so login can resume it. */
export function requireAuth(location: ParsedLocation): void {
  if (readSession()) return;
  throw redirect({ to: "/entrar", search: { redirect: location.href } });
}
