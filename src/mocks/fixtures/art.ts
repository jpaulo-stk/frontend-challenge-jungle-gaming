import type { DbNft } from "@/mocks/db/types";
import type { Image } from "@/shared/api/contracts/common";

// The four artworks of the Figma file, served from public/nfts in 400px (cards)
// and 800px (detail) WebP versions.

const artDescriptions: Record<DbNft["art"], string> = {
  1: "macaco de óculos redondos e jaqueta college verde com corrente dourada",
  2: "gorila de chapéu bucket verde e moletom lilás",
  3: "macaco de pelo escuro com blazer bege e gola alta verde",
  4: "orangotango de fones verdes e jaqueta creme sobre fundo circular verde",
};

export function artImage(art: DbNft["art"], name: string): Image {
  const base = `/nfts/nft-0${String(art)}`;
  return {
    src: `${base}-400.webp`,
    srcSet: `${base}-400.webp 400w, ${base}-800.webp 800w`,
    alt: `${name}: ${artDescriptions[art]}`,
  };
}
