import { expect, test } from "@playwright/test";

import { openApp } from "../fixtures/app.ts";

test("abre a home", async ({ page }) => {
  await openApp(page, "/");

  await expect(page).toHaveTitle("Kurio — Marketplace de NFTs");
  await expect(page.getByRole("heading", { level: 1, name: "Início" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
});

test("rota inexistente mostra a página 404 do projeto", async ({ page }) => {
  await openApp(page, "/rota-que-nao-existe");

  await expect(
    page.getByRole("heading", { level: 1, name: "Página não encontrada" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar para o início" }).click();
  await expect(page).toHaveURL("/");
});

test("rota privada redireciona visitante ao login guardando o destino", async ({ page }) => {
  await openApp(page, "/pagamento");

  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento$/);
  await expect(page.getByRole("dialog", { name: "Entrar" })).toBeVisible();
});
