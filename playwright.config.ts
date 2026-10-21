import { defineConfig, devices } from "@playwright/test";

const PORT = 5173;
const isCI = Boolean(process.env.CI);

export const projects = [
  {
    name: "chromium-desktop",
    // Tests tagged for one viewport only run in that project.
    grepInvert: /@mobile/,
    use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
  },
  {
    name: "chromium-mobile",
    grepInvert: /@desktop|@api/,
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    },
  },
];

export default defineConfig({
  testDir: "./tests",
  // Screenshot comparisons depend on the OS font rendering: they run apart,
  // against the production build (playwright.visual.config.ts).
  testIgnore: ["visual/**"],
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // The app renders after the MSW worker starts (~1s in dev, more under parallel load).
  expect: { timeout: 10_000 },
  // On a cold start the dev server compiles modules on demand: the first page
  // of a worker can take several seconds, and flows that cross many pages
  // (login, logout, login again) go past the default 30s.
  timeout: 45_000,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects,
  webServer: {
    command: "pnpm dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
