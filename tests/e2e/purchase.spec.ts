import { expect, test } from "@playwright/test";

import { openApp } from "../fixtures/app.ts";
import { openWithScenario } from "../fixtures/mock-api.ts";
import { signIn } from "../fixtures/session.ts";

// The whole journey through the interface, from the catalog to the receipt
// settled by the simulation (Nova Sato: 1 item in the cart, two wallets).

test("compra completa: do catálogo ao recibo confirmado", async ({ page, isMobile }) => {
  await openWithScenario(page, { settleDelay: 300 });
  await signIn(page, "nova.sato@kurio.test");

  // Catalog → detail.
  await page.getByRole("searchbox", { name: "Buscar NFTs" }).first().fill("emerald");
  const catalog = page.getByRole("region", { name: "Catálogo de NFTs" });
  await catalog
    .getByRole("link", { name: /Emerald Ape #042/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/nft\/emerald-ape-042/);

  // Detail → cart (COMPRAR adds the selected edition and goes to the cart).
  // Mobile has its fixed purchase bar, as in the frame.
  const buy = page.getByRole("button", { name: isMobile ? "Comprar NFT" : "Comprar", exact: true });
  await buy.click();
  await expect(page).toHaveURL("/carrinho");
  await expect(page.getByRole("button", { name: "Remover Emerald Ape #042" })).toBeVisible();

  // Cart → payment.
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  await expect(page).toHaveURL("/pagamento");
  await expect(page.getByLabel(/^Endereço da carteira/)).toHaveValue(/^0x/);
  await page.getByRole("button", { name: "Conectar carteira" }).click();
  await expect(page.getByText("Carteira conectada")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar compra" }).click();

  // Pending → confirmed by the simulation → receipt.
  await expect(page.getByRole("heading", { name: "Processando seu pedido" })).toBeVisible();
  const receipt = page.getByRole("dialog", { name: "Seus NFTs agora estão na sua carteira" });
  await expect(receipt).toBeVisible();
  await expect(receipt.getByRole("row", { name: /Emerald Ape #042/ })).toBeVisible();
  await expect(receipt.getByRole("row", { name: /Golden Beat #207/ })).toBeVisible();

  // What was bought left the cart.
  await openApp(page, "/carrinho");
  await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
});
