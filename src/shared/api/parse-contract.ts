import type { z } from "zod";

import { AppError } from "@/shared/api/errors";

/** Validates an API payload at the boundary; a mismatch is a typed AppError. */
export function parseContract<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown,
): z.infer<TSchema> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new AppError("CONTRACT_MISMATCH", parsed.error);
  return parsed.data;
}
