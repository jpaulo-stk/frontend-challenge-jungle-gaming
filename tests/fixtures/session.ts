import { expect, type Page } from "@playwright/test";

import { login } from "./mock-api.ts";

/** Login through the API, store the token and reload. */
export async function signIn(page: Page, email = "colecionador@kurio.test"): Promise<void> {
  const token = await login(page, email);
  await page.evaluate((value) => {
    localStorage.setItem("kurio.session-token", value);
  }, token);
  await page.reload();
  await page.locator("main#conteudo").waitFor();
}

export async function loginThroughDialog(
  page: Page,
  email = "colecionador@kurio.test",
  password = "kurio123",
): Promise<void> {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^E-mail/).fill(email);
  await dialog.getByLabel(/^Senha/).fill(password);
  await dialog.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(dialog).toBeHidden();
}
