// One-shot faults injected by tests or the dev panel: the next request that
// matches method and path fails with the given status, independently of the
// active scenario. Used to exercise rollback paths deterministically.

export type Fault = { method: string; path: string; status: number };

const faults: Fault[] = [];

export function queueFault(fault: Fault): void {
  faults.push({ ...fault, method: fault.method.toUpperCase() });
}

/** Removes and returns the first fault matching the request, if any. */
export function takeFault(request: Request): Fault | null {
  const { pathname } = new URL(request.url);
  const index = faults.findIndex(
    (fault) => fault.method === request.method && pathname.startsWith(`/api${fault.path}`),
  );
  if (index === -1) return null;
  return faults.splice(index, 1)[0] ?? null;
}

export function clearFaults(): void {
  faults.length = 0;
}
