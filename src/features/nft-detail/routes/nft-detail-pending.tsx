import { NftDetailSkeleton } from "@/shared/ui/skeleton/nft-detail-skeleton";

/** Shown while the loader runs (slow network): same box model as the page. */
export function NftDetailPending() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT" className="page-container pt-6 lg:pt-[86px]">
      <NftDetailSkeleton />
    </div>
  );
}
