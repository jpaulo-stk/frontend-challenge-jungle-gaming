import { delay, http, HttpResponse } from "msw";

import { getConfig } from "@/mocks/config";
import { API, apiError } from "@/mocks/handlers/http";
import { random, randomBetween } from "@/mocks/lib/random";
import { scenarios } from "@/mocks/scenarios/scenarios";

/**
 * First handler in the chain: applies the scenario's network conditions
 * (latency, connection failure, intermittent 5xx) and then falls through to
 * the resource handlers by returning nothing.
 */
export const networkConditions = http.all(`${API}/*`, async () => {
  const config = getConfig();
  const scenario = scenarios[config.scenario];

  const [min, max] = scenario.latency;
  await delay(config.latencyMs ?? randomBetween(min, max));

  if (config.scenario === "offline") return HttpResponse.error();

  if (config.scenario === "server-error" && random() < 0.5) {
    return apiError(500, "SERVER_ERROR", "Falha temporária no servidor.");
  }

  return undefined;
});
