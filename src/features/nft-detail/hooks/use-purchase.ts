import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import type { NftDetail } from "@/features/nft-detail/api/schemas";
import type { EditionId } from "@/shared/api/contracts/nft";
import { useAddToCart } from "@/shared/cart/cart-api";

/**
 * Edition and quantity chosen on the detail page. The quantity is clamped to
 * what the chosen edition has left, so an impossible request is never sent;
 * the API still enforces it (and its 409 is shown) if stock moved meanwhile.
 */
export function usePurchase(nft: NftDetail) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const [editionId, setEditionId] = useState<EditionId | undefined>(() => defaultEdition(nft));
  const [requested, setRequested] = useState(1);

  const edition = nft.editions.find((candidate) => candidate.id === editionId);
  const available = edition?.available ?? 0;
  const quantity = Math.max(1, Math.min(requested, available));
  const canBuy = available > 0 && !addToCart.isPending;

  const add = (goToCart: boolean) => {
    if (!edition || quantity > available) return;
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity, name: nft.name },
      {
        onSuccess: () => {
          if (goToCart) void navigate({ to: "/carrinho" });
        },
      },
    );
  };

  return {
    editionId,
    selectEdition: (id: EditionId) => {
      setEditionId(id);
      setRequested(1);
    },
    quantity,
    setQuantity: setRequested,
    available,
    canBuy,
    pending: addToCart.isPending,
    buy: () => {
      add(true);
    },
    addToCart: () => {
      add(false);
    },
  };
}

export type Purchase = ReturnType<typeof usePurchase>;

/** Pre-selects the numbered edition with the most units left (the Figma shows 1/50). */
function defaultEdition(nft: NftDetail): EditionId | undefined {
  const available = nft.editions.filter((edition) => edition.available > 0);
  const numbered = available.filter((edition) => edition.id !== "open");
  const pool = numbered.length > 0 ? numbered : available;
  return pool.reduce<(typeof pool)[number] | undefined>(
    (best, edition) => (!best || edition.available > best.available ? edition : best),
    undefined,
  )?.id;
}
