import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { openApp } from "../fixtures/app.ts";
import { openWithScenario } from "../fixtures/mock-api.ts";
import { signIn } from "../fixtures/session.ts";

// axe on the four main screens, in both projects (desktop 1440 and mobile 390).
// Serious and critical violations fail the test; the rest is reported.

async function audit(page: Page, screen: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  const summary = blocking.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.slice(0, 5).map((node) => node.target.join(" ")),
  }));
  expect(summary, `${screen}: violações sérias ou críticas`).toEqual([]);
}

test.describe("acessibilidade (axe)", () => {
  test("início", async ({ page }) => {
    await openWithScenario(page);
    await expect(
      page
        .getByRole("region", { name: "Catálogo de NFTs" })
        .getByRole("heading", { level: 3 })
        .first(),
    ).toBeVisible();
    await audit(page, "Início");
  });

  test("detalhe do NFT", async ({ page }) => {
    await openWithScenario(page);
    await openApp(page, "/nft/emerald-ape-042");
    await expect(page.getByRole("heading", { level: 1, name: "Emerald Ape #042" })).toBeVisible();
    await audit(page, "Detalhe");
  });

  test("carrinho", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await openApp(page, "/carrinho");
    await expect(page.getByRole("button", { name: "Remover Emerald Ape #042" })).toBeVisible();
    await audit(page, "Carrinho");
  });

  test("pagamento", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await openApp(page, "/pagamento");
    await expect(page.getByLabel(/^Endereço da carteira/)).toHaveValue(/^0xA91F/);
    await audit(page, "Pagamento");
  });
});
