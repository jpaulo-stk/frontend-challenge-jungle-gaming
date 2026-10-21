import { expect, test, type Page } from "@playwright/test";

import { openApp } from "../fixtures/app.ts";
import { openWithScenario } from "../fixtures/mock-api.ts";
import { loginThroughDialog, signIn } from "../fixtures/session.ts";

// Every event here starts in the simulated backend (window.__kurioMock changes
// the mock database) and reaches the app through socket.io-client.

const EMERALD = "emerald-ape-042";

/** The app is listening to this NFT on the realtime server. */
async function waitForRoom(page: Page, nftId: string): Promise<void> {
  await page.waitForFunction(
    (id) => window.__kurioMock?.realtimeClients().some((client) => client.rooms.includes(id)),
    nftId,
  );
}

const cartTotal = (page: Page) =>
  page.getByRole("region", { name: "Resumo da carteira" }).getByRole("definition").last();

async function startPendingOrder(page: Page): Promise<string> {
  await openApp(page, "/pagamento");
  await expect(page.getByLabel(/^Endereço da carteira/)).toHaveValue(/^0xA91F/);
  await page.getByRole("button", { name: "Conectar carteira" }).click();
  await expect(page.getByText("Carteira conectada")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar compra" }).click();
  await expect(page.getByRole("heading", { name: "Processando seu pedido" })).toBeVisible();
  return new URL(page.url()).pathname.split("/").pop() ?? "";
}

const receipt = (page: Page) =>
  page.getByRole("dialog", { name: "Seus NFTs agora estão na sua carteira" });

test.describe("tempo real", { tag: "@desktop" }, () => {
  test("detalhe aberto recebe o novo preço por evento", async ({ page }) => {
    await openWithScenario(page);
    await openApp(page, `/nft/${EMERALD}`);
    const main = page.getByRole("main");
    await expect(main.getByText("1.19 ETH").first()).toBeVisible();
    await waitForRoom(page, EMERALD);

    await page.evaluate((id) => window.__kurioMock?.raiseNftPrice(id, 10), EMERALD);
    await expect(main.getByText("1.31 ETH").first()).toBeVisible();
  });

  test("catálogo e destaque abertos recebem o novo preço por evento", async ({ page }) => {
    await openWithScenario(page);
    const catalog = page.getByRole("region", { name: "Catálogo de NFTs" });
    const firstCard = catalog.getByRole("article").first();
    const href = await firstCard.getByRole("link").first().getAttribute("href");
    const nftId = href?.split("/").pop() ?? "";
    await waitForRoom(page, nftId);

    await page.evaluate((id) => window.__kurioMock?.setNftPrice(id, "9.87"), nftId);
    await expect(firstCard).toContainText("9.87 ETH");
  });

  test("o mesmo evento 3 vezes muda o estado uma vez; evento antigo não muda nada", async ({
    page,
  }) => {
    await openWithScenario(page);
    await signIn(page);
    await openApp(page, "/carrinho");
    await expect(cartTotal(page)).toHaveText("26.846 ETH");
    await waitForRoom(page, EMERALD);

    // Each applied event refreshes the cart from REST exactly once.
    let cartFetches = 0;
    page.on("request", (request) => {
      if (request.method() === "GET" && new URL(request.url()).pathname === "/api/cart") {
        cartFetches += 1;
      }
    });

    await page.evaluate((id) => window.__kurioMock?.raiseNftPrice(id, 10), EMERALD);
    await expect(cartTotal(page)).toHaveText("27.086 ETH");
    await expect(page.getByText(/O preço mudou de 1\.19 ETH para/)).toBeVisible();
    await expect(
      page.getByText("O preço de Emerald Ape #042 no seu carrinho mudou para 1.31 ETH."),
    ).toHaveCount(1);

    // Twice more the same event (duplicate delivery), then one older than the current.
    await page.evaluate((id) => {
      window.__kurioMock?.replayLastEvent();
      window.__kurioMock?.replayLastEvent();
      window.__kurioMock?.sendStaleNftEvent(id);
    }, EMERALD);
    // A newer event after them works as a barrier: the others were handled first.
    await page.evaluate((id) => window.__kurioMock?.raiseNftPrice(id, 10), EMERALD);
    await expect(cartTotal(page)).toHaveText("27.346 ETH");

    expect(cartFetches).toBe(2);
  });

  test("sair do detalhe remove as inscrições da tela", async ({ page }) => {
    await openWithScenario(page);
    await openApp(page, `/nft/${EMERALD}`);
    await waitForRoom(page, EMERALD);

    await page
      .getByRole("banner")
      .getByRole("link", { name: /^Carrinho/ })
      .click();
    await expect(page).toHaveURL("/carrinho");
    // One connection left (the app's own), in no NFT room.
    await page.waitForFunction(() => {
      const clients = window.__kurioMock?.realtimeClients() ?? [];
      return clients.length === 1 && clients[0]?.rooms.length === 0;
    });
  });

  test("queda de conexão: avisa, reconecta e refaz o fetch do que está na tela", async ({
    page,
  }) => {
    await openWithScenario(page);
    await openApp(page, `/nft/${EMERALD}`);
    await waitForRoom(page, EMERALD);

    const refetch = page.waitForRequest(
      (request) => new URL(request.url()).pathname === `/api/nfts/${EMERALD}`,
    );
    await page.evaluate(() => window.__kurioMock?.dropConnections());
    await refetch;
    await expect(
      page.getByRole("status").filter({ hasText: "Conexão restabelecida" }),
    ).toBeVisible();
    // The subscriptions are back on the new connection.
    await waitForRoom(page, EMERALD);
  });

  test("pedido pendente: recarregar mostra o mesmo pedido e a confirmação chega por evento", async ({
    page,
  }) => {
    await openWithScenario(page, { settle: "manual" });
    await signIn(page);
    const orderId = await startPendingOrder(page);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Processando seu pedido" })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(`/pedido/${orderId}`);
    expect(await page.evaluate(() => window.__kurioMock?.orderCount())).toBe(2);

    // Polling is off while the realtime link is up: only order.updated settles it.
    await page.waitForFunction(() =>
      window.__kurioMock?.realtimeClients().some((client) => client.userId === "user_colecionador"),
    );
    await page.evaluate((id) => window.__kurioMock?.settleOrder(id, "confirmed"), orderId);
    await expect(receipt(page)).toBeVisible();
    await expect(
      page.getByText("Pedido confirmado. Seus NFTs agora estão na sua carteira."),
    ).toHaveCount(1);
  });

  test("pedido liquidado durante a queda de conexão é recuperado ao reconectar", async ({
    page,
  }) => {
    await openWithScenario(page, { settle: "manual" });
    await signIn(page);
    const orderId = await startPendingOrder(page);

    // The event is published while the app is offline, so it never arrives.
    await page.evaluate((id) => {
      window.__kurioMock?.dropConnections();
      void window.__kurioMock?.settleOrder(id, "rejected");
    }, orderId);

    await expect(page.getByRole("heading", { name: "Pagamento não concluído" })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "recusado" })).toBeVisible();
    expect(await page.evaluate(() => window.__kurioMock?.orderCount())).toBe(2);
  });

  test("troca de usuário: eventos do anterior não chegam ao novo", async ({ page }) => {
    await openWithScenario(page, { settle: "manual" });
    await signIn(page);
    const orderId = await startPendingOrder(page);

    await page.getByRole("banner").getByRole("button", { name: "Sair da conta" }).click();
    await expect(page.getByRole("banner").getByRole("link", { name: "Entrar" })).toBeVisible();
    await page.getByRole("banner").getByRole("link", { name: "Entrar" }).click();
    await loginThroughDialog(page, "nova.sato@kurio.test");

    // The previous connection is gone; the only one left is the new collector's.
    await page.waitForFunction(() => {
      const users = window.__kurioMock?.realtimeClients().map((client) => client.userId) ?? [];
      return users.length === 1 && users[0] === "user_nova";
    });
    // The first collector's order settles now: its event has no connection to go to.
    await page.evaluate((id) => window.__kurioMock?.settleOrder(id, "confirmed"), orderId);
    await expect(page.getByText(/Pedido confirmado/)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Carrinho, 1 item" })).toBeVisible();
  });

  test("sem tempo real, a interface avisa que os dados podem estar desatualizados", async ({
    page,
  }) => {
    await openWithScenario(page, { scenario: "offline" });
    await expect(
      page.getByRole("status").filter({ hasText: "Sem conexão em tempo real" }),
    ).toBeVisible();
  });
});
