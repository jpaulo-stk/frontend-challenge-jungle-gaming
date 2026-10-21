import { expect, test, type Page } from "@playwright/test";

import { openApp } from "../fixtures/app.ts";
import { openWithScenario } from "../fixtures/mock-api.ts";
import { signIn } from "../fixtures/session.ts";

// Stable data: fresh database, fixed clock, local assets, no animations

const FIXED_TIME = new Date("2026-10-21T12:00:00-03:00");

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (const image of document.querySelectorAll("img")) image.loading = "eager";
    await Promise.all(
      [...document.images].map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) resolve();
            else
              image.addEventListener("load", () => {
                resolve();
              });
          }),
      ),
    );
    await document.fonts.ready;
  });
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(FIXED_TIME);
});

test("início", async ({ page }) => {
  await openWithScenario(page);
  await expect(
    page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("heading", { level: 3 }),
  ).toHaveCount(12);
  await settle(page);
  await expect(page).toHaveScreenshot("inicio.png", { fullPage: true });
});

test("detalhe do NFT", async ({ page }) => {
  await openWithScenario(page);
  await openApp(page, "/nft/emerald-ape-042");
  await expect(page.getByRole("heading", { level: 1, name: "Emerald Ape #042" })).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot("detalhe.png", { fullPage: true });
});

test("carrinho", async ({ page }) => {
  await openWithScenario(page);
  await signIn(page);
  await openApp(page, "/carrinho");
  await expect(
    page.getByRole("region", { name: "Resumo da carteira" }).getByRole("definition").last(),
  ).toHaveText("26.846 ETH");
  await settle(page);
  await expect(page).toHaveScreenshot("carrinho.png", { fullPage: true });
});

test("pagamento", async ({ page }) => {
  await openWithScenario(page);
  await signIn(page);
  await openApp(page, "/pagamento");
  await expect(page.getByLabel(/^Endereço da carteira/)).toHaveValue(/^0xA91F/);
  await expect(
    page.getByRole("region", { name: "Seus NFTs" }).getByRole("definition").last(),
  ).toHaveText("26.846 ETH");
  await settle(page);
  await expect(page).toHaveScreenshot("pagamento.png", { fullPage: true });
});
