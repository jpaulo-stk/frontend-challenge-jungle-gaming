// Single polite live region (LiveAnnouncer, in the root layout)

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

export function announce(text: string): void {
  // Cleared first, so the same message twice in a row is read again.
  message = "";
  emit();
  requestAnimationFrame(() => {
    message = text;
    emit();
  });
}
