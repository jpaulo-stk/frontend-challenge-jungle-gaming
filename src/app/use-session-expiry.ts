import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import type { Session } from "@/shared/api/contracts/session";
import { sessionKeys } from "@/shared/api/query-keys";
import { onSessionExpired } from "@/shared/api/session-events";
import { clearSessionToken } from "@/shared/api/session-token";
import { endSession } from "@/shared/session/session-lifecycle";

/**
 * A request that carried the session got a 401: drop private data, warn and
 * send the collector to login with the current page as the way back.
 * A stale token found at startup (no session known yet) is just discarded.
 */
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
      endSession(queryClient);
      toast.warning("Sua sessão expirou. Entre novamente para continuar de onde parou.");
      void router
        .navigate({ to: "/entrar", search: { redirect: destination }, replace: true })
        .finally(() => {
          handling = false;
        });
    });
  }, [queryClient, router]);
}
