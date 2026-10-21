import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { http } from "@/shared/api/axios";
import { endSession } from "@/shared/session/session-lifecycle";

/**
 * Ends the session on the API and locally. The local cleanup runs even if the
 * request fails: leaving the device signed out is the safe outcome.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await http.post("/auth/logout");
    },
    onSettled: () => {
      endSession(queryClient);
      toast.success("Você saiu da sua conta.");
      void navigate({ to: "/", replace: true });
    },
  });
}
