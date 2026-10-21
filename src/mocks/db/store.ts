import type { ScenarioId } from "@/mocks/config";
import type { Db } from "@/mocks/db/types";
import { buildSeed, SCHEMA_VERSION } from "@/mocks/fixtures/seed";

const STORAGE_KEY = "kurio.mock-db";

let db: Db | null = null;

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Quota exceeded or storage unavailable: state lives in memory only.
  }
}

function readPersisted(): Db | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Db;
    return parsed.schemaVersion === SCHEMA_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function loadDb(scenario: ScenarioId, forceReset: boolean): Db {
  const persisted = forceReset ? null : readPersisted();
  db = persisted ?? buildSeed(scenario);
  persist();
  return db;
}

export function resetDb(scenario: ScenarioId): Db {
  db = buildSeed(scenario);
  persist();
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error("Mock database used before loadDb()");
  return db;
}

export function mutate<T>(change: (state: Db) => T): T {
  const result = change(getDb());
  persist();
  return result;
}
