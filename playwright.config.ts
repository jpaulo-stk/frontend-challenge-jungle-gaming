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
  // Visual tests run separately (playwright.visual.config.ts)
  testIgnore: ["visual/**"],
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  expect: { timeout: 10_000 },
  // A cold dev server compiles on demand; long flows need more than 30s
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
