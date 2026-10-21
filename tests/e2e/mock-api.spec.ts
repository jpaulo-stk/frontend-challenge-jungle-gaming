import { expect, test, type Page } from "@playwright/test";

import { api, login, openWithScenario } from "../fixtures/mock-api.ts";

// Contract tests of the simulated backend (MSW + Socket.IO). They run once, in
// the desktop project: the behavior under test does not depend on viewport.

type NftList = {
  items: { id: string; price: string; collection: { slug: string }; network: string }[];
  total: number;
  totalPages: number;
};
type Order = { id: string; status: string; total: string; lines: { unitPrice: string }[] };
type Quote = { quoteId: string; total: string; discount: string; issues: { code: string }[] };

/** Path of the app's Socket.IO client module, served by the Vite dev server. */
const SOCKET_MODULE = "/src/shared/realtime/socket.ts";

type SocketLike = {
  on: (event: string, listener: (payload: unknown) => void) => void;
  emit: (event: string, payload: unknown) => void;
  connect: () => void;
  disconnect: () => void;
};
type SocketModule = { createRealtimeSocket: (token: string | null) => Promise<SocketLike> };

const buyer = {
  displayName: "Colecionador Kurio",
  username: "colecionador",
  network: "ethereum",
  profileName: "colecionador",
  walletAddress: "0xA91F3c7B0d24e5F6a8B9c0D1e2F3a4B5c6D7E82C",
  alternateAddress: null,
  provider: "metamask",
  referralCode: "KURIO-COL",
  email: "colecionador@kurio.test",
  ensName: "colecionador",
  note: null,
};

/** Quote + wallet connection: everything `POST /orders` needs. */
async function prepareCheckout(page: Page, token: string, couponCode: string | null = null) {
  const quote = await api(page, {
    method: "POST",
    path: "/cart/quote",
    token,
    body: { couponCode },
  });
  const connection = await api(page, {
    method: "POST",
    path: "/wallet-connections",
    token,
    body: { walletId: "wallet_c_primary", provider: "metamask", network: "ethereum" },
  });
  return {
    quote: quote.body as Quote,
    body: {
      quoteId: (quote.body as Quote).quoteId,
      walletId: "wallet_c_primary",
      connectionId: (connection.body as { id: string }).id,
      buyer,
    },
  };
}

test.describe("API simulada", { tag: "@api" }, () => {
  test("catálogo filtra, ordena e pagina no servidor", async ({ page }) => {
    await openWithScenario(page);

    const all = await api(page, { path: "/nfts" });
    expect((all.body as NftList).total).toBe(36);
    expect((all.body as NftList).totalPages).toBe(3);

    const filtered = await api(page, {
      path: "/nfts?collection[]=musica&collection[]=jogos&network[]=polygon&sort=price_asc",
    });
    const items = (filtered.body as NftList).items;
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(["musica", "jogos"]).toContain(item.collection.slug);
      expect(item.network).toBe("polygon");
    }
    const prices = items.map((item) => Number(item.price));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    const search = await api(page, { path: "/nfts?q=golden&priceMin=0.3&priceMax=1" });
    expect((search.body as NftList).items.map((item) => item.id).sort()).toEqual([
      "golden-beat-207",
      "golden-frequency-071",
      "golden-signal-160",
    ]);

    const missing = await api(page, { path: "/nfts/nao-existe" });
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({ error: { code: "NFT_NOT_FOUND" } });
  });

  test("cenário empty devolve catálogo vazio", async ({ page }) => {
    await openWithScenario(page, { scenario: "empty" });
    const result = await api(page, { path: "/nfts" });
    expect(result.body).toMatchObject({ items: [], total: 0 });
  });

  test("refresh preserva sessão, carrinho e favoritos; reset restaura o cenário", async ({
    page,
  }) => {
    await openWithScenario(page);
    const token = await login(page, "nova.sato@kurio.test");
    await api(page, {
      method: "POST",
      path: "/cart/items",
      token,
      body: { nftId: "sage-nomad-009", editionId: "1-10", quantity: 2 },
    });
    await api(page, {
      method: "POST",
      path: "/favorites",
      token,
      body: { nftId: "ivory-baron-088" },
    });

    await page.reload();
    await page.waitForFunction(() => window.__kurioMock !== undefined);

    expect((await api(page, { path: "/auth/session", token })).status).toBe(200);
    const cart = await api(page, { path: "/cart", token });
    expect(cart.body).toMatchObject({ itemCount: 3 });
    const favorites = await api(page, { path: "/favorites", token });
    expect(JSON.stringify(favorites.body)).toContain("ivory-baron-088");

    await page.goto("/?reset=1");
    await page.waitForFunction(() => window.__kurioMock !== undefined);
    expect((await api(page, { path: "/auth/session", token })).status).toBe(401);
    const fresh = await login(page, "nova.sato@kurio.test");
    expect((await api(page, { path: "/cart", token: fresh })).body).toMatchObject({ itemCount: 1 });
  });

  test("carrinho do visitante é mesclado ao entrar", async ({ page }) => {
    await openWithScenario(page);
    await api(page, {
      method: "POST",
      path: "/cart/items",
      body: { nftId: "golden-signal-160", editionId: "open", quantity: 2 },
    });
    const token = await login(page, "nova.sato@kurio.test");
    const cart = await api(page, { path: "/cart", token });
    expect(cart.body).toMatchObject({ itemCount: 3 });
    expect((await api(page, { path: "/cart" })).body).toMatchObject({ itemCount: 0 });
  });

  test("cupons válido, expirado e inválido", async ({ page }) => {
    await openWithScenario(page);
    const token = await login(page);

    const valid = await api(page, {
      method: "POST",
      path: "/cart/quote",
      token,
      body: { couponCode: "kurio10" },
    });
    expect(valid.body).toMatchObject({ subtotal: "26.83", discount: "2.683", total: "24.163" });

    const expired = await api(page, {
      method: "POST",
      path: "/cart/quote",
      token,
      body: { couponCode: "EXPIRADO2025" },
    });
    expect(expired.body).toMatchObject({ error: { code: "COUPON_EXPIRED" } });

    const invalid = await api(page, {
      method: "POST",
      path: "/cart/quote",
      token,
      body: { couponCode: "NAOEXISTE" },
    });
    expect(invalid.body).toMatchObject({
      error: { code: "COUPON_INVALID", fields: { couponCode: "Cupom inválido." } },
    });

    const none = await api(page, {
      method: "POST",
      path: "/cart/quote",
      token,
      body: { couponCode: null },
    });
    expect(none.body).toMatchObject({ subtotal: "26.83", networkFee: "0.016", total: "26.846" });
  });

  test("POST /orders é idempotente e detecta reuso da chave", async ({ page }) => {
    await openWithScenario(page, { settle: "manual" });
    const token = await login(page);
    const { body } = await prepareCheckout(page, token);
    const headers = { "Idempotency-Key": "chave-1" };

    const attempts = await Promise.all(
      Array.from({ length: 5 }, () =>
        api(page, { method: "POST", path: "/orders", token, body, headers }),
      ),
    );
    const ids = new Set(attempts.map((attempt) => (attempt.body as Order).id));
    expect(ids.size).toBe(1);
    expect(await page.evaluate(() => window.__kurioMock?.orderCount())).toBe(2);

    const conflict = await api(page, {
      method: "POST",
      path: "/orders",
      token,
      headers,
      body: { ...body, buyer: { ...buyer, note: "outro conteúdo" } },
    });
    expect(conflict.status).toBe(409);
    expect(conflict.body).toMatchObject({ error: { code: "IDEMPOTENCY_CONFLICT" } });
  });

  test("order-timeout: a retentativa com a mesma chave recupera o mesmo pedido", async ({
    page,
  }) => {
    await openWithScenario(page, { scenario: "order-timeout", settle: "manual" });
    const token = await login(page);
    const { body } = await prepareCheckout(page, token);
    const headers = { "Idempotency-Key": "chave-timeout" };

    const first = await api(page, {
      method: "POST",
      path: "/orders",
      token,
      body,
      headers,
      timeoutMs: 1000,
    });
    expect(first.status).toBe(0);

    const retry = await api(page, { method: "POST", path: "/orders", token, body, headers });
    expect(retry.status).toBe(200);
    expect((retry.body as Order).status).toBe("pending");
    expect(await page.evaluate(() => window.__kurioMock?.orderCount())).toBe(2);
  });

  test("pedido confirmado congela o recibo e remove só o que foi comprado", async ({ page }) => {
    await openWithScenario(page, { settle: "manual" });
    const token = await login(page);
    await api(page, { method: "PATCH", path: "/cart/items/item_c3", token, body: { quantity: 9 } });
    const { body } = await prepareCheckout(page, token);
    const created = await api(page, {
      method: "POST",
      path: "/orders",
      token,
      body,
      headers: { "Idempotency-Key": "k-receipt" },
    });
    const orderId = (created.body as Order).id;

    await page.evaluate((id) => window.__kurioMock?.settleOrder(id, "confirmed"), orderId);
    await page.evaluate(() => {
      window.__kurioMock?.raiseNftPrice("emerald-ape-042", 50);
    });

    const receipt = (await api(page, { path: `/orders/${orderId}`, token })).body as Order;
    expect(receipt.status).toBe("confirmed");
    expect(receipt.total).toBe("26.846");
    expect(receipt.lines[0]?.unitPrice).toBe("1.19");
    expect((await api(page, { path: "/cart", token })).body).toMatchObject({ itemCount: 0 });

    const otherUser = await login(page, "nova.sato@kurio.test");
    expect((await api(page, { path: `/orders/${orderId}`, token: otherUser })).status).toBe(404);
  });

  test("mudança no banco aparece no REST e no evento via socket.io-client", async ({ page }) => {
    await openWithScenario(page);

    const received = page.evaluate(async (modulePath) => {
      const { createRealtimeSocket } = (await import(
        /* @vite-ignore */ modulePath
      )) as SocketModule;
      const socket = await createRealtimeSocket(null);
      return new Promise<unknown[]>((resolve) => {
        const events: unknown[] = [];
        socket.on("connect", () => {
          socket.emit("subscribe", { resource: "nft", ids: ["emerald-ape-042"] });
          setTimeout(() => {
            window.__kurioMock?.raiseNftPrice("emerald-ape-042");
            window.__kurioMock?.replayLastEvent();
            window.__kurioMock?.sendStaleNftEvent("emerald-ape-042");
          }, 100);
        });
        socket.on("nft.updated", (event: unknown) => {
          events.push(event);
          if (events.length === 3) {
            socket.disconnect();
            resolve(events);
          }
        });
        socket.connect();
      });
    }, SOCKET_MODULE);

    const [update, duplicate, stale] = (await received) as {
      eventId: string;
      version: number;
      price: string;
    }[];
    expect(update).toMatchObject({ version: 2, price: "1.31" });
    expect(duplicate?.eventId).toBe(update?.eventId);
    expect(stale?.version).toBe(1);

    const rest = await api(page, { path: "/nfts/emerald-ape-042" });
    expect(rest.body).toMatchObject({ price: "1.31", version: 2 });
  });

  test("order.updated chega só para o dono do pedido", async ({ page }) => {
    await openWithScenario(page, { scenario: "payment-rejected", settleDelay: 300 });
    const owner = await login(page);
    const other = await login(page, "nova.sato@kurio.test");
    const { body } = await prepareCheckout(page, owner);

    const deliveries = page.evaluate(
      async ({ ownerToken, otherToken, modulePath }) => {
        const { createRealtimeSocket } = (await import(
          /* @vite-ignore */ modulePath
        )) as SocketModule;
        const sockets = {
          owner: await createRealtimeSocket(ownerToken),
          other: await createRealtimeSocket(otherToken),
        };
        const got: Record<string, unknown[]> = { owner: [], other: [] };
        // Resolves once the owner hears about the order, plus a grace period in
        // which the other collector must hear nothing.
        await new Promise<void>((resolve) => {
          sockets.owner.on("order.updated", (event: unknown) => {
            got.owner?.push(event);
            setTimeout(resolve, 500);
          });
          sockets.other.on("order.updated", (event: unknown) => got.other?.push(event));
          sockets.owner.connect();
          sockets.other.connect();
        });
        for (const socket of Object.values(sockets)) socket.disconnect();
        return got;
      },
      { ownerToken: owner, otherToken: other, modulePath: SOCKET_MODULE },
    );

    // The app keeps its own connection too: wait for the two collectors.
    await page.waitForFunction(() => {
      const users = window.__kurioMock?.realtimeClients().map((client) => client.userId) ?? [];
      return users.includes("user_colecionador") && users.includes("user_nova");
    });
    await api(page, {
      method: "POST",
      path: "/orders",
      token: owner,
      body,
      headers: { "Idempotency-Key": "k-owner" },
    });

    const got = await deliveries;
    expect(got.owner).toEqual([expect.objectContaining({ status: "rejected" })]);
    expect(got.other).toEqual([]);
  });

  test("price-changed e sold-out invalidam a cotação", async ({ page }) => {
    await openWithScenario(page, { scenario: "price-changed", eventDelay: 0, settle: "manual" });
    const token = await login(page);
    const { body } = await prepareCheckout(page, token);
    await expect
      .poll(
        async () =>
          ((await api(page, { path: "/nfts/emerald-ape-042" })).body as { price: string }).price,
      )
      .toBe("1.31");

    const stale = await api(page, {
      method: "POST",
      path: "/orders",
      token,
      body,
      headers: { "Idempotency-Key": "k-stale" },
    });
    expect(stale.body).toMatchObject({ error: { code: "QUOTE_STALE" } });
    const requote = await api(page, {
      method: "POST",
      path: "/cart/quote",
      token,
      body: { couponCode: null },
    });
    expect((requote.body as Quote).issues).toEqual([
      expect.objectContaining({ code: "PRICE_CHANGED" }),
    ]);

    await openWithScenario(page, { scenario: "sold-out", eventDelay: 0 });
    const soldOutToken = await login(page);
    await prepareCheckout(page, soldOutToken);
    await expect
      .poll(async () => {
        const quote = await api(page, {
          method: "POST",
          path: "/cart/quote",
          token: soldOutToken,
          body: { couponCode: null },
        });
        return (quote.body as Quote).issues.map((issue) => issue.code);
      })
      .toContain("EDITION_SOLD_OUT");
  });

  test("coupon-expired: o cupom cai na validação do checkout", async ({ page }) => {
    await openWithScenario(page, { scenario: "coupon-expired" });
    const token = await login(page);
    const first = await api(page, {
      method: "POST",
      path: "/cart/quote",
      token,
      body: { couponCode: "KURIO10" },
    });
    expect((first.body as Quote).discount).toBe("2.683");
    const second = await api(page, {
      method: "POST",
      path: "/cart/quote",
      token,
      body: { couponCode: "KURIO10" },
    });
    expect(second.body).toMatchObject({ error: { code: "COUPON_EXPIRED" } });
  });

  test("session-expired, offline, server-error e wallet-rejected", async ({ page }) => {
    await openWithScenario(page, { scenario: "session-expired" });
    const token = await login(page);
    expect((await api(page, { path: "/auth/session", token })).status).toBe(200);
    expect((await api(page, { path: "/favorites", token })).body).toMatchObject({
      error: { code: "SESSION_EXPIRED" },
    });
    expect((await api(page, { path: "/auth/session", token })).status).toBe(401);

    await openWithScenario(page, { scenario: "offline" });
    expect((await api(page, { path: "/nfts" })).status).toBe(0);

    await openWithScenario(page, { scenario: "server-error" });
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 10; attempt += 1)
      statuses.push((await api(page, { path: "/facets" })).status);
    expect(statuses).toContain(500);
    expect(statuses).toContain(200);

    await openWithScenario(page, { scenario: "wallet-rejected" });
    const walletToken = await login(page);
    const refused = await api(page, {
      method: "POST",
      path: "/wallet-connections",
      token: walletToken,
      body: { walletId: "wallet_c_primary", provider: "metamask", network: "ethereum" },
    });
    expect(refused.body).toMatchObject({ error: { code: "WALLET_REJECTED" } });
  });

  test("cadastro com conflito e senha nunca em claro no armazenamento", async ({ page }) => {
    await openWithScenario(page);
    const conflict = await api(page, {
      method: "POST",
      path: "/auth/register",
      body: { username: "outro", email: "colecionador@kurio.test", password: "segredo123" },
    });
    expect(conflict.body).toMatchObject({
      error: { code: "EMAIL_TAKEN", fields: { email: expect.any(String) } },
    });

    const created = await api(page, {
      method: "POST",
      path: "/auth/register",
      body: { username: "novo.colecionador", email: "novo@kurio.test", password: "segredo123" },
    });
    expect(created.status).toBe(201);
    const storage = await page.evaluate(() =>
      Object.keys(localStorage)
        .map((key) => localStorage.getItem(key))
        .join(" "),
    );
    expect(storage).not.toContain("segredo123");
    expect(storage).not.toContain("kurio123");
  });
});
