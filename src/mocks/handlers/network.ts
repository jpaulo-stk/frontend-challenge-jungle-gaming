import { delay, http, HttpResponse } from "msw";

import { getConfig } from "@/mocks/config";
import { API, apiError } from "@/mocks/handlers/http";
import { random, randomBetween } from "@/mocks/lib/random";
import { takeFault } from "@/mocks/scenarios/faults";
import { scenarios } from "@/mocks/scenarios/scenarios";

// Runs first: applies latency/failures, then falls through to the resource handlers
export const networkConditions = http.all(`${API}/*`, async ({ request }) => {
  const config = getConfig();
  const scenario = scenarios[config.scenario];

  const [min, max] = scenario.latency;
  await delay(config.latencyMs ?? randomBetween(min, max));

  const fault = takeFault(request);
  if (fault) return apiError(fault.status, "SERVER_ERROR", "Falha simulada para esta requisição.");

  if (config.scenario === "offline") return HttpResponse.error();

  if (config.scenario === "server-error" && random() < 0.5) {
    return apiError(500, "SERVER_ERROR", "Falha temporária no servidor.");
  }

  return undefined;
});
