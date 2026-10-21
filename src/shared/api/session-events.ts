const target = new EventTarget();
const SESSION_EXPIRED = "session-expired";

export function emitSessionExpired(): void {
  target.dispatchEvent(new Event(SESSION_EXPIRED));
}

export function onSessionExpired(listener: () => void): () => void {
  target.addEventListener(SESSION_EXPIRED, listener);
  return () => {
    target.removeEventListener(SESSION_EXPIRED, listener);
  };
}
