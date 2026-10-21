// Read from the URL and persisted; only src/mocks reads it

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
  seed: number;
  latencyMs: number | null;
  settle: SettleMode;
  settleDelayMs: number;
  eventDelayMs: number;
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
  resetRequested: boolean;
};

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
