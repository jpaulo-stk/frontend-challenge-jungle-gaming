import type { Page } from "@playwright/test";

// Requests run inside the page, through the MSW worker

export type ApiResult = { status: number; body: unknown };

export type MockHandle = {
  raiseNftPrice: (nftId: string, percent?: number) => void;
  setNftPrice: (nftId: string, price: string) => void;
  setEditionAvailability: (nftId: string, editionId: string, available: number) => void;
  settleOrder: (orderId: string, outcome: "confirmed" | "rejected") => Promise<unknown>;
  replayLastEvent: () => void;
  sendStaleNftEvent: (nftId: string) => void;
  dropConnections: () => number;
  failNextRequest: (method: string, path: string, status?: number) => void;
  expireSessionOnNextRequest: () => void;
  connectedClients: () => number;
  realtimeClients: () => { userId: string | null; rooms: string[] }[];
  orderCount: () => number;
  pendingOrders: () => string[];
  cartOf: (userId: string) => { nftId: string; editionId: string; quantity: number }[];
};

declare global {
  // Declaration merging with the DOM `Window` requires an interface.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __kurioMock?: MockHandle;
  }
}

export type MockOptions = {
  scenario?: string;
  latency?: number | null;
  settle?: "auto" | "manual";
  settleDelay?: number;
  eventDelay?: number;
};

export async function openWithScenario(page: Page, options: MockOptions = {}): Promise<void> {
  const params = new URLSearchParams({
    scenario: options.scenario ?? "default",
    reset: "1",
    settle: options.settle ?? "auto",
  });
  if (options.latency !== null) params.set("latency", String(options.latency ?? 0));
  if (options.settleDelay !== undefined) params.set("settleDelay", String(options.settleDelay));
  if (options.eventDelay !== undefined) params.set("eventDelay", String(options.eventDelay));
  await page.goto(`/?${params.toString()}`);
  await page.waitForFunction(() => window.__kurioMock !== undefined);
}

type RequestInput = {
  method?: string;
  path: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export async function api(page: Page, input: RequestInput): Promise<ApiResult> {
  return page.evaluate(async ({ method, path, body, token, headers, timeoutMs }) => {
    const init: RequestInit = {
      method: method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Visitor-Id": "visitor-test",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
    };
    try {
      const response = await fetch(`/api${path}`, init);
      const text = await response.text();
      return { status: response.status, body: text ? (JSON.parse(text) as unknown) : null };
    } catch (error) {
      return { status: 0, body: { error: error instanceof Error ? error.name : "unknown" } };
    }
  }, input);
}

export async function login(page: Page, email = "colecionador@kurio.test"): Promise<string> {
  // Right after the worker starts a request can fail before reaching the mock; retry
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await api(page, {
      method: "POST",
      path: "/auth/login",
      body: { email, password: "kurio123" },
    });
    if (result.status === 0) continue;
    const token = (result.body as { token?: unknown } | null)?.token;
    if (typeof token !== "string")
      throw new Error(`Login failed with status ${String(result.status)}`);
    return token;
  }
  throw new Error("Login request never reached the mock API");
}
