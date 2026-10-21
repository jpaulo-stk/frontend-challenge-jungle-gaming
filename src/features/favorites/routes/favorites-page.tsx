import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { favoritesQueryOptions } from "@/shared/favorites/favorites-api";
import { buttonVariants } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { NftCard } from "@/shared/ui/nft-card";
import { PageShell } from "@/shared/ui/page-shell";
import { NftCardSkeleton } from "@/shared/ui/skeleton/nft-card-skeleton";

const gridClassName =
  "mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8.5";

/** "Lista de interesse": the collector's favorited NFTs. */
export function FavoritesPage() {
  const favorites = useQuery(favoritesQueryOptions);

  return (
    <PageShell title="Lista de interesse">
      {favorites.isPending && (
        <div aria-busy="true" aria-label="Carregando lista de interesse" className={gridClassName}>
          {Array.from({ length: 4 }, (_, index) => (
            <NftCardSkeleton key={index} />
          ))}
        </div>
      )}

      {favorites.isError && (
        <ErrorState
          className="mt-8"
          message={favorites.error.message}
          onRetry={() => void favorites.refetch()}
          retrying={favorites.isFetching}
        />
      )}

      {favorites.data?.items.length === 0 && (
        <EmptyState
          className="mt-8"
          icon={<Heart />}
          title="Sua lista de interesse está vazia"
          description="Toque no coração de um NFT para guardá-lo aqui."
          action={
            <Link to="/" hash="catalogo" className={buttonVariants({ variant: "outline" })}>
              Explorar NFTs
            </Link>
          }
        />
      )}

      {favorites.data && favorites.data.items.length > 0 && (
        <ul className={gridClassName}>
          {favorites.data.items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
