import { z } from "zod";

export const AVATAR_MAX_BYTES = 1024 * 1024;
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export const profileSchema = z.object({
  displayName: z.string(),
  username: z.string(),
  email: z.email(),
  /** ENS name without the ".eth" suffix. */
  ensName: z.string().nullable(),
  walletNickname: z.string(),
  avatarUrl: z.string().nullable(),
  version: z.number().int().positive(),
});
export type Profile = z.infer<typeof profileSchema>;

export const updateProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(1, "Informe o nome de exibição."),
    username: z
      .string()
      .trim()
      .min(3, "Use pelo menos 3 caracteres.")
      .regex(/^[a-z0-9._]+$/, "Use apenas letras minúsculas, números, ponto e sublinhado."),
    email: z.email("Informe um e-mail válido."),
    ensName: z.string().trim().min(1).nullable(),
    walletNickname: z.string().trim().min(1, "Informe o apelido da carteira."),
  })
  .partial();
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual."),
  newPassword: z.string().min(8, "Use pelo menos 8 caracteres."),
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

/**
 * "Perfil do colecionador" form: profile data plus the optional "Alterar senha"
 * block, validated only when one of its fields is filled.
 */
export const profileFormSchema = z
  .object({
    displayName: z.string().trim().min(1, "Informe o nome de exibição."),
    username: z
      .string()
      .trim()
      .min(3, "Use pelo menos 3 caracteres.")
      .regex(/^[a-z0-9._]+$/, "Use apenas letras minúsculas, números, ponto e sublinhado."),
    email: z.email("Informe um e-mail válido."),
    ensName: z.string().trim().min(1, "Informe o nome ENS."),
    walletNickname: z.string().trim().min(1, "Informe o apelido da carteira."),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    if (!values.currentPassword && !values.newPassword && !values.confirmPassword) return;
    if (!values.currentPassword) {
      context.addIssue({
        code: "custom",
        path: ["currentPassword"],
        message: "Informe a senha atual.",
      });
    }
    if (values.newPassword.length < 8) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Use pelo menos 8 caracteres.",
      });
    }
    if (values.confirmPassword !== values.newPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "As senhas não coincidem.",
      });
    }
  });
export type ProfileForm = z.infer<typeof profileFormSchema>;
