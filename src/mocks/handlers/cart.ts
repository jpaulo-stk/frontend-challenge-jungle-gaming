import { http, HttpResponse } from "msw";

import { getDb, mutate } from "@/mocks/db/store";
import type { Db, OwnerKey } from "@/mocks/db/types";
import { scheduleScenarioEvent } from "@/mocks/domain/nfts";
import { createQuote } from "@/mocks/domain/quote";
import { toCart } from "@/mocks/domain/serialize";
import { API, apiError, readBody, resolveOwner } from "@/mocks/handlers/http";
import { newId } from "@/mocks/lib/ids";
import {
  addCartItemRequestSchema,
  quoteRequestSchema,
  updateCartItemRequestSchema,
} from "@/shared/api/contracts/cart";
import type { EditionId } from "@/shared/api/contracts/nft";

function bumpCart(db: Db, owner: OwnerKey): void {
  db.cartVersions[owner] = (db.cartVersions[owner] ?? 0) + 1;
}

/** Throws the right 409 when `quantity` exceeds what the edition has left. */
function assertAvailable(nftId: string, editionId: EditionId, quantity: number): string {
  const nft = getDb().nfts.find((candidate) => candidate.id === nftId);
  const edition = nft?.editions.find((candidate) => candidate.id === editionId);
  if (!nft || !edition) {
    throw apiError(404, "NFT_NOT_FOUND", "Este NFT ou edição não existe.");
  }
  if (edition.available === 0) {
    throw apiError(409, "EDITION_SOLD_OUT", `A edição ${edition.label} esgotou.`);
  }
  if (quantity > edition.available) {
    throw apiError(
      409,
      "INSUFFICIENT_AVAILABILITY",
      `Restam apenas ${String(edition.available)} unidades da edição ${edition.label}.`,
      { quantity: `Máximo de ${String(edition.available)} unidades.` },
    );
  }
  return nft.price;
}

export const cartHandlers = [
  http.get(`${API}/cart`, ({ request }) => HttpResponse.json(toCart(resolveOwner(request)))),

  http.post(`${API}/cart/items`, async ({ request }) => {
    const owner = resolveOwner(request);
    const input = await readBody(request, addCartItemRequestSchema);
    const existing = getDb().cartItems.find(
      (item) =>
        item.owner === owner && item.nftId === input.nftId && item.editionId === input.editionId,
    );
    const price = assertAvailable(
      input.nftId,
      input.editionId,
      (existing?.quantity ?? 0) + input.quantity,
    );

    mutate((db) => {
      const stored = db.cartItems.find((item) => item.id === existing?.id);
      if (stored) {
        stored.quantity += input.quantity;
      } else {
        db.cartItems.push({
          id: newId("item"),
          owner,
          nftId: input.nftId,
          editionId: input.editionId,
          quantity: input.quantity,
          addedUnitPrice: price,
          addedAt: new Date().toISOString(),
        });
      }
      bumpCart(db, owner);
    });
    return HttpResponse.json(toCart(owner), { status: 201 });
  }),

  http.patch(`${API}/cart/items/:id`, async ({ request, params }) => {
    const owner = resolveOwner(request);
    const { quantity } = await readBody(request, updateCartItemRequestSchema);
    const item = getDb().cartItems.find(
      (candidate) => candidate.id === params.id && candidate.owner === owner,
    );
    if (!item) return apiError(404, "CART_ITEM_NOT_FOUND", "Este item não está mais no carrinho.");

    const price = assertAvailable(item.nftId, item.editionId, quantity);
    mutate((db) => {
      const stored = db.cartItems.find((candidate) => candidate.id === item.id);
      if (stored) {
        stored.quantity = quantity;
        // Editing a line is the collector acknowledging the current price.
        stored.addedUnitPrice = price;
      }
      bumpCart(db, owner);
    });
    return HttpResponse.json(toCart(owner));
  }),

  http.delete(`${API}/cart/items/:id`, ({ request, params }) => {
    const owner = resolveOwner(request);
    const exists = getDb().cartItems.some((item) => item.id === params.id && item.owner === owner);
    if (!exists)
      return apiError(404, "CART_ITEM_NOT_FOUND", "Este item não está mais no carrinho.");
    mutate((db) => {
      db.cartItems = db.cartItems.filter((item) => item.id !== params.id);
      bumpCart(db, owner);
    });
    return HttpResponse.json(toCart(owner));
  }),

  http.post(`${API}/cart/quote`, async ({ request }) => {
    const owner = resolveOwner(request);
    const { couponCode } = await readBody(request, quoteRequestSchema);
    const quote = createQuote(owner, couponCode);
    scheduleScenarioEvent(owner);
    return HttpResponse.json(quote);
  }),
];
