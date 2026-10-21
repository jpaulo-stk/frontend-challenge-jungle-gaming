import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { Heart, ShoppingCart, ZoomIn } from "lucide-react";

import type { NftSummary } from "@/shared/api/contracts/nft";
import { Badge } from "@/shared/ui/badge";
import { Price } from "@/shared/ui/price";

export type NftCardData = Pick<
  NftSummary,
  "id" | "name" | "price" | "previousPrice" | "rare" | "image"
>;

type NftCardProps = {
  nft: NftCardData;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onAddToCart?: () => void;
  onZoom?: () => void;
  /** Above-the-fold cards load eagerly to help LCP. */
  priority?: boolean;
  className?: string;
};

const actionButton =
  "inline-flex size-9 items-center justify-center rounded-full bg-bg/85 text-primary-hi transition-colors outline-none hover:bg-bg focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4.5";

export function NftCard({
  nft,
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
  onZoom,
  priority = false,
  className,
}: NftCardProps) {
  const hasActions = Boolean(onToggleFavorite ?? onAddToCart ?? onZoom);

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative flex aspect-258/300 items-center justify-center overflow-hidden bg-surface max-md:rounded-xl">
        <img
          src={nft.image.src}
          srcSet={nft.image.srcSet}
          sizes="(min-width: 768px) 250px, 45vw"
          alt={nft.image.alt}
          width={250}
          height={250}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="aspect-square w-[calc(100%-8px)] rounded-[15px] object-cover"
        />
        {nft.rare && <Badge className="absolute top-4 left-0 rounded-l-none">Raro</Badge>}

        {hasActions && (
          // Always visible on touch layouts; on desktop it appears on hover and
          // whenever focus is inside the card, so keyboard users reach it too.
          <div className="absolute top-2 right-2 z-10 flex justify-center gap-3 transition-opacity md:inset-x-0 md:top-auto md:right-auto md:bottom-0 md:bg-gradient-to-t md:from-bg/80 md:to-transparent md:px-3 md:pt-8 md:pb-4 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            {onAddToCart && (
              <button
                type="button"
                className={cn(actionButton, "max-md:hidden")}
                onClick={onAddToCart}
              >
                <ShoppingCart aria-hidden="true" />
                <span className="sr-only">Adicionar {nft.name} ao carrinho</span>
              </button>
            )}
            {onToggleFavorite && (
              <button
                type="button"
                className={actionButton}
                onClick={onToggleFavorite}
                aria-pressed={isFavorite}
              >
                <Heart aria-hidden="true" className={cn(isFavorite && "fill-current")} />
                <span className="sr-only">Favoritar {nft.name}</span>
              </button>
            )}
            {onZoom && (
              <button type="button" className={cn(actionButton, "max-md:hidden")} onClick={onZoom}>
                <ZoomIn aria-hidden="true" />
                <span className="sr-only">Ampliar imagem de {nft.name}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <h3 className="mt-5 text-base leading-6 text-text">
        {/* The stretched link makes the whole card clickable; actions sit above it. */}
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {nft.name}
        </Link>
      </h3>
      <Price value={nft.price} previousValue={nft.previousPrice} />
    </article>
  );
}
