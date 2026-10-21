import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { SearchX } from "lucide-react";
import { useState } from "react";

import { nftListQueryOptions } from "@/features/catalog/api/catalog-api";
import { useCatalogFilters } from "@/features/catalog/hooks/use-catalog-filters";
import { hasActiveFilters, toListParams } from "@/features/catalog/routes/catalog-search";
import type { NftSummary } from "@/shared/api/contracts/nft";
import { useAddToCart } from "@/shared/cart/cart-api";
import { useFavorites } from "@/shared/favorites/use-favorites";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { ImageZoomDialog } from "@/shared/ui/image-zoom-dialog";
import { NftCard } from "@/shared/ui/nft-card";
import { Pagination } from "@/shared/ui/pagination";
import { NftCardSkeleton } from "@/shared/ui/skeleton/nft-card-skeleton";
import { useNftSubscription } from "@/shared/realtime/use-realtime";

const gridClassName =
  "grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-[repeat(3,258px)] lg:gap-x-8.5 lg:gap-y-14";

/** Catalog grid with skeleton, empty, error and background-refresh states. */
export function CatalogResults() {
  const { search, clearFilters, goToPage } = useCatalogFilters();
  const params = toListParams(search);
  const list = useQuery(nftListQueryOptions(params));
  useNftSubscription(list.data?.items.map((nft) => nft.id) ?? []);
  const favorites = useFavorites();
  const addToCart = useAddToCart();
  const [zoomed, setZoomed] = useState<NftSummary | null>(null);

  const addFirstAvailable = (nft: NftSummary) => {
    const edition = nft.editions.find((candidate) => candidate.available > 0);
    if (edition)
      addToCart.mutate({ nftId: nft.id, editionId: edition.id, quantity: 1, name: nft.name });
  };

  if (list.isPending) {
    return (
      <div aria-busy="true" aria-label="Carregando NFTs" className={gridClassName}>
        {Array.from({ length: 6 }, (_, index) => (
          <NftCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (list.isError && !list.data) {
    return (
      <ErrorState
        message={list.error.message}
        onRetry={() => void list.refetch()}
        retrying={list.isFetching}
      />
    );
  }

  const { items, total, totalPages, page } = list.data;
  const refreshing = list.isPlaceholderData || (list.isFetching && !list.isPending);

  return (
    <div>
      <p role="status" className="sr-only">
        {refreshing ? "Atualizando resultados…" : `${String(total)} NFTs encontrados`}
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="Nenhum NFT encontrado"
          description="Ajuste a busca ou remova alguns filtros para ver mais resultados."
          {...(hasActiveFilters(search)
            ? {
                action: (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                ),
              }
            : {})}
        />
      ) : (
        <ul
          aria-busy={refreshing}
          className={cn(gridClassName, "transition-opacity", refreshing && "opacity-60")}
        >
          {items.map((nft, index) => (
            <li key={nft.id} className="max-md:even:translate-y-8">
              <NftCard
                nft={nft}
                priority={index < 3 && page === 1}
                isFavorite={favorites.isFavorite(nft.id)}
                onToggleFavorite={() => {
                  favorites.toggle(nft);
                }}
                {...(nft.available > 0
                  ? {
                      onAddToCart: () => {
                        addFirstAvailable(nft);
                      },
                    }
                  : {})}
                onZoom={() => {
                  setZoomed(nft);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination className="mt-16" page={page} totalPages={totalPages} onPageChange={goToPage} />

      <ImageZoomDialog
        title={zoomed?.name ?? ""}
        image={zoomed?.image ?? null}
        onClose={() => {
          setZoomed(null);
        }}
      />
    </div>
  );
}
