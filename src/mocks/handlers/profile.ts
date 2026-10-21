import { http, HttpResponse } from "msw";

import { getDb, mutate } from "@/mocks/db/store";
import { toProfile } from "@/mocks/domain/serialize";
import { API, apiError, readBody, requireUser } from "@/mocks/handlers/http";
import { hashPassword } from "@/mocks/lib/ids";
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  changePasswordRequestSchema,
  updateProfileRequestSchema,
} from "@/features/profile/api/schemas";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unexpected avatar encoding"));
    };
    reader.onerror = () => {
      reject(new Error("Could not read avatar"));
    };
    reader.readAsDataURL(file);
  });
}

export const profileHandlers = [
  http.get(`${API}/profile`, ({ request }) => {
    const { user } = requireUser(request);
    return HttpResponse.json(toProfile(user));
  }),

  http.patch(`${API}/profile`, async ({ request }) => {
    const { user } = requireUser(request);
    const input = await readBody(request, updateProfileRequestSchema);
    const others = getDb().users.filter((candidate) => candidate.id !== user.id);

    const fields: Record<string, string> = {};
    if (input.email && others.some((other) => other.email === input.email?.toLowerCase())) {
      fields.email = "Este e-mail já está cadastrado.";
    }
    if (input.username && others.some((other) => other.username === input.username)) {
      fields.username = "Este nome de usuário já está em uso.";
    }
    if (Object.keys(fields).length > 0) {
      return apiError(
        409,
        fields.email ? "EMAIL_TAKEN" : "USERNAME_TAKEN",
        "Alguns dados já estão em uso.",
        fields,
      );
    }

    const updated = mutate((db) => {
      const stored = db.users.find((candidate) => candidate.id === user.id);
      if (!stored) return null;
      if (input.displayName !== undefined) stored.displayName = input.displayName;
      if (input.username !== undefined) stored.username = input.username;
      if (input.email !== undefined) stored.email = input.email.toLowerCase();
      if (input.ensName !== undefined) stored.ensName = input.ensName;
      if (input.walletNickname !== undefined) stored.walletNickname = input.walletNickname;
      stored.version += 1;
      return stored;
    });
    return updated
      ? HttpResponse.json(toProfile(updated))
      : apiError(404, "NOT_FOUND", "Perfil não encontrado.");
  }),

  http.post(`${API}/profile/avatar`, async ({ request }) => {
    const { user } = requireUser(request);
    const form = await request.formData().catch(() => null);
    const file = form?.get("avatar");
    if (!(file instanceof File)) {
      return apiError(422, "AVATAR_INVALID", "Envie uma imagem.", { avatar: "Envie uma imagem." });
    }
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      return apiError(422, "AVATAR_INVALID", "Use uma imagem PNG, JPEG ou WebP.", {
        avatar: "Use uma imagem PNG, JPEG ou WebP.",
      });
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return apiError(422, "AVATAR_TOO_LARGE", "A imagem deve ter até 1 MB.", {
        avatar: "A imagem deve ter até 1 MB.",
      });
    }
    const dataUrl = await readAsDataUrl(file);
    const updated = mutate((db) => {
      const stored = db.users.find((candidate) => candidate.id === user.id);
      if (stored) {
        stored.avatarUrl = dataUrl;
        stored.version += 1;
      }
      return stored;
    });
    return updated
      ? HttpResponse.json(toProfile(updated))
      : apiError(404, "NOT_FOUND", "Perfil não encontrado.");
  }),

  http.delete(`${API}/profile/avatar`, ({ request }) => {
    const { user } = requireUser(request);
    const updated = mutate((db) => {
      const stored = db.users.find((candidate) => candidate.id === user.id);
      if (stored) {
        stored.avatarUrl = null;
        stored.version += 1;
      }
      return stored;
    });
    return updated
      ? HttpResponse.json(toProfile(updated))
      : apiError(404, "NOT_FOUND", "Perfil não encontrado.");
  }),

  http.post(`${API}/profile/password`, async ({ request }) => {
    const { user } = requireUser(request);
    const input = await readBody(request, changePasswordRequestSchema);
    if ((await hashPassword(user.salt, input.currentPassword)) !== user.passwordHash) {
      return apiError(422, "WRONG_PASSWORD", "A senha atual está incorreta.", {
        currentPassword: "A senha atual está incorreta.",
      });
    }
    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(salt, input.newPassword);
    mutate((db) => {
      const stored = db.users.find((candidate) => candidate.id === user.id);
      if (stored) {
        stored.salt = salt;
        stored.passwordHash = passwordHash;
      }
    });
    return new HttpResponse(null, { status: 204 });
  }),
];
