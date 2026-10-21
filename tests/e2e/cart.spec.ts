import { expect, test, type Page } from "@playwright/test";

import { openApp } from "../fixtures/app.ts";
import { openWithScenario } from "../fixtures/mock-api.ts";
import { signIn } from "../fixtures/session.ts";

const total = (page: Page) =>
  page.getByRole("region", { name: "Resumo da carteira" }).getByRole("definition").last();

async function openCart(page: Page): Promise<void> {
  await openWithScenario(page);
  await signIn(page);
  await openApp(page, "/carrinho");
  await expect(total(page)).toHaveText("26.846 ETH");
}

test.describe("carrinho", () => {
  test("quantidade e remoção refazem o resumo pela cotação e persistem após refresh", async ({
    page,
  }) => {
    await openCart(page);
    await page
      .getByRole("group", { name: /Quantidade de Emerald Ape #042/ })
      .getByRole("button", { name: "Aumentar quantidade" })
      .click();
    // 3 × 1.19 + 8.34 + 16.11 + 0.016
    await expect(total(page)).toHaveText("28.036 ETH");

    await page.getByRole("button", { name: "Remover Ivory Baron #088" }).click();
    await expect(total(page)).toHaveText("11.926 ETH");

    await page.reload();
    await expect(total(page)).toHaveText("11.926 ETH");
    await expect(page.getByRole("button", { name: "Remover Ivory Baron #088" })).toHaveCount(0);
  });

  test("cupom inválido e expirado aparecem no campo; o válido entra no total", async ({ page }) => {
    await openCart(page);
    const field = page.getByLabel("Código promocional");
    const apply = page.getByRole("button", { name: "Aplicar" });

    await field.fill("NAOEXISTE");
    await apply.click();
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Cupom inválido.")).toBeVisible();

    await field.fill("EXPIRADO2025");
    await apply.click();
    await expect(page.getByText("Este cupom expirou.")).toBeVisible();

    await field.fill("KURIO10");
    await apply.click();
    await expect(page.getByText("Cupom KURIO10 aplicado.")).toBeVisible();
    await expect(total(page)).toHaveText("24.163 ETH");

    await page.getByRole("button", { name: "Remover cupom" }).click();
    await expect(total(page)).toHaveText("26.846 ETH");
  });

  test("visitante vai ao login antes do pagamento", { tag: "@desktop" }, async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/pagamento");
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/);
  });
});
