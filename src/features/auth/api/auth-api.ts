import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  authResponseSchema,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
} from "@/features/auth/api/schemas";
import { http } from "@/shared/api/axios";
import type { AppError } from "@/shared/api/errors";
import { parseContract } from "@/shared/api/parse-contract";
import { startSession } from "@/shared/session/session-lifecycle";

function useAuthMutation<TInput>(path: string) {
  const queryClient = useQueryClient();
  return useMutation<AuthResponse, AppError, TInput>({
    mutationFn: async (input) =>
      parseContract(authResponseSchema, (await http.post(path, input)).data),
    // The visitor cart is merged into the collector's by the API on this call.
    onSuccess: ({ token, ...session }) => {
      startSession(queryClient, session, token);
    },
  });
}

export const useLogin = () => useAuthMutation<LoginRequest>("/auth/login");
export const useRegister = () => useAuthMutation<RegisterRequest>("/auth/register");
