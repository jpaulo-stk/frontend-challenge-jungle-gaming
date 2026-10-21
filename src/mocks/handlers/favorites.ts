import { http, HttpResponse } from "msw";

import { getDb, mutate } from "@/mocks/db/store";
import { toNftSummary } from "@/mocks/domain/serialize";
import { API, apiError, readBody, requireUser } from "@/mocks/handlers/http";
import { addFavoriteRequestSchema } from "@/shared/api/contracts/favorites";

function favoritesOf(userId: string) {
  const db = getDb();
  return db.favorites
    .filter((favorite) => favorite.userId === userId)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map((favorite) => db.nfts.find((nft) => nft.id === favorite.nftId))
    .filter((nft) => nft !== undefined)
    .map(toNftSummary);
}

export const favoriteHandlers = [
  http.get(`${API}/favorites`, ({ request }) => {
    const { user } = requireUser(request);
    return HttpResponse.json({ items: favoritesOf(user.id) });
  }),

  http.post(`${API}/favorites`, async ({ request }) => {
    const { user } = requireUser(request);
    const { nftId } = await readBody(request, addFavoriteRequestSchema);
    if (!getDb().nfts.some((nft) => nft.id === nftId)) {
      return apiError(404, "NFT_NOT_FOUND", "Este NFT não existe ou foi removido.");
    }
    mutate((db) => {
      const exists = db.favorites.some((fav) => fav.userId === user.id && fav.nftId === nftId);
      if (!exists) db.favorites.push({ userId: user.id, nftId, addedAt: new Date().toISOString() });
    });
    return HttpResponse.json({ nftId }, { status: 201 });
  }),

  http.delete(`${API}/favorites/:nftId`, ({ request, params }) => {
    const { user } = requireUser(request);
    mutate((db) => {
      db.favorites = db.favorites.filter(
        (fav) => !(fav.userId === user.id && fav.nftId === params.nftId),
      );
    });
    return new HttpResponse(null, { status: 204 });
  }),
];
