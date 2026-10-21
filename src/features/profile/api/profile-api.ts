import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  profileSchema,
  type ChangePasswordRequest,
  type Profile,
  type UpdateProfileRequest,
} from "@/features/profile/api/schemas";
import { http } from "@/shared/api/axios";
import type { Session } from "@/shared/api/contracts/session";
import type { AppError } from "@/shared/api/errors";
import { parseContract } from "@/shared/api/parse-contract";
import { profileKeys, sessionKeys } from "@/shared/api/query-keys";

export const profileQueryOptions = queryOptions({
  queryKey: profileKeys.detail(),
  queryFn: async ({ signal }) =>
    parseContract(profileSchema, (await http.get("/profile", { signal })).data),
  staleTime: 60_000,
});

function useApplyProfile() {
  const queryClient = useQueryClient();
  return (profile: Profile) => {
    queryClient.setQueryData(profileKeys.detail(), profile);
    queryClient.setQueryData<Session | null>(sessionKeys.current(), (session) =>
      session
        ? {
            ...session,
            user: {
              ...session.user,
              displayName: profile.displayName,
              username: profile.username,
              email: profile.email,
              avatarUrl: profile.avatarUrl,
            },
          }
        : session,
    );
  };
}

export function useUpdateProfile() {
  const apply = useApplyProfile();
  return useMutation<Profile, AppError, UpdateProfileRequest>({
    mutationFn: async (input) =>
      parseContract(profileSchema, (await http.patch("/profile", input)).data),
    onSuccess: apply,
  });
}

export function useChangePassword() {
  return useMutation<unknown, AppError, ChangePasswordRequest>({
    mutationFn: async (input) => {
      await http.post("/profile/password", input);
    },
  });
}

export function useUploadAvatar() {
  const apply = useApplyProfile();
  return useMutation<Profile, AppError, File>({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append("avatar", file);
      return parseContract(profileSchema, (await http.post("/profile/avatar", form)).data);
    },
    onSuccess: apply,
  });
}

export function useRemoveAvatar() {
  const apply = useApplyProfile();
  return useMutation<Profile>({
    mutationFn: async () =>
      parseContract(profileSchema, (await http.delete("/profile/avatar")).data),
    onSuccess: apply,
  });
}
