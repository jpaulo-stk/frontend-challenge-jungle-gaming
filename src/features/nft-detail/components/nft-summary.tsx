import { Heart, Star } from "lucide-react";

import type { NftDetail } from "@/features/nft-detail/api/schemas";
import { EditionPicker } from "@/features/nft-detail/components/edition-picker";
import { ShareLinks } from "@/features/nft-detail/components/share-links";
import type { Purchase } from "@/features/nft-detail/hooks/use-purchase";
import { Button } from "@/shared/ui/button";
import { Price } from "@/shared/ui/price";
import { QuantityStepper } from "@/shared/ui/quantity-stepper";
import { RatingStars } from "@/shared/ui/rating-stars";

type NftSummaryProps = {
  nft: NftDetail;
  purchase: Purchase;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function NftSummary({ nft, purchase, isFavorite, onToggleFavorite }: NftSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl leading-9 font-bold text-text lg:text-[28px] lg:leading-11">
          {nft.name}
        </h1>
        <p className="inline-flex shrink-0 items-center gap-1 rounded-full border-[1.5px] border-primary px-2 py-0.5 text-sm text-text lg:hidden">
          <Star aria-hidden="true" className="size-4 fill-primary-hi text-primary-hi" />
          <span className="sr-only">Nota </span>
          <strong>{nft.rating.average.toFixed(1)}</strong>
          <span className="text-text-muted">
            ({nft.rating.count}
            <span className="sr-only"> avaliações</span>)
          </span>
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <Price value={nft.price} previousValue={nft.previousPrice} className="text-xl" />
        <RatingStars
          average={nft.rating.average}
          count={nft.rating.count}
          className="max-lg:hidden"
        />
      </div>

      <div>
        <h2 className="text-[15px] font-bold text-text">Sobre este NFT:</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">{nft.description}</p>
      </div>

      <EditionPicker
        editions={nft.editions}
        value={purchase.editionId}
        onChange={purchase.selectEdition}
      />

      <div className="hidden flex-wrap items-center justify-between gap-4 lg:flex">
        <div>
          <QuantityStepper
            value={purchase.quantity}
            max={purchase.available}
            onChange={purchase.setQuantity}
            disabled={purchase.available === 0}
            label={`Quantidade de ${nft.name}`}
          />
          <p className="mt-1 text-xs text-text-dim">
            {purchase.available > 0
              ? `${String(purchase.available)} disponíveis nesta edição`
              : "Nenhuma edição disponível"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-10 w-32.5 uppercase"
            disabled={!purchase.canBuy}
            onClick={purchase.buy}
          >
            {purchase.pending ? "Adicionando…" : "Comprar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 w-32.5 font-normal"
            aria-pressed={isFavorite}
            onClick={onToggleFavorite}
          >
            <Heart
              aria-hidden="true"
              className={isFavorite ? "fill-primary-hi text-primary-hi" : ""}
            />
            {isFavorite ? "Favoritado" : "Favoritar"}
          </Button>
        </div>
      </div>

      <dl className="flex flex-col gap-3 text-[15px] text-text-muted">
        <div className="flex gap-1">
          <dt>ID do token:</dt>
          <dd>{nft.tokenId}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Coleção:</dt>
          <dd>{nft.seriesName}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Atributos:</dt>
          <dd>{nft.attributes.join(", ")}</dd>
        </div>
      </dl>

      <ShareLinks name={nft.name} />
    </div>
  );
}
