import { expect, test } from "@playwright/test";

import { openApp } from "../fixtures/app.ts";
import { openWithScenario } from "../fixtures/mock-api.ts";
import { loginThroughDialog, signIn } from "../fixtures/session.ts";

// The mock runs in the page, so page.clock also drives session and quote expiry

test.describe("expiração pelo tempo", { tag: "@desktop" }, () => {
  test("sessão vence depois de 2 horas: login e volta ao destino", async ({ page }) => {
    await page.clock.install();
    await openWithScenario(page);
    await signIn(page);
    await page.goto("/perfil/dados");
    await expect(page.getByLabel(/^Nome de exibição/)).toHaveValue("Colecionador Kurio");

    await page.clock.fastForward("02:01:00");
    await page.getByRole("link", { name: "Carteiras" }).click();

    await expect(page).toHaveURL(/\/entrar\?redirect=/);
    await loginThroughDialog(page);
    await expect(page).toHaveURL(/\/perfil\//);
  });

  test("cotação vencida no reenvio é recusada pela API e a compra é refeita, uma vez só", async ({
    page,
  }) => {
    await page.clock.install();
    await openWithScenario(page, { settle: "manual" });
    await signIn(page);
    await openApp(page, "/pagamento");
    await expect(page.getByLabel(/^Endereço da carteira/)).toHaveValue(/^0xA91F/);
    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(page.getByText("Carteira conectada")).toBeVisible();

    // The first send fails before reaching the order: no answer, attempt kept.
    await page.evaluate(() => window.__kurioMock?.failNextRequest("POST", "/orders", 500));
    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Não recebemos a resposta" }),
    ).toBeVisible();

    // Eleven minutes later the quote of that attempt has expired (10 min).
    await page.clock.fastForward("11:00");
    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "A cotação deste pedido não vale mais" }),
    ).toBeVisible();
    expect(await page.evaluate(() => window.__kurioMock?.orderCount())).toBe(1);

    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await expect(page.getByRole("heading", { name: "Processando seu pedido" })).toBeVisible();
    expect(await page.evaluate(() => window.__kurioMock?.orderCount())).toBe(2);
  });
});
