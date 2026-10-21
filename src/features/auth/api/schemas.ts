import { z } from "zod";

import { isoDateTimeSchema } from "@/shared/api/contracts/common";

export const PASSWORD_MIN_LENGTH = 8;

export const sessionUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
});

export const sessionSchema = z.object({
  user: sessionUserSchema,
  expiresAt: isoDateTimeSchema,
});

/** Login and register return the session plus the opaque token for later requests. */
export const authResponseSchema = sessionSchema.extend({
  token: z.string(),
});

export const loginRequestSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const registerRequestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Use pelo menos 3 caracteres.")
    .max(30, "Use no máximo 30 caracteres.")
    .regex(/^[a-z0-9._]+$/, "Use apenas letras minúsculas, números, ponto e sublinhado."),
  email: z.email("Informe um e-mail válido."),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use pelo menos ${String(PASSWORD_MIN_LENGTH)} caracteres.`),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
