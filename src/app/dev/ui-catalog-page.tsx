import { UiCatalogCards } from "@/app/dev/ui-catalog-cards";
import { UiCatalogControls } from "@/app/dev/ui-catalog-controls";
import { UiCatalogOverlays } from "@/app/dev/ui-catalog-overlays";
import { UiCatalogSection } from "@/app/dev/ui-catalog-section";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { CartSummarySkeleton } from "@/shared/ui/skeleton/cart-summary-skeleton";
import { NftCardSkeleton } from "@/shared/ui/skeleton/nft-card-skeleton";
import { NftDetailSkeleton } from "@/shared/ui/skeleton/nft-detail-skeleton";
import { TableRowsSkeleton } from "@/shared/ui/skeleton/table-rows-skeleton";

/** Development-only catalog of the design system, for side-by-side review with Figma. */
export function UiCatalogPage() {
  return (
    <div className="page-container py-10">
      <h1 className="text-[28px] leading-11 font-bold">Design system</h1>

      <UiCatalogControls />
      <UiCatalogOverlays />

      <UiCatalogCards />

      <UiCatalogSection title="Skeletons">
        <div
          aria-busy="true"
          aria-label="Carregando NFTs"
          className="grid w-full grid-cols-2 gap-x-3 md:grid-cols-3 lg:w-auto lg:grid-cols-[repeat(3,258px)] md:gap-x-8.5"
        >
          <NftCardSkeleton />
          <NftCardSkeleton />
          <NftCardSkeleton />
        </div>
        <div className="w-full">
          <NftDetailSkeleton />
        </div>
        <div className="w-full max-w-195.5">
          <TableRowsSkeleton />
        </div>
        <div className="w-full max-w-95">
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
