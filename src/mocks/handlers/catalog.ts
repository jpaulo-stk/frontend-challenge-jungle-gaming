import Big from "big.js";
import { http, HttpResponse } from "msw";

import { getConfig } from "@/mocks/config";
import { getDb } from "@/mocks/db/store";
import type { DbNft } from "@/mocks/db/types";
import { collectionName, toFacets, toNftDetail, toNftSummary } from "@/mocks/domain/serialize";
import { NEW_RELEASES_SINCE } from "@/mocks/fixtures/nfts";
import { API, apiError } from "@/mocks/handlers/http";
import { nftListParamsSchema, type NftListParams } from "@/features/catalog/api/schemas";

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Reads repeated params in both `collection[]=a` (Axios) and `collection=a` styles. */
function readList(params: URLSearchParams, name: string): string[] | undefined {
  const values = [...params.getAll(`${name}[]`), ...params.getAll(name)].filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function parseParams(url: URL): NftListParams | null {
  const params = url.searchParams;
  const raw = {
    q: params.get("q") ?? undefined,
    collection: readList(params, "collection"),
    network: readList(params, "network"),
    priceMin: params.get("priceMin") ?? undefined,
    priceMax: params.get("priceMax") ?? undefined,
    tab: params.get("tab") ?? undefined,
    sort: params.get("sort") ?? undefined,
    page: params.get("page") ?? undefined,
    perPage: params.get("perPage") ?? undefined,
  };
  const parsed = nftListParamsSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function matches(nft: DbNft, params: NftListParams): boolean {
  if (params.q) {
    const query = normalize(params.q);
    const haystack = normalize(`${nft.name} ${nft.tokenId} ${collectionName(nft.collectionSlug)}`);
    if (!haystack.includes(query)) return false;
  }
  if (params.collection && !params.collection.includes(nft.collectionSlug)) return false;
  if (params.network && !params.network.includes(nft.network)) return false;
  if (params.priceMin && new Big(nft.price).lt(params.priceMin)) return false;
  if (params.priceMax && new Big(nft.price).gt(params.priceMax)) return false;
  if (params.tab === "new" && nft.releasedAt < NEW_RELEASES_SINCE) return false;
  if (params.tab === "trending" && nft.trendingScore < 70) return false;
  return true;
}

const comparators: Record<NftListParams["sort"], (a: DbNft, b: DbNft) => number> = {
  recent: (a, b) => b.releasedAt.localeCompare(a.releasedAt),
  price_asc: (a, b) => new Big(a.price).cmp(b.price) || a.name.localeCompare(b.name),
  price_desc: (a, b) => new Big(b.price).cmp(a.price) || a.name.localeCompare(b.name),
  trending: (a, b) => b.trendingScore - a.trendingScore,
};

export const catalogHandlers = [
  http.get(`${API}/nfts`, ({ request }) => {
    const params = parseParams(new URL(request.url));
    if (!params) return apiError(422, "VALIDATION_ERROR", "Parâmetros de busca inválidos.");

    const source = getConfig().scenario === "empty" ? [] : getDb().nfts;
    const filtered = source.filter((nft) => matches(nft, params)).sort(comparators[params.sort]);
    const total = filtered.length;
    const start = (params.page - 1) * params.perPage;

    return HttpResponse.json({
      items: filtered.slice(start, start + params.perPage).map(toNftSummary),
      page: params.page,
      perPage: params.perPage,
      total,
      totalPages: Math.ceil(total / params.perPage),
    });
  }),

  http.get(`${API}/nfts/:id`, ({ params }) => {
    const nft = getDb().nfts.find((candidate) => candidate.id === params.id);
    if (!nft) return apiError(404, "NFT_NOT_FOUND", "Este NFT não existe ou foi removido.");
    return HttpResponse.json(toNftDetail(nft));
  }),

  http.get(`${API}/facets`, () => {
    const nfts = getConfig().scenario === "empty" ? [] : getDb().nfts;
    return HttpResponse.json(toFacets(nfts));
  }),
];
