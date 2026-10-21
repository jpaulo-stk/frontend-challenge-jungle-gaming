import type { NftCardData } from "@/shared/ui/nft-card";

// Sample props for the development-only component catalog (/__ui). Names and
// prices are taken from the Figma home frame.
export const sampleNfts: NftCardData[] = [
  {
    id: "emerald-ape-042",
    name: "Emerald Ape #042",
    price: "1.19",
    image: {
      src: "/nfts/nft-01-400.webp",
      srcSet: "/nfts/nft-01-400.webp 400w, /nfts/nft-01-800.webp 800w",
      alt: "Macaco de óculos redondos e jaqueta college verde com corrente dourada",
    },
  },
  {
    id: "neon-vessel-552",
    name: "Neon Vessel #552",
    price: "1.99",
    previousPrice: "2.29",
    image: {
      src: "/nfts/nft-03-400.webp",
      srcSet: "/nfts/nft-03-400.webp 400w, /nfts/nft-03-800.webp 800w",
      alt: "Macaco de pelo escuro com blazer bege e gola alta verde",
    },
  },
  {
    id: "sage-nomad-009",
    name: "Sage Nomad #009",
    price: "1.69",
    rare: true,
    image: {
      src: "/nfts/nft-02-400.webp",
      srcSet: "/nfts/nft-02-400.webp 400w, /nfts/nft-02-800.webp 800w",
      alt: "Gorila de chapéu bucket verde e moletom lilás",
    },
  },
];
