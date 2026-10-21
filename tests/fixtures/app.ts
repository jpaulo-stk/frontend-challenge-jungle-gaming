import type { Page } from "@playwright/test";

/**
 * Navigates and waits for the app shell. With mocks enabled the app renders
 * only after the MSW service worker is running, so `page.goto` resolving is
 * not enough to start interacting.
 */
export async function openApp(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.locator("main#conteudo").waitFor();
}
