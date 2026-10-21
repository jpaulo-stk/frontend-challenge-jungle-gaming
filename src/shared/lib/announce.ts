// One polite live region for the whole app (`LiveAnnouncer`, in the root
// layout). Used for results that are visible but would otherwise be silent for
// screen readers, without a toast on screen.

let message = "";
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

export const subscribeAnnouncements = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const currentAnnouncement = () => message;

/** Reads `text` to screen reader users (politely, after what they are hearing). */
export function announce(text: string): void {
  // Cleared first, so the same message twice in a row is read again.
  message = "";
  emit();
  requestAnimationFrame(() => {
    message = text;
    emit();
  });
}
