import type { Page } from "@playwright/test";

// Helpers to drive the simulated backend from Playwright. Requests run inside
// the page, so they go through the MSW service worker like the app's own.

export type ApiResult = { status: number; body: unknown };

/** The subset of `window.__kurioMock` (src/mocks/controls.ts) used by tests. */
export type MockHandle = {
  raiseNftPrice: (nftId: string, percent?: number) => void;
  setEditionAvailability: (nftId: string, editionId: string, available: number) => void;
  settleOrder: (orderId: string, outcome: "confirmed" | "rejected") => Promise<unknown>;
  replayLastEvent: () => void;
  sendStaleNftEvent: (nftId: string) => void;
  dropConnections: () => number;
  connectedClients: () => number;
  orderCount: () => number;
  pendingOrders: () => string[];
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
  latency?: number;
  settle?: "auto" | "manual";
  settleDelay?: number;
  eventDelay?: number;
};

/** Opens the app with a fresh database for the given scenario. */
export async function openWithScenario(page: Page, options: MockOptions = {}): Promise<void> {
  const params = new URLSearchParams({
    scenario: options.scenario ?? "default",
    reset: "1",
    latency: String(options.latency ?? 0),
    settle: options.settle ?? "auto",
  });
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

/** Calls the API from inside the page. Network failures resolve as status 0. */
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
  const result = await api(page, {
    method: "POST",
    path: "/auth/login",
    body: { email, password: "kurio123" },
  });
  const { token } = result.body as { token: string };
  return token;
}
