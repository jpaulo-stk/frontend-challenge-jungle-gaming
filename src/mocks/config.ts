// Runtime configuration of the simulated backend. It is read from the URL
// (`?scenario=…&seed=…`) and persisted in localStorage, and only code under
// src/mocks reads it: the application never branches on it.

export const scenarioIds = [
  "default",
  "empty",
  "slow-network",
  "jitter",
  "offline",
  "server-error",
  "session-expired",
  "coupon-expired",
  "price-changed",
  "sold-out",
  "order-timeout",
  "payment-rejected",
  "wallet-rejected",
] as const;
export type ScenarioId = (typeof scenarioIds)[number];

export type SettleMode = "auto" | "manual";

export type MockConfig = {
  scenario: ScenarioId;
  /** Seed for every pseudo-random decision (latency, intermittent failures). */
  seed: number;
  /** Fixed latency in ms overriding the scenario's range (tests use 0). */
  latencyMs: number | null;
  /** "manual" leaves pending orders pending until a control settles them. */
  settle: SettleMode;
  /** Delay before a pending order is settled automatically. */
  settleDelayMs: number;
  /** Delay before scenario-driven events (price change, sell-out) fire. */
  eventDelayMs: number;
  /** Shows the mock control panel outside development builds. */
  panel: boolean;
};

const STORAGE_KEY = "kurio.mock-config";

export const defaultConfig: MockConfig = {
  scenario: "default",
  seed: 42,
  latencyMs: null,
  settle: "auto",
  settleDelayMs: 2500,
  eventDelayMs: 3000,
  panel: false,
};

function isScenario(value: string | null): value is ScenarioId {
  return value !== null && (scenarioIds as readonly string[]).includes(value);
}

function readNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readStored(): MockConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig;
    return { ...defaultConfig, ...(JSON.parse(raw) as Partial<MockConfig>) };
  } catch {
    return defaultConfig;
  }
}

let current: MockConfig = defaultConfig;

export function getConfig(): MockConfig {
  return current;
}

export function saveConfig(next: MockConfig): void {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: the configuration lasts for this page load only.
  }
}

export type ConfigLoadResult = {
  config: MockConfig;
  /** True when the URL picked a different scenario or asked for a reset. */
  resetRequested: boolean;
};

/**
 * Merges URL parameters over the stored configuration. Recognized parameters
 * are removed from the address bar so they do not leak into app navigation.
 */
export function loadConfig(location: Location): ConfigLoadResult {
  const url = new URL(location.href);
  const params = url.searchParams;
  const stored = readStored();
  const next: MockConfig = { ...stored };

  const scenario = params.get("scenario");
  if (isScenario(scenario)) next.scenario = scenario;

  const seed = readNumber(params.get("seed"));
  if (seed !== null) next.seed = Math.floor(seed);

  if (params.has("latency")) next.latencyMs = readNumber(params.get("latency"));

  const settle = params.get("settle");
  if (settle === "auto" || settle === "manual") next.settle = settle;

  const settleDelay = readNumber(params.get("settleDelay"));
  if (settleDelay !== null) next.settleDelayMs = settleDelay;

  const eventDelay = readNumber(params.get("eventDelay"));
  if (eventDelay !== null) next.eventDelayMs = eventDelay;

  if (params.has("painel")) next.panel = params.get("painel") !== "0";

  const resetRequested =
    (isScenario(scenario) && scenario !== stored.scenario) || params.get("reset") === "1";

  const known = [
    "scenario",
    "seed",
    "latency",
    "settle",
    "settleDelay",
    "eventDelay",
    "painel",
    "reset",
  ];
  if (known.some((key) => params.has(key))) {
    for (const key of known) params.delete(key);
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  }

  saveConfig(next);
  return { config: next, resetRequested };
}
