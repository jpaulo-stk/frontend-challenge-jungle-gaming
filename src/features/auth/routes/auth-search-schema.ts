import { z } from "zod";

// Only same-origin absolute paths are accepted, so `redirect` cannot be used
// to send the user to another site after login.
const internalPathSchema = z.string().regex(/^\/(?!\/)/);

export const authSearchSchema = z.object({
  redirect: internalPathSchema.optional().catch(undefined),
});

export type AuthSearch = z.infer<typeof authSearchSchema>;
