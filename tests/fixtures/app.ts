import type { Page } from "@playwright/test";

/** Navigates and waits for the shell (the app renders once the MSW worker is up). */
export async function openApp(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.locator("main#conteudo").waitFor();
}
