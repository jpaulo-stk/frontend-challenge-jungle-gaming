import type { AppError } from "@/shared/api/errors";

declare module "@tanstack/react-query" {
  // Module augmentation requires an interface.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    defaultError: AppError;
  }
}
