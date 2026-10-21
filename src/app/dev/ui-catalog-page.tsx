import { useState } from "react";

import { UiCatalogControls } from "@/app/dev/ui-catalog-controls";
import { UiCatalogOverlays } from "@/app/dev/ui-catalog-overlays";
import { sampleNfts } from "@/app/dev/ui-catalog-samples";
import { UiCatalogSection } from "@/app/dev/ui-catalog-section";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { NftCard } from "@/shared/ui/nft-card";
import { CartSummarySkeleton } from "@/shared/ui/skeleton/cart-summary-skeleton";
import { NftCardSkeleton } from "@/shared/ui/skeleton/nft-card-skeleton";
import { NftDetailSkeleton } from "@/shared/ui/skeleton/nft-detail-skeleton";
import { TableRowsSkeleton } from "@/shared/ui/skeleton/table-rows-skeleton";

/** Development-only catalog of the design system, for side-by-side review with Figma. */
export function UiCatalogPage() {
  const [favorites, setFavorites] = useState<ReadonlySet<string>>(new Set());

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };

  return (
    <div className="page-container py-10">
      <h1 className="text-[28px] leading-11 font-bold">Design system</h1>

      <UiCatalogControls />
      <UiCatalogOverlays />

      <UiCatalogSection title="Card de NFT">
        <div className="grid w-full grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:w-auto lg:grid-cols-[repeat(3,258px)] md:gap-x-[34px]">
          {sampleNfts.map((nft) => (
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
          ))}
        </div>
      </UiCatalogSection>

      <UiCatalogSection title="Skeletons">
        <div
          aria-busy="true"
          aria-label="Carregando NFTs"
          className="grid w-full grid-cols-2 gap-x-3 md:grid-cols-3 lg:w-auto lg:grid-cols-[repeat(3,258px)] md:gap-x-[34px]"
        >
          <NftCardSkeleton />
          <NftCardSkeleton />
          <NftCardSkeleton />
        </div>
        <div className="w-full">
          <NftDetailSkeleton />
        </div>
        <div className="w-full max-w-[782px]">
          <TableRowsSkeleton />
        </div>
        <div className="w-full max-w-[380px]">
          <CartSummarySkeleton />
        </div>
      </UiCatalogSection>

      <UiCatalogSection title="Estados">
        <EmptyState
          className="w-full max-w-md"
          title="Nenhum NFT encontrado"
          description="Ajuste a busca ou remova alguns filtros para ver mais resultados."
          action={<Button variant="outline">Limpar filtros</Button>}
        />
        <ErrorState
          className="w-full max-w-md"
          message="Sem conexão com o servidor. Verifique sua internet e tente novamente."
          onRetry={() => undefined}
        />
        <ErrorState
          className="w-full max-w-md"
          message="Tentando reconectar…"
          onRetry={() => undefined}
          retrying
        />
      </UiCatalogSection>
    </div>
  );
}
