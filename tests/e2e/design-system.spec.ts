import { expect, test, type Page } from "@playwright/test";

import { openApp } from "../fixtures/app.ts";

async function describeFocus(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return null;
    const style = getComputedStyle(element);
    const pseudo = getComputedStyle(element, "::after");
    const visible =
      (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) ||
      style.boxShadow !== "none" ||
      pseudo.boxShadow !== "none";
    const landmark = element.closest("header, main, footer, nav")?.tagName.toLowerCase() ?? "body";
    return { landmark, visible, text: element.textContent.trim().slice(0, 30) };
  });
}

test.describe("layout desktop", { tag: "@desktop" }, () => {
  test("header mostra a marca e o item de navegação ativo", async ({ page }) => {
    await openApp(page, "/");

    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "KURIO" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Início" })).toHaveAttribute(
      "data-status",
      "active",
    );
    await expect(header.getByRole("link", { name: /Carrinho, 0 itens/ })).toBeVisible();
  });

  test("Tab percorre header, conteúdo e rodapé com foco visível", async ({ page }) => {
    await openApp(page, "/rota-que-nao-existe");

    const visited: string[] = [];
    for (let step = 0; step < 40; step += 1) {
      await page.keyboard.press("Tab");
      const focus = await describeFocus(page);
      if (!focus || focus.landmark === "body") continue;
      expect(focus.visible, `foco invisível em "${focus.text}"`).toBe(true);
      const region = focus.landmark === "nav" ? "header" : focus.landmark;
      if (visited.at(-1) !== region) visited.push(region);
      if (region === "footer") break;
    }

    expect(visited.slice(0, 3)).toEqual(["header", "main", "footer"]);
  });

  test("skeleton do card preserva exatamente 258×300", async ({ page }) => {
    await openApp(page, "/__ui");

    const loadingGrid = page.getByLabel("Carregando NFTs");
    const artBox = loadingGrid.locator(":scope > div > div").first();
    const box = await artBox.boundingBox();
    expect(box?.width).toBe(258);
    expect(box?.height).toBe(300);
  });
});

test.describe("layout mobile", { tag: "@mobile" }, () => {
  test("aba Lista de interesse leva ao login guardando o destino", async ({ page }) => {
    await openApp(page, "/");

    await page
      .getByRole("navigation", { name: "Principal" })
      .getByRole("link", { name: "Lista de interesse" })
      .click();
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Ffavoritos$/);
  });

  test("tab bar substitui o header", async ({ page }) => {
    await openApp(page, "/");

    await expect(page.getByRole("banner")).toBeHidden();
    const tabBar = page.getByRole("navigation", { name: "Principal" });
    await expect(tabBar.getByRole("link", { name: "Início" })).toHaveAttribute(
      "data-status",
      "active",
    );
    await expect(tabBar.getByRole("link", { name: /Carrinho/ })).toBeVisible();
  });
});

test("ação fora do escopo avisa em vez de simular sucesso", async ({ page, isMobile }) => {
  await openApp(page, "/");

  const action = isMobile
    ? page
        .getByRole("contentinfo")
        .getByRole("button", { name: /Central de ajuda/ })
        .first()
    : page.getByRole("banner").getByRole("button", { name: /Criadores/ });
  await expect(action).toHaveAttribute("aria-disabled", "true");
  // Playwright won't click aria-disabled controls; use the keyboard
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/não está disponível nesta demonstração/)).toBeVisible();
});

test.describe("movimento reduzido", () => {
  test("shimmer anima por padrão e para com prefers-reduced-motion", async ({ page }) => {
    await openApp(page, "/__ui");
    const skeleton = page.getByLabel("Carregando NFTs").locator("[data-slot=skeleton]").first();

    await expect(skeleton).toHaveCSS("animation-name", "shimmer");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(skeleton).toHaveCSS("animation-name", "none");
  });
});
