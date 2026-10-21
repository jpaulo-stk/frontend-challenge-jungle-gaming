import { SlidersHorizontal } from "lucide-react";

import { CatalogFilters } from "@/features/catalog/components/catalog-filters";
import { useCatalogFilters } from "@/features/catalog/hooks/use-catalog-filters";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

/** Below `lg` the sidebar filters live in a sheet opened next to the search field. */
export function MobileFilters() {
  const { search } = useCatalogFilters();
  const activeCount =
    (search.collection?.length ?? 0) +
    (search.network?.length ?? 0) +
    (search.priceMin || search.priceMax ? 1 : 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="relative size-14 shrink-0 rounded-2xl bg-linear-to-b from-primary-alt to-primary"
        >
          <SlidersHorizontal aria-hidden="true" />
          <span className="sr-only">
            Filtros{activeCount > 0 ? `, ${String(activeCount)} ativos` : ""}
          </span>
          {activeCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 inline-flex size-5 items-center justify-center rounded-full bg-text text-[11px] text-bg"
            >
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(340px,90vw)] overflow-y-auto bg-surface">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Combine coleções, faixa de preço e rede.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8">
          <CatalogFilters />
        </div>
      </SheetContent>
    </Sheet>
  );
}
