import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { AppError } from "@/shared/api/errors";

/**
 * Puts the API's field errors (`error.fields`) on the matching form fields.
 * Returns false when none matched, so the caller shows a form-level message.
 */
export function applyServerErrors<TValues extends FieldValues>(
  error: AppError,
  setError: UseFormSetError<TValues>,
  fields: readonly Path<TValues>[],
): boolean {
  let applied = false;
  for (const field of fields) {
    const message = error.fields[field];
    if (message) {
      setError(field, { type: "server", message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}
