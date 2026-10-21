import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { featuredQueryOptions } from "@/features/catalog/api/catalog-api";
import { Skeleton } from "@/shared/ui/skeleton";

/** "NFT em destaque — oferta limitada" card under the sidebar filters. */
export function FeaturedNftCard() {
  const featured = useQuery(featuredQueryOptions);
  const nft = featured.data;

  return (
    <section
      aria-labelledby="featured-title"
      className="flex h-[470px] w-[310px] flex-col bg-linear-to-b from-surface-3 to-surface"
    >
      <h2 id="featured-title" className="px-5 pt-6 text-[22px] leading-7 font-bold text-primary-hi">
        NFT EM DESTAQUE
      </h2>
      <p className="mt-2 text-center text-xl leading-7 font-bold text-text">OFERTA LIMITADA</p>
      {nft ? (
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="mt-auto block rounded-[22px] focus-visible:outline-offset-[-4px]"
        >
          <img
            src={nft.image.src}
            srcSet={nft.image.srcSet}
            sizes="310px"
            alt={nft.image.alt}
            width={310}
            height={368}
            loading="lazy"
            decoding="async"
            className="h-[368px] w-[310px] rounded-[22px] object-cover"
          />
          <span className="sr-only">Ver {nft.name}</span>
        </Link>
      ) : (
        <Skeleton className="mt-auto h-[368px] w-[310px] rounded-[22px]" />
      )}
    </section>
  );
}
