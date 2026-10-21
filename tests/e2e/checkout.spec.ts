import { expect, test, type Page } from "@playwright/test";

import { openApp } from "../fixtures/app.ts";
import { openWithScenario, type MockOptions } from "../fixtures/mock-api.ts";
import { loginThroughDialog, signIn } from "../fixtures/session.ts";

// The first collector's cart (fixtures): Emerald Ape ×2 (2.38), Violet Nomad ×6
// (8.34) and Ivory Baron ×9 (16.11) = 26.83 ETH + 0.016 fee = 26.846 ETH.
const COLLECTOR = "user_colecionador";

async function openCheckout(page: Page, options: MockOptions = {}): Promise<void> {
  await openWithScenario(page, options);
  await signIn(page);
  await openApp(page, "/pagamento");
  await expect(page.getByLabel(/^Endereço da carteira/)).toHaveValue(/^0xA91F/);
}

const summaryTotal = (page: Page) =>
  page.getByRole("region", { name: "Seus NFTs" }).getByRole("definition").last();

async function connectWallet(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Conectar carteira" }).click();
  await expect(page.getByText("Carteira conectada")).toBeVisible();
}

// Wait for the page itself: the URL changes before the route renders
const processing = (page: Page) => page.getByRole("heading", { name: "Processando seu pedido" });

async function waitForRoom(page: Page, nftId: string): Promise<void> {
  await page.waitForFunction(
    (id) => window.__kurioMock?.realtimeClients().some((client) => client.rooms.includes(id)),
    nftId,
  );
}

const confirmButton = (page: Page) => page.getByRole("button", { name: "Confirmar compra" });
const orderCount = (page: Page) => page.evaluate(() => window.__kurioMock?.orderCount());
const cartOf = (page: Page) => page.evaluate((id) => window.__kurioMock?.cartOf(id), COLLECTOR);
const orderIdFrom = (page: Page) => new URL(page.url()).pathname.split("/").pop() ?? "";

async function settle(page: Page, outcome: "confirmed" | "rejected"): Promise<void> {
  await page.evaluate(([id, result]) => window.__kurioMock?.settleOrder(id, result), [
    orderIdFrom(page),
    outcome,
  ] as const);
}

test.describe("pagamento", { tag: "@desktop" }, () => {
  test("compra completa: pendente sobrevive ao refresh e o recibo não muda com o catálogo", async ({
    page,
  }) => {
    await openCheckout(page, { settle: "manual" });
    await expect(summaryTotal(page)).toHaveText("26.846 ETH");
    await connectWallet(page);
    await confirmButton(page).click();

    await expect(page).toHaveURL(/\/pedido\/order_/);
    await expect(processing(page)).toBeVisible();
    await page.reload();
    await expect(processing(page)).toBeVisible();

    await settle(page, "confirmed");
    const receipt = page.getByRole("dialog", { name: "Seus NFTs agora estão na sua carteira" });
    await expect(receipt).toBeVisible();
    const emerald = receipt.getByRole("row", { name: /Emerald Ape #042/ });
    await expect(emerald).toContainText("(x 2)");
    await expect(emerald).toContainText("2.38 ETH");
    await expect(receipt.getByText("26.846 ETH")).toHaveCount(2);
    await expect(receipt.getByRole("link", { name: /Ver no Etherscan/ })).toHaveAttribute(
      "href",
      /^https:\/\/etherscan\.io\/tx\/0x[0-9a-f]{64}$/,
    );
    await expect(receipt.getByText(/Link simulado/)).toBeVisible();
    expect(await cartOf(page)).toEqual([]);

    // A later catalog change never reaches the frozen receipt.
    await page.evaluate(() => window.__kurioMock?.raiseNftPrice("emerald-ape-042", 50));
    await page.reload();
    await expect(emerald).toContainText("2.38 ETH");
    await expect(receipt.getByText("26.846 ETH")).toHaveCount(2);
  });

  test("cinco cliques seguidos em Confirmar compra geram um único pedido", async ({ page }) => {
    await openCheckout(page, { settle: "manual", latency: 150 });
    await connectWallet(page);
    expect(await orderCount(page)).toBe(1);

    await confirmButton(page).click({ clickCount: 5 });
    await expect(page).toHaveURL(/\/pedido\/order_/);
    expect(await orderCount(page)).toBe(2);
  });

  test("order-timeout: tentar novamente recupera o mesmo pedido", async ({ page }) => {
    // The first response never arrives; the client gives up after its 15s timeout.
    test.setTimeout(60_000);
    await openCheckout(page, { scenario: "order-timeout", settle: "manual" });
    await connectWallet(page);
    await confirmButton(page).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Não recebemos a resposta" }),
    ).toBeVisible({
      timeout: 25_000,
    });
    // The order was created; only its answer was lost.
    expect(await orderCount(page)).toBe(2);

    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(page).toHaveURL(/\/pedido\/order_/);
    await expect(page.getByRole("heading", { name: "Processando seu pedido" })).toBeVisible();
    expect(await orderCount(page)).toBe(2);
  });

  test("payment-rejected: pedido recusado deixa o carrinho intacto", async ({ page }) => {
    await openCheckout(page, { scenario: "payment-rejected", settleDelay: 100 });
    await connectWallet(page);
    await confirmButton(page).click();

    await expect(page.getByRole("heading", { name: "Pagamento não concluído" })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("O pagamento foi recusado pela carteira.");
    expect(await cartOf(page)).toHaveLength(3);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("link", { name: "Voltar ao pagamento" }).click();
    await expect(summaryTotal(page)).toHaveText("26.846 ETH");
    await expect(page.getByText("Você tem um pedido em processamento.")).toHaveCount(0);
  });

  test("preço alterado por evento bloqueia o envio até a reconfirmação", async ({ page }) => {
    await openCheckout(page, { settle: "manual" });
    await connectWallet(page);
    await waitForRoom(page, "emerald-ape-042");
    await page.evaluate(() => window.__kurioMock?.raiseNftPrice("emerald-ape-042", 10));

    const notice = page.getByRole("status").filter({ hasText: "Os valores mudaram enquanto" });
    await expect(notice).toContainText(
      "Emerald Ape #042: o preço mudou de 1.19 ETH para 1.31 ETH.",
    );
    await expect(summaryTotal(page)).toHaveText("27.086 ETH");
    await confirmButton(page).click();

    const review = page.getByRole("dialog", { name: "Os valores mudaram" });
    await expect(review).toContainText(
      "Emerald Ape #042: o preço mudou de 1.19 ETH para 1.31 ETH.",
    );
    await expect(review).toContainText("O total mudou de 26.846 ETH para 27.086 ETH.");
    expect(await orderCount(page)).toBe(1);

    await review.getByRole("button", { name: "Confirmar com os novos valores" }).click();
    await expect(processing(page)).toBeVisible();
    await expect(page.getByRole("main").getByText("27.086 ETH")).toBeVisible();
    expect(await orderCount(page)).toBe(2);
  });

  test("edição esgotada é destacada e impede a compra", async ({ page }) => {
    await openCheckout(page, { settle: "manual" });
    await connectWallet(page);
    await waitForRoom(page, "emerald-ape-042");
    await page.evaluate(() =>
      window.__kurioMock?.setEditionAvailability("emerald-ape-042", "1-50", 0),
    );

    await expect(page.getByText(/Edição esgotada/)).toBeVisible();
    await confirmButton(page).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Há itens indisponíveis" }),
    ).toBeVisible();
    expect(await orderCount(page)).toBe(1);

    await page.goto("/carrinho");
    await expect(
      page.getByText("Esta edição esgotou. Remova o item para continuar."),
    ).toBeVisible();
  });

  test("compra parcial (2 de 3) mantém no carrinho exatamente o que ficou", async ({ page }) => {
    await openCheckout(page, { settle: "manual" });
    await page.getByRole("button", { name: "Deixar para depois: Ivory Baron #088" }).click();
    // 2.38 + 8.34 + 0.016
    await expect(summaryTotal(page)).toHaveText("10.736 ETH");
    await connectWallet(page);
    await confirmButton(page).click();

    await expect(page).toHaveURL(/\/pedido\/order_/);
    await settle(page, "confirmed");
    const receipt = page.getByRole("dialog", { name: "Seus NFTs agora estão na sua carteira" });
    await expect(receipt.getByRole("row", { name: /Emerald Ape|Violet Nomad/ })).toHaveCount(2);
    await expect(receipt.getByRole("row", { name: /Ivory Baron/ })).toHaveCount(0);
    expect(await cartOf(page)).toEqual([
      expect.objectContaining({ nftId: "ivory-baron-088", editionId: "open", quantity: 9 }),
    ]);
  });

  test("coupon-expired: o cupom cai no checkout, o total é refeito e o envio espera", async ({
    page,
  }) => {
    await openWithScenario(page, { scenario: "coupon-expired", settle: "manual" });
    await signIn(page);
    await openApp(page, "/carrinho");
    await page.getByLabel("Código promocional").fill("kurio10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByText("Cupom KURIO10 aplicado.")).toBeVisible();
    await page.getByRole("link", { name: "Conectar e finalizar" }).click();

    await expect(page).toHaveURL("/pagamento");
    // 26.83 − 10% (2.683) + 0.016
    await expect(summaryTotal(page)).toHaveText("24.163 ETH");
    await connectWallet(page);
    await confirmButton(page).click();

    const review = page.getByRole("dialog", { name: "Os valores mudaram" });
    await expect(review).toContainText("O cupom KURIO10 não é mais válido e foi retirado.");
    await expect(review).toContainText("O total mudou de 24.163 ETH para 26.846 ETH.");
    await review.getByRole("button", { name: "Confirmar com os novos valores" }).click();
    await expect(processing(page)).toBeVisible();
    await expect(page.getByRole("main").getByText("26.846 ETH")).toBeVisible();
  });

  test("sessão expirada no checkout volta ao login e retoma com o que foi digitado", async ({
    page,
  }) => {
    await openCheckout(page);
    await page.getByRole("button", { name: "Deixar para depois: Ivory Baron #088" }).click();
    const note = page.getByLabel(/^Observação do colecionador/);
    await note.fill("Entregar no cofre principal");

    await page.evaluate(() => window.__kurioMock?.expireSessionOnNextRequest());
    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/);
    await loginThroughDialog(page);

    await expect(page).toHaveURL("/pagamento");
    await expect(note).toHaveValue("Entregar no cofre principal");
    await expect(summaryTotal(page)).toHaveText("10.736 ETH");
  });

  test("formulário inválido não envia e aponta os campos", async ({ page }) => {
    await openCheckout(page);
    await page.getByLabel(/^Código de indicação/).fill("");
    await page.getByLabel(/^E-mail/).fill("sem-arroba");
    await confirmButton(page).click();

    await expect(page.getByLabel(/^Código de indicação/)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Informe o código de indicação.")).toBeVisible();
    await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
    expect(await orderCount(page)).toBe(1);
  });

  test("wallet-rejected: a recusa da carteira fica visível e nada é enviado", async ({ page }) => {
    await openCheckout(page, { scenario: "wallet-rejected" });
    await page.getByRole("button", { name: "Conectar carteira" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "A conexão foi recusada" }),
    ).toBeVisible();

    await confirmButton(page).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Conecte a carteira para confirmar a compra." }),
    ).toBeVisible();
    expect(await orderCount(page)).toBe(1);
  });
});

test.describe("pedido", () => {
  test("recibo antigo abre direto pelo endereço", { tag: "@desktop" }, async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await openApp(page, "/pedido/order_c_0001");
    const receipt = page.getByRole("dialog", { name: "Seus NFTs agora estão na sua carteira" });
    await expect(receipt.getByRole("row", { name: /Golden Frequency #071/ })).toContainText(
      "1.18 ETH",
    );
    await expect(receipt.getByText("1.196 ETH")).toHaveCount(2);
  });

  test("pedido de outro colecionador responde como inexistente", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page, "nova.sato@kurio.test");
    await openApp(page, "/pedido/order_c_0001");
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  });

  test("recibo ocupa a tela toda no mobile", { tag: "@mobile" }, async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await openApp(page, "/pedido/order_c_0001");
    const receipt = page.getByRole("dialog", { name: "Seus NFTs agora estão na sua carteira" });
    await expect(receipt).toBeVisible();
    const box = await receipt.boundingBox();
    expect(box).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
  });
});

test.describe("pagamento no mobile", { tag: "@mobile" }, () => {
  test("carteira primeiro, compra até o processamento", async ({ page }) => {
    await openCheckout(page, { settle: "manual" });
    await expect(page.getByRole("heading", { name: "Pagamento com carteira" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Cofre principal/ })).toBeChecked();
    await expect(page.getByRole("link", { name: "Trocar carteira" })).toHaveAttribute(
      "href",
      "/perfil/carteiras",
    );
    await expect(page.getByRole("radio", { name: "MetaMask" })).toBeChecked();
    await connectWallet(page);
    await confirmButton(page).click();
    await expect(page.getByRole("heading", { name: "Processando seu pedido" })).toBeVisible();
  });
});
