import { expect, test } from "@playwright/test";

import { openWithScenario } from "../fixtures/mock-api.ts";

test.describe("detalhe do NFT", () => {
  test("acesso direto mostra o NFT com a edição numerada pré-selecionada", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/nft/emerald-ape-042");

    await expect(page.getByRole("heading", { level: 1, name: "Emerald Ape #042" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "1/50" })).toBeChecked();
    await expect(page.getByRole("tab", { name: "Detalhes do NFT" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("NFT inexistente mostra a 404 do projeto", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/nft/id-inexistente");
    await expect(
      page.getByRole("heading", { level: 1, name: "Página não encontrada" }),
    ).toBeVisible();
  });

  test("edição esgotada fica desabilitada com o motivo", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/nft/amber-lens-301");

    await expect(page.getByRole("radio", { name: /1\/10/ })).toBeDisabled();
    await expect(page.getByText("Esgotada: 1/10.")).toBeVisible();
  });
});

test.describe("detalhe do NFT — compra", { tag: "@desktop" }, () => {
  test("quantidade limitada ao estoque da edição", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/nft/emerald-ape-042");

    await page.getByRole("radio", { name: "1/1", exact: true }).click();
    const stepper = page.getByRole("group", { name: "Quantidade de Emerald Ape #042" });
    await expect(stepper.getByRole("button", { name: "Aumentar quantidade" })).toBeDisabled();
    await expect(page.getByText("1 disponíveis nesta edição")).toBeVisible();

    await page.getByRole("radio", { name: "1/10" }).click();
    for (let step = 0; step < 3; step += 1)
      await stepper.getByRole("button", { name: "Aumentar quantidade" }).click();
    await expect(stepper.getByRole("status")).toHaveText("4");
    await expect(stepper.getByRole("button", { name: "Aumentar quantidade" })).toBeDisabled();
  });

  test("COMPRAR adiciona ao carrinho e leva ao carrinho", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/nft/emerald-ape-042");
    await page.getByRole("radio", { name: "1/10" }).click();
    await page.getByRole("button", { name: "Aumentar quantidade" }).click();

    await page.getByRole("button", { name: "Comprar", exact: true }).click();
    await expect(page).toHaveURL("/carrinho");
    await expect(page.getByRole("link", { name: "Carrinho, 2 itens" })).toBeVisible();
  });

  test("zoom abre em diálogo com foco preso e devolve o foco", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/nft/emerald-ape-042");
    const trigger = page.getByRole("button", { name: "Ampliar imagem" });

    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Emerald Ape #042" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Fechar" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("detalhe do NFT — mobile", { tag: "@mobile" }, () => {
  test("barra fixa soma o total pela quantidade e compra", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/nft/emerald-ape-042");

    await page.getByRole("button", { name: "Aumentar quantidade" }).click();
    await expect(page.getByText("2.38 ETH")).toBeVisible();
    await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
    await expect(page).toHaveURL("/carrinho");
  });
});
