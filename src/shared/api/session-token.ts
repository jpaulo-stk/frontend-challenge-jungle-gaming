const STORAGE_KEY = "kurio.session-token";

export function readSessionToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeSessionToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Storage unavailable (private mode): the session lasts until the tab closes.
  }
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
