import { CatalogFilters } from "@/features/catalog/components/catalog-filters";
import { CatalogResults } from "@/features/catalog/components/catalog-results";
import { CatalogSearchField } from "@/features/catalog/components/catalog-search-field";
import { CatalogToolbar } from "@/features/catalog/components/catalog-toolbar";
import { FeaturedNftCard } from "@/features/catalog/components/featured-nft-card";
import { HeroCarousel } from "@/features/catalog/components/hero-carousel";
import { JournalSection } from "@/features/catalog/components/journal-section";
import { MobileFilters } from "@/features/catalog/components/mobile-filters";
import { PromoBanners } from "@/features/catalog/components/promo-banners";

export function HomePage() {
  return (
    <>
      {/* The hero title changes with the slide, so the page heading is its own. */}
      <h1 className="sr-only">Início — marketplace de NFTs</h1>

      <div className="page-container mt-6 flex gap-3 lg:hidden">
        <CatalogSearchField id="busca-mobile" className="flex-1" />
        <MobileFilters />
      </div>

      <HeroCarousel />

      <section
        id="catalogo"
        aria-label="Catálogo de NFTs"
        className="page-container mt-8 scroll-mt-6 lg:mt-24 lg:grid lg:grid-cols-[310px_1fr] lg:gap-12"
      >
        <aside aria-label="Busca e filtros" className="hidden flex-col gap-6 lg:flex">
          <CatalogSearchField id="busca" />
          <div className="bg-surface px-5 py-6">
            <CatalogFilters />
          </div>
          <FeaturedNftCard />
        </aside>

        <div className="flex min-w-0 flex-col gap-6 lg:gap-7">
          <CatalogToolbar />
          <CatalogResults />
        </div>
      </section>

      <PromoBanners />
      <JournalSection />
    </>
  );
}
