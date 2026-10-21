import { getRouteApi } from "@tanstack/react-router";

import { PageShell } from "@/shared/ui/page-shell";

const routeApi = getRouteApi("/nft/$nftId");

export function NftDetailPage() {
  const { nftId } = routeApi.useParams();
  return <PageShell title={`NFT ${nftId}`} />;
}
