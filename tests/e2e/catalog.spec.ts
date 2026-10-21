import { expect, test, type Page } from "@playwright/test";

import { openWithScenario } from "../fixtures/mock-api.ts";
import { signIn } from "../fixtures/session.ts";

const cardNames = (page: Page) =>
  page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("heading", { level: 3 });

test.describe("catálogo — estado na URL", { tag: "@desktop" }, () => {
  test("busca, filtros combinados, ordenação e histórico", async ({ page }) => {
    await openWithScenario(page);

    await page.getByRole("searchbox", { name: "Buscar NFTs" }).fill("golden");
    await expect(page).toHaveURL(/[?&]q=golden/);
    await page.getByRole("checkbox", { name: /Música/ }).check();
    await page.getByRole("checkbox", { name: /Polygon/ }).check();
    await expect(page).toHaveURL(/collection=musica/);
    await expect(page).toHaveURL(/network=polygon/);
    await expect(cardNames(page)).toHaveText(["Golden Beat #207", "Golden Echo #094"]);

    await page.getByRole("combobox", { name: "Ordenar por:" }).click();
    await page.getByRole("option", { name: "Menor preço" }).click();
    await expect(page).toHaveURL(/sort=price_asc/);
    await expect(cardNames(page)).toHaveText(["Golden Echo #094", "Golden Beat #207"]);

    await page.reload();
    await expect(cardNames(page)).toHaveText(["Golden Echo #094", "Golden Beat #207"]);
    await expect(page.getByRole("checkbox", { name: /Música/ })).toBeChecked();

    await page.goBack();
    await expect(page).not.toHaveURL(/sort=/);
    await expect(cardNames(page)).toHaveText(["Golden Beat #207", "Golden Echo #094"]);
    await page.goForward();
    await expect(cardNames(page)).toHaveText(["Golden Echo #094", "Golden Beat #207"]);
  });

  test("mudar filtro na página 3 volta para a página 1", async ({ page }) => {
    await openWithScenario(page);
    await page.getByRole("button", { name: "Página 3" }).click();
    await expect(page).toHaveURL(/page=3/);
    await expect(page.getByRole("button", { name: "Página 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByRole("checkbox", { name: /Ethereum/ }).check();
    await expect(page).not.toHaveURL(/page=/);
    await expect(page.getByRole("button", { name: "Página 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("jitter: digitar rápido nunca mostra o resultado de uma busca antiga", async ({ page }) => {
    await openWithScenario(page, { scenario: "jitter", latency: null });
    const search = page.getByRole("searchbox", { name: "Buscar NFTs" });

    // Type "ivory" only once the "golden" request is in flight (past the debounce).
    const goldenSent = page.waitForRequest(
      (request) => request.url().includes("/api/nfts?") && request.url().includes("q=golden"),
    );
    await search.fill("golden");
    await goldenSent;
    await search.fill("ivory");
    await expect(page).toHaveURL(/q=ivory/);

    await expect(cardNames(page)).toHaveText(
      ["Ivory Baron #088", "Ivory Consul #240", "Ivory Marquis #066"],
      {
        timeout: 15_000,
      },
    );
    // Whatever arrives late for "golden" must never replace the current list.
    await page.waitForLoadState("networkidle");
    await expect(cardNames(page).filter({ hasText: "Golden" })).toHaveCount(0);
  });

  test("estado vazio com ação de limpar filtros", async ({ page }) => {
    await openWithScenario(page, { scenario: "empty" });
    await page.getByRole("searchbox", { name: "Buscar NFTs" }).fill("qualquer");
    await expect(page.getByText("Nenhum NFT encontrado")).toBeVisible();

    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await expect(page).not.toHaveURL(/q=/);
    await expect(page.getByRole("searchbox", { name: "Buscar NFTs" })).toHaveValue("");
  });
});

test.describe("catálogo — carregamento e falhas", () => {
  test("skeleton durante rede lenta", async ({ page }) => {
    await openWithScenario(page, { scenario: "slow-network", latency: null });
    await expect(page.getByLabel("Carregando NFTs")).toBeVisible();
    await expect(cardNames(page).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("Carregando NFTs")).toHaveCount(0);
  });

  test("falha mostra erro e a nova tentativa recupera", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/rota-que-nao-existe");
    await page.locator("main#conteudo").waitFor();
    // GET /nfts serves the grid and the featured card; three failures each
    // (first attempt + two automatic retries) leave the grid in error.
    await page.evaluate(() => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        window.__kurioMock?.failNextRequest("GET", "/nfts");
      }
    });
    await page.getByRole("link", { name: "Voltar para o início" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Não foi possível carregar" }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(cardNames(page).first()).toBeVisible();
  });
});

test.describe("favoritos", { tag: "@desktop" }, () => {
  test("visitante é levado ao login guardando o retorno", async ({ page }) => {
    await openWithScenario(page);
    await page.getByRole("button", { name: "Favoritar Sage Nomad #009" }).click({ force: true });
    await expect(page).toHaveURL(/\/entrar\?redirect=%2F/);
  });

  test("falha na mutation reverte o coração e avisa; nova tentativa persiste", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    const heart = page.getByRole("button", { name: "Favoritar Sage Nomad #009" });
    await expect(heart).toHaveAttribute("aria-pressed", "false");

    await page.evaluate(() => window.__kurioMock?.failNextRequest("POST", "/favorites"));
    await heart.click({ force: true });
    await expect(page.getByText(/Não foi possível favoritar Sage Nomad #009/)).toBeVisible();
    await expect(heart).toHaveAttribute("aria-pressed", "false");

    await heart.click({ force: true });
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    // Success is announced to screen readers only (live region), with no toast.
    await expect(page.getByText("Sage Nomad #009 foi favoritado.")).toHaveCount(1);
    await page.reload();
    await expect(page.getByRole("button", { name: "Favoritar Sage Nomad #009" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

test("coleção do rodapé abre o catálogo filtrado", { tag: "@desktop" }, async ({ page }) => {
  await openWithScenario(page);
  await page.getByRole("contentinfo").getByRole("link", { name: "Fotografia" }).click();
  await expect(page).toHaveURL(/collection=fotografia/);
  await expect(page.getByRole("checkbox", { name: /Fotografia/ })).toBeChecked();
});

test.describe("catálogo mobile", { tag: "@mobile" }, () => {
  test("ação central da tab bar leva à busca com o campo focado", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/carrinho");
    await page
      .getByRole("navigation", { name: "Principal" })
      .getByRole("link", { name: "Explorar coleções" })
      .click();
    await expect(page.locator("#busca-mobile")).toBeFocused();
  });

  test("filtros no drawer combinam e refletem na URL", async ({ page }) => {
    await openWithScenario(page);
    await page.getByRole("button", { name: /^Filtros/ }).click();
    const sheet = page.getByRole("dialog", { name: "Filtros" });
    await sheet.getByRole("checkbox", { name: /Arte digital/ }).check();
    await sheet.getByRole("checkbox", { name: /Solana/ }).check();
    await expect(page).toHaveURL(/collection=arte-digital/);
    await expect(page).toHaveURL(/network=solana/);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /Filtros, 2 ativos/ })).toBeFocused();
  });
});
