import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { useRef, useState } from "react";

import { relatedNftsQueryOptions } from "@/features/nft-detail/api/nft-detail-api";
import { NftCard } from "@/shared/ui/nft-card";
import { NftCardSkeleton } from "@/shared/ui/skeleton/nft-card-skeleton";
import { useNftSubscription } from "@/shared/realtime/use-realtime";

const PER_PAGE = 5;
const CARD = 219;
const GAP = 26;

type RelatedCarouselProps = {
  currentId: string;
};

export function RelatedCarousel({ currentId }: RelatedCarouselProps) {
  const related = useQuery(relatedNftsQueryOptions);
  const track = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState(0);

  const items = (related.data?.items ?? []).filter((nft) => nft.id !== currentId).slice(0, 15);
  useNftSubscription(items.map((nft) => nft.id));
  const pages = Math.ceil(items.length / PER_PAGE);

  const goTo = (target: number) => {
    setPage(target);
    track.current?.scrollTo({ left: target * PER_PAGE * (CARD + GAP) });
  };

  return (
    <section aria-labelledby="related-title" className="mt-16">
      <h2
        id="related-title"
        className="border-b border-border pb-3 text-lg font-bold text-primary-hi"
      >
        Mais desta coleção
      </h2>

      <ul
        ref={track}
        onScroll={(event) => {
          setPage(Math.round(event.currentTarget.scrollLeft / (PER_PAGE * (CARD + GAP))));
        }}
        className="mt-8 flex snap-x snap-mandatory gap-6.5 overflow-x-auto pb-2 [scrollbar-width:none] motion-safe:scroll-smooth"
      >
        {related.data
          ? items.map((nft) => (
              <li key={nft.id} className="w-54.75 shrink-0 snap-start">
                <NftCard nft={nft} />
              </li>
            ))
          : Array.from({ length: PER_PAGE }, (_, index) => (
              <li key={index} className="w-54.75 shrink-0">
                <NftCardSkeleton />
              </li>
            ))}
      </ul>

      {pages > 1 && (
        <div
          role="group"
          aria-label="Páginas do carrossel"
          className="mt-6 flex justify-center gap-1"
        >
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Mostrar página ${String(index + 1)} de ${String(pages)}`}
              aria-current={index === page}
              onClick={() => {
                goTo(index);
              }}
              className="flex size-6 items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-3 rounded-full border-[1.5px] border-primary",
                  index === page ? "bg-primary" : "bg-transparent",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
