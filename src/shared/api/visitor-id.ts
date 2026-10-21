const STORAGE_KEY = "kurio.visitor-id";

let memoryFallback: string | null = null;

export function getVisitorId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const created = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    memoryFallback ??= crypto.randomUUID();
    return memoryFallback;
  }
}
