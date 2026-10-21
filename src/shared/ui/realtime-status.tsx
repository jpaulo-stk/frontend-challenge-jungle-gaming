import { cn } from "cn";
import { useEffect, useState } from "react";

import { useRealtimeState } from "@/shared/realtime/use-realtime";

const RESTORED_VISIBLE_MS = 4_000;

/**
 * Discreet status of the realtime connection. Quiet while everything works;
 * after a failure it says that prices and orders may be outdated, and then
 * that the connection is back (and the data on screen was refreshed).
 */
export function RealtimeStatus() {
  const { status, interrupted } = useRealtimeState();
  const [restored, setRestored] = useState(false);
  const [wasDown, setWasDown] = useState(false);

  const down = interrupted && status !== "online";
  if (down !== wasDown) {
    setWasDown(down);
    if (!down) setRestored(true);
  }

  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(() => {
      setRestored(false);
    }, RESTORED_VISIBLE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [restored]);

  const message = down
    ? "Sem conexão em tempo real. Preços e pedidos podem estar desatualizados; tentando reconectar…"
    : restored
      ? "Conexão restabelecida. Os dados da tela foram atualizados."
      : "";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-4 bottom-22 z-40 mx-auto w-fit max-w-md rounded-xl border border-border bg-surface-2 px-4 py-2 text-center text-sm text-text shadow-lg md:bottom-6",
        !message && "sr-only",
      )}
    >
      {message && (
        <span
          aria-hidden="true"
          className={cn(
            "mr-2 inline-block size-2 rounded-full align-middle",
            down ? "bg-danger" : "bg-success",
          )}
        />
      )}
      {message}
    </div>
  );
}
