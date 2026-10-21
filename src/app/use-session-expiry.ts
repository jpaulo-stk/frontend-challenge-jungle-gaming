import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import type { Session } from "@/shared/api/contracts/session";
import { sessionKeys } from "@/shared/api/query-keys";
import { onSessionExpired } from "@/shared/api/session-events";
import { clearSessionToken } from "@/shared/api/session-token";
import { endSession } from "@/shared/session/session-lifecycle";

/** A 401 on a request that carried the session: clear private data and go to login. */
export function useSessionExpiry(): void {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let handling = false;
    return onSessionExpired(() => {
      const known = queryClient.getQueryData<Session | null>(sessionKeys.current());
      if (!known) {
        clearSessionToken();
        return;
      }
      if (handling) return;
      handling = true;

      const destination = router.state.location.href;
      endSession(queryClient, "expired");
      toast.warning("Sua sessão expirou. Entre novamente para continuar de onde parou.");
      void router
        .navigate({ to: "/entrar", search: { redirect: destination }, replace: true })
        .finally(() => {
          handling = false;
        });
    });
  }, [queryClient, router]);
}
