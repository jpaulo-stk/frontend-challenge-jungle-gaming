import { useLocation, useRouter } from "@tanstack/react-router";
import { cn } from "cn";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCatalogFilters } from "@/features/catalog/hooks/use-catalog-filters";

const DEBOUNCE_MS = 350;
const SEARCH_HASH = "busca";

type CatalogSearchFieldProps = {
  id: string;
  className?: string;
};

// Commits to the URL after a pause, replacing history (no back step per keystroke)
export function CatalogSearchField({ id, className }: CatalogSearchFieldProps) {
  const { search, updateFilters } = useCatalogFilters();
  const [value, setValue] = useState(search.q ?? "");
  const [syncedQuery, setSyncedQuery] = useState(search.q);
  const [ownCommit, setOwnCommit] = useState(search.q);

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
  // There are two fields (sidebar and above the hero); focus the visible one
  useEffect(() => {
    const field = input.current;
    if (hash === SEARCH_HASH && field && field.getClientRects().length > 0) field.focus();
  }, [hash]);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  // Navigating away cancels a pending search so it doesn't pull the user back
  const router = useRouter();
  useEffect(
    () =>
      router.subscribe("onBeforeNavigate", ({ toLocation }) => {
        if (toLocation.pathname !== "/") clearTimeout(timer.current);
      }),
    [router],
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
