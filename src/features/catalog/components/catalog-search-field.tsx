import { useLocation } from "@tanstack/react-router";
import { cn } from "cn";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCatalogFilters } from "@/features/catalog/hooks/use-catalog-filters";

const DEBOUNCE_MS = 350;

type CatalogSearchFieldProps = {
  id: string;
  className?: string;
};

/**
 * Live search. The term reaches the URL (and the API) once typing pauses,
 * replacing the history entry so each keystroke does not become a "back" step.
 */
export function CatalogSearchField({ id, className }: CatalogSearchFieldProps) {
  const { search, updateFilters } = useCatalogFilters();
  const [value, setValue] = useState(search.q ?? "");
  const [syncedQuery, setSyncedQuery] = useState(search.q);
  const [ownCommit, setOwnCommit] = useState(search.q);

  // The URL changed from outside (history, "Limpar filtros"): reflect it.
  if (search.q !== syncedQuery) {
    setSyncedQuery(search.q);
    if (search.q !== ownCommit) setValue(search.q ?? "");
  }

  const commit = (next: string, replace: boolean) => {
    const q = next.trim() || undefined;
    if (q === search.q) return;
    setOwnCommit(q);
    updateFilters({ q }, { replace });
  };

  const input = useRef<HTMLInputElement>(null);
  const hash = useLocation({ select: (location) => location.hash });
  // The header's search icon links to #busca: land in the field, ready to type.
  useEffect(() => {
    if (hash === id) input.current?.focus({ preventScroll: false });
  }, [hash, id]);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        commit(value, false);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Buscar NFTs
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-muted"
      />
      <input
        ref={input}
        id={id}
        type="search"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            commit(next, true);
          }, DEBOUNCE_MS);
        }}
        placeholder="Explorar coleções"
        autoComplete="off"
        className="h-14 w-full rounded-2xl border-[1.5px] border-transparent bg-surface pr-4 pl-12 text-[15px] font-bold text-text placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none lg:h-11 lg:rounded-md lg:font-normal"
      />
    </form>
  );
}
