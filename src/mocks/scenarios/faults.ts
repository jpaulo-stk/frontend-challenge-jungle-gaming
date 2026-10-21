export type Fault = { method: string; path: string; status: number };

const faults: Fault[] = [];

export function queueFault(fault: Fault): void {
  faults.push({ ...fault, method: fault.method.toUpperCase() });
}

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
