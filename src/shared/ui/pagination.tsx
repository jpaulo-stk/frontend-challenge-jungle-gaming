import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

const square =
  "inline-flex size-[34px] items-center justify-center rounded-sm border border-border text-base text-text transition-colors hover:border-primary disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-5";

/** Numbered pages plus previous/next arrows (34px squares, 8px apart). */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Paginação" className={cn("flex justify-end", className)}>
      <ul className="flex gap-2">
        {page > 1 && (
          <li>
            <button
              type="button"
              className={square}
              onClick={() => {
                onPageChange(page - 1);
              }}
            >
              <ChevronLeft aria-hidden="true" />
              <span className="sr-only">Página anterior</span>
            </button>
          </li>
        )}
        {pages.map((number) => (
          <li key={number}>
            <button
              type="button"
              aria-current={number === page ? "page" : undefined}
              className={cn(
                square,
                number === page &&
                  "size-[35px] border-primary bg-primary font-bold text-primary-foreground",
              )}
              onClick={() => {
                onPageChange(number);
              }}
            >
              <span className="sr-only">Página </span>
              {number}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className={square}
            disabled={page >= totalPages}
            onClick={() => {
              onPageChange(page + 1);
            }}
          >
            <ChevronRight aria-hidden="true" />
            <span className="sr-only">Próxima página</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
