import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/shared/ui/button";

const explore = buttonVariants({
  className: "mt-4 h-10 w-35 gap-1 text-base md:h-10 md:rounded-md",
});

const art = (n: number) => ({
  src: `/nfts/nft-0${String(n)}-400.webp`,
  srcSet: `/nfts/nft-0${String(n)}-400.webp 400w, /nfts/nft-0${String(n)}-800.webp 800w`,
});

export function PromoBanners() {
  return (
    <section
      aria-label="Destaques da curadoria"
      className="page-container mt-24 grid gap-7 md:grid-cols-2"
    >
      <article className="grid overflow-hidden md:grid-cols-[minmax(0,292px)_1fr] rounded-lg bg-surface md:min-h-62.5">
        <img
          {...art(1)}
          sizes="292px"
          alt="Macaco de óculos redondos e jaqueta college verde"
          width={292}
          height={250}
          loading="lazy"
          className="h-45 w-full rounded-[18px] object-cover md:h-0 md:min-h-full"
        />
        <div className="flex flex-col items-start justify-center p-5 md:items-end md:py-6 md:pr-6 md:pl-3 md:text-right">
          <h2 className="text-lg leading-6 font-bold text-text">
            Lançamentos gênesis de edição limitada
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            Colecione edições escassas diretamente dos criadores antes da revelação pública.
          </p>
          <Link to="/" search={{ tab: "new" }} hash="catalogo" className={explore}>
            Explorar <ArrowRight aria-hidden="true" className="size-4" />
            <span className="sr-only"> novos lançamentos</span>
          </Link>
        </div>
      </article>

      <article className="grid overflow-hidden md:grid-cols-[minmax(0,287px)_1fr] rounded-lg bg-surface md:min-h-62.5">
        <img
          {...art(3)}
          sizes="287px"
          alt="Macaco de pelo escuro com blazer bege e gola alta verde"
          width={287}
          height={250}
          loading="lazy"
          className="h-45 w-full rounded-[17px] object-cover md:h-0 md:min-h-full"
        />
        <div className="flex flex-col items-start justify-center p-5 md:items-end md:py-6 md:pr-6 md:pl-3 md:text-right">
          <h2 className="text-lg leading-6 font-bold text-text">
            Arte digital selecionada e muito mais
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            Explore novos artistas, coleções verificadas e obras digitais que definem a cultura da
            rede.
          </p>
          <Link
            to="/"
            search={{ collection: ["arte-digital"] }}
            hash="catalogo"
            className={explore}
          >
            Explorar <ArrowRight aria-hidden="true" className="size-4" />
            <span className="sr-only"> arte digital</span>
          </Link>
        </div>
      </article>
    </section>
  );
}
