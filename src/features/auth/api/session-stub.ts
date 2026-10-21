import type { Session } from "@/features/auth/api/schemas";

/**
 * Temporary session source for the route guards. It always reports a visitor,
 * so private routes redirect to login. Replaced by `GET /auth/session` through
 * TanStack Query once the simulated API exists.
 */
export function readSession(): Session | null {
  return null;
}
