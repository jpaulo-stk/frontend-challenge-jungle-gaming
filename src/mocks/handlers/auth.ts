import { http, HttpResponse } from "msw";

import { getDb, mutate } from "@/mocks/db/store";
import type { DbUser, OwnerKey } from "@/mocks/db/types";
import { toSessionUser } from "@/mocks/domain/serialize";
import {
  API,
  apiError,
  createSession,
  endSession,
  readBody,
  resolveSession,
  VISITOR_HEADER,
} from "@/mocks/handlers/http";
import { hashPassword, newId } from "@/mocks/lib/ids";
import { loginRequestSchema, registerRequestSchema } from "@/features/auth/api/schemas";

// Quantities add up, capped by availability
function mergeVisitorCart(request: Request, userId: string): void {
  const visitorId = request.headers.get(VISITOR_HEADER);
  if (!visitorId) return;
  const visitor: OwnerKey = `visitor:${visitorId}`;
  const owner: OwnerKey = `user:${userId}`;

  mutate((db) => {
    for (const item of db.cartItems.filter((candidate) => candidate.owner === visitor)) {
      const available =
        db.nfts
          .find((nft) => nft.id === item.nftId)
          ?.editions.find((edition) => edition.id === item.editionId)?.available ?? 0;
      const existing = db.cartItems.find(
        (candidate) =>
          candidate.owner === owner &&
          candidate.nftId === item.nftId &&
          candidate.editionId === item.editionId,
      );
      if (existing) {
        existing.quantity = Math.max(1, Math.min(existing.quantity + item.quantity, available));
      } else {
        db.cartItems.push({ ...item, id: newId("item"), owner });
      }
    }
    db.cartItems = db.cartItems.filter((candidate) => candidate.owner !== visitor);
    db.cartVersions[owner] = (db.cartVersions[owner] ?? 0) + 1;
  });
}

function authResponse(user: DbUser, status = 200) {
  const session = createSession(user.id);
  return HttpResponse.json(
    { user: toSessionUser(user), expiresAt: session.expiresAt, token: session.token },
    { status },
  );
}

export const authHandlers = [
  http.post(`${API}/auth/register`, async ({ request }) => {
    const input = await readBody(request, registerRequestSchema);
    const db = getDb();
    const email = input.email.toLowerCase();

    if (db.users.some((user) => user.email === email)) {
      return apiError(409, "EMAIL_TAKEN", "Este e-mail já está cadastrado.", {
        email: "Este e-mail já está cadastrado.",
      });
    }
    if (db.users.some((user) => user.username === input.username)) {
      return apiError(409, "USERNAME_TAKEN", "Este nome de usuário já está em uso.", {
        username: "Este nome de usuário já está em uso.",
      });
    }

    const salt = crypto.randomUUID();
    const user: DbUser = {
      id: newId("user"),
      displayName: input.username,
      username: input.username,
      email,
      salt,
      passwordHash: await hashPassword(salt, input.password),
      avatarUrl: null,
      ensName: null,
      walletNickname: "Minha carteira",
      version: 1,
    };
    mutate((state) => {
      state.users.push(user);
    });
    mergeVisitorCart(request, user.id);
    return authResponse(user, 201);
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const input = await readBody(request, loginRequestSchema);
    const user = getDb().users.find((candidate) => candidate.email === input.email.toLowerCase());
    const valid = user
      ? (await hashPassword(user.salt, input.password)) === user.passwordHash
      : false;
    if (!user || !valid) {
      return apiError(401, "INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
    }
    mergeVisitorCart(request, user.id);
    return authResponse(user);
  }),

  http.get(`${API}/auth/session`, ({ request }) => {
    const authenticated = resolveSession(request);
    if (!authenticated) return apiError(401, "UNAUTHORIZED", "Nenhuma sessão ativa.");
    return HttpResponse.json({
      user: toSessionUser(authenticated.user),
      expiresAt: authenticated.session.expiresAt,
    });
  }),

  http.post(`${API}/auth/logout`, ({ request }) => {
    const header = request.headers.get("authorization");
    if (header?.startsWith("Bearer ")) endSession(header.slice("Bearer ".length));
    return new HttpResponse(null, { status: 204 });
  }),
];
