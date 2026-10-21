import { defineConfig } from "@playwright/test";

import { projects } from "./playwright.config.ts";

const PORT = 4173;

// Visual regression of the four main screens, desktop and mobile, against the
// production build (no dev tools, no simulation panel). Baselines are per OS
// (font rendering differs): generate and review them with
// `pnpm test:visual:update`, then commit the PNGs.
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
