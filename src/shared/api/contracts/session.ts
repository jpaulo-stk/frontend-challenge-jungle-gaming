import { z } from "zod";

import { isoDateTimeSchema } from "@/shared/api/contracts/common";

export const sessionUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const sessionSchema = z.object({
  user: sessionUserSchema,
  expiresAt: isoDateTimeSchema,
});
export type Session = z.infer<typeof sessionSchema>;
