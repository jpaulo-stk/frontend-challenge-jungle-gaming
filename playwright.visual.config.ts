import { defineConfig } from "@playwright/test";

import { projects } from "./playwright.config.ts";

const PORT = 4173;

// Visual regression against the production build; baselines are per OS
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  retries: 0,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.01 },
  },
  timeout: 60_000,
  reporter: [["html", { open: "never", outputFolder: "playwright-report/visual" }], ["list"]],
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
  },
  projects,
  webServer: {
    command: "pnpm build && pnpm preview",
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
