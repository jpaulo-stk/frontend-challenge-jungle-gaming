import { NftDetailSkeleton } from "@/shared/ui/skeleton/nft-detail-skeleton";

export function NftDetailPending() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT" className="page-container pt-6 lg:pt-21.5">
      <NftDetailSkeleton />
    </div>
  );
}
