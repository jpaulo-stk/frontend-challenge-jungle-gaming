import { useQuery } from "@tanstack/react-query";
import { getRouteApi, Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Heart } from "lucide-react";

import { nftDetailQueryOptions } from "@/features/nft-detail/api/nft-detail-api";
import type { NftDetail } from "@/features/nft-detail/api/schemas";
import { MobileActionBar } from "@/features/nft-detail/components/mobile-action-bar";
import { NftGallery } from "@/features/nft-detail/components/nft-gallery";
import { NftInfoTabs } from "@/features/nft-detail/components/nft-info-tabs";
import { NftSummary } from "@/features/nft-detail/components/nft-summary";
import { RelatedCarousel } from "@/features/nft-detail/components/related-carousel";
import { usePurchase } from "@/features/nft-detail/hooks/use-purchase";
import { useFavorites } from "@/shared/favorites/use-favorites";
import { ErrorState } from "@/shared/ui/error-state";
import { NftDetailSkeleton } from "@/shared/ui/skeleton/nft-detail-skeleton";

const routeApi = getRouteApi("/nft/$nftId");

const overlayButton =
  "absolute top-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-surface-2/90 text-text lg:hidden [&_svg]:size-5";

export function NftDetailPage() {
  const { nftId } = routeApi.useParams();
  const detail = useQuery(nftDetailQueryOptions(nftId));

  return (
    <div className="page-container pt-6 pb-50 lg:pt-10 lg:pb-0">
      <nav
        aria-label="Trilha de navegação"
        className="hidden text-[15px] font-bold text-text lg:block"
      >
        <Link to="/" className="hover:text-primary-hi">
          Início
        </Link>{" "}
        /{" "}
        <Link to="/" hash="catalogo" className="hover:text-primary-hi">
          Mercado
        </Link>
      </nav>

      {detail.isPending && (
        <div aria-busy="true" aria-label="Carregando NFT" className="mt-4">
          <NftDetailSkeleton />
        </div>
      )}

      {detail.isError && (
        <ErrorState
          className="mt-6"
          message={detail.error.message}
          onRetry={() => void detail.refetch()}
          retrying={detail.isFetching}
        />
      )}

      {detail.data && <NftDetailContent key={detail.data.id} nft={detail.data} />}
    </div>
  );
}

function NftDetailContent({ nft }: { nft: NftDetail }) {
  const router = useRouter();
  const purchase = usePurchase(nft);
  const favorites = useFavorites();
  const isFavorite = favorites.isFavorite(nft.id);
  const toggleFavorite = () => {
    favorites.toggle(nft);
  };

  return (
    <>
      <div className="mt-4 grid gap-8 lg:grid-cols-[572px_1fr] lg:gap-8.25">
        <div className="relative">
          <button
            type="button"
            className={`${overlayButton} left-4`}
            onClick={() => {
              if (router.history.canGoBack()) router.history.back();
              else void router.navigate({ to: "/" });
            }}
          >
            <ChevronLeft aria-hidden="true" />
            <span className="sr-only">Voltar</span>
          </button>
          <button
            type="button"
            className={`${overlayButton} right-4`}
            aria-pressed={isFavorite}
            onClick={toggleFavorite}
          >
            <Heart
              aria-hidden="true"
              className={isFavorite ? "fill-primary-hi text-primary-hi" : ""}
            />
            <span className="sr-only">Favoritar {nft.name}</span>
          </button>
          <NftGallery name={nft.name} gallery={nft.gallery} />
        </div>
        <NftSummary
          nft={nft}
          purchase={purchase}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      <section aria-label="Informações detalhadas" className="mt-16">
        <NftInfoTabs nft={nft} />
      </section>

      <RelatedCarousel currentId={nft.id} />

      <MobileActionBar name={nft.name} price={nft.price} purchase={purchase} />
    </>
  );
}
