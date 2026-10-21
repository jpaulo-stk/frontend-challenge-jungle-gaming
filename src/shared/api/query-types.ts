import type { AppError } from "@/shared/api/errors";

// Every failure that reaches TanStack Query is normalized into an AppError
// (Axios interceptor + parseContract), so query and mutation errors are typed
// as such everywhere.
declare module "@tanstack/react-query" {
  // Module augmentation requires an interface.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    defaultError: AppError;
  }
}
