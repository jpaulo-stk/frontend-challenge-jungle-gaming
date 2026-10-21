import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { UiCatalogSection } from "@/app/dev/ui-catalog-section";
import { http } from "@/shared/api/axios";
import { nftListResponseSchema } from "@/shared/api/contracts/nft";
import { parseContract } from "@/shared/api/parse-contract";
import { nftKeys } from "@/shared/api/query-keys";
import { NftCard } from "@/shared/ui/nft-card";
import { NftCardSkeleton } from "@/shared/ui/skeleton/nft-card-skeleton";

const params = { perPage: 3 };

/** Cards fed by the (simulated) API, so the catalog holds no data of its own. */
export function UiCatalogCards() {
  const [favorites, setFavorites] = useState<ReadonlySet<string>>(new Set());
  const query = useQuery({
    queryKey: nftKeys.list(params),
    queryFn: async ({ signal }) => {
      const response = await http.get("/nfts", { params, signal });
      return parseContract(nftListResponseSchema, response.data);
    },
  });

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };

  return (
    <UiCatalogSection title="Card de NFT">
      <div className="grid w-full grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:w-auto lg:grid-cols-[repeat(3,258px)] lg:gap-x-[34px]">
        {query.data
          ? query.data.items.map((nft) => (
              <NftCard
                key={nft.id}
                nft={nft}
                isFavorite={favorites.has(nft.id)}
                onToggleFavorite={() => {
                  toggleFavorite(nft.id);
                }}
                onAddToCart={() => undefined}
                onZoom={() => undefined}
              />
            ))
          : Array.from({ length: 3 }, (_, index) => <NftCardSkeleton key={index} />)}
      </div>
    </UiCatalogSection>
  );
}
