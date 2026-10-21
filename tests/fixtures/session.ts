import type { Page } from "@playwright/test";

import { login } from "./mock-api.ts";

/**
 * Signs in through the simulated API and stores the session token where the
 * app reads it, then reloads so the app boots with that session. Stands in for
 * the login screen until the account flows exist.
 */
export async function signIn(page: Page, email = "colecionador@kurio.test"): Promise<void> {
  const token = await login(page, email);
  await page.evaluate((value) => {
    localStorage.setItem("kurio.session-token", value);
  }, token);
  await page.reload();
  await page.locator("main#conteudo").waitFor();
}
