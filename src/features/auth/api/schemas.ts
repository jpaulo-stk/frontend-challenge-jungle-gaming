import { z } from "zod";

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export const sessionSchema = z.object({
  user: sessionUserSchema,
  expiresAt: z.iso.datetime(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type Session = z.infer<typeof sessionSchema>;
