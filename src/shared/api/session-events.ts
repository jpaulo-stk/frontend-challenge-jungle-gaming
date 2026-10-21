const target = new EventTarget();
const SESSION_EXPIRED = "session-expired";

/** Raised by the HTTP layer when a request that carried a session gets a 401. */
export function emitSessionExpired(): void {
  target.dispatchEvent(new Event(SESSION_EXPIRED));
}

export function onSessionExpired(listener: () => void): () => void {
  target.addEventListener(SESSION_EXPIRED, listener);
  return () => {
    target.removeEventListener(SESSION_EXPIRED, listener);
  };
}
