import { HttpResponse } from "msw";
import type { z } from "zod";

import type { DbSession, DbUser, OwnerKey } from "@/mocks/db/types";
import { getDb, mutate } from "@/mocks/db/store";

export const API = "/api";
export const VISITOR_HEADER = "x-visitor-id";

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

/** The single error envelope of the API. */
export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): HttpResponse<{ error: { code: string; message: string; fields?: Record<string, string> } }> {
  return HttpResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

/** Parses the JSON body with a contract schema; invalid input becomes a 422 with field errors. */
export async function readBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw apiError(400, "BAD_REQUEST", "Corpo da requisição inválido.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }
    throw apiError(422, "VALIDATION_ERROR", "Alguns campos precisam de correção.", fields);
  }
  return parsed.data;
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

export function createSession(userId: string): DbSession {
  const session: DbSession = {
    token: crypto.randomUUID(),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  mutate((db) => {
    db.sessions.push(session);
  });
  return session;
}

export function endSession(token: string): void {
  mutate((db) => {
    db.sessions = db.sessions.filter((session) => session.token !== token);
  });
}

type Authenticated = { user: DbUser; session: DbSession };

/**
 * Resolves the caller's session. A request without a token is anonymous
 * (null); a token that is unknown or past its expiry is a 401.
 */
export function resolveSession(request: Request): Authenticated | null {
  const token = bearerToken(request);
  if (!token) return null;
  const db = getDb();
  const session = db.sessions.find((candidate) => candidate.token === token);
  const user = session && db.users.find((candidate) => candidate.id === session.userId);
  if (!session || !user || Date.parse(session.expiresAt) <= Date.now()) {
    if (session) endSession(session.token);
    throw apiError(401, "SESSION_EXPIRED", "Sua sessão expirou. Entre novamente.");
  }
  return { user, session };
}

/** For private endpoints: requires a valid session. */
export function requireUser(request: Request): Authenticated {
  const authenticated = resolveSession(request);
  if (!authenticated) {
    throw apiError(401, "UNAUTHORIZED", "Entre na sua conta para continuar.");
  }
  // session-expired scenario: the next private call after arming ends the session.
  if (getDb().flags.sessionExpiryArmed) {
    mutate((db) => {
      db.flags.sessionExpiryArmed = false;
    });
    endSession(authenticated.session.token);
    throw apiError(401, "SESSION_EXPIRED", "Sua sessão expirou. Entre novamente.");
  }
  return authenticated;
}

/** Cart owner: the signed-in collector, or the visitor id sent by the client. */
export function resolveOwner(request: Request): OwnerKey {
  const authenticated = resolveSession(request);
  if (authenticated) return `user:${authenticated.user.id}`;
  const visitorId = request.headers.get(VISITOR_HEADER);
  if (!visitorId) throw apiError(400, "VISITOR_ID_REQUIRED", "Identificador de visitante ausente.");
  return `visitor:${visitorId}`;
}
