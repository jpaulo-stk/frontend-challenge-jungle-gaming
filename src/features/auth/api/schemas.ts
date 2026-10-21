import { z } from "zod";

import { sessionSchema } from "@/shared/api/contracts/session";

export const PASSWORD_MIN_LENGTH = 8;

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

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const registerFormSchema = registerRequestSchema
  .extend({ confirmPassword: z.string().min(1, "Confirme sua senha.") })
  .refine((values) => values.password === values.confirmPassword, {
    // Run even while other fields are invalid
    when: (payload) =>
      z.object({ password: z.string(), confirmPassword: z.string() }).safeParse(payload.value)
        .success,
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });
export type RegisterForm = z.infer<typeof registerFormSchema>;
