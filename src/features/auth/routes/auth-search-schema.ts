import { z } from "zod";

// Same-origin paths only, so redirect can't send users to another site
const internalPathSchema = z.string().regex(/^\/(?!\/)/);

export const authSearchSchema = z.object({
  redirect: internalPathSchema.optional().catch(undefined),
});

export type AuthSearch = z.infer<typeof authSearchSchema>;
