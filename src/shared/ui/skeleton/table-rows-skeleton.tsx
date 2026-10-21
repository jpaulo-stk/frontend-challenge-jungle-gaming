import { Skeleton } from "@/shared/ui/skeleton";

type TableRowsSkeletonProps = {
  rows?: number;
};

/** Item rows of the cart and checkout summary (70px rows with a 56px thumbnail). */
export function TableRowsSkeleton({ rows = 3 }: TableRowsSkeletonProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex h-24 items-center gap-4 rounded-lg bg-surface px-3 md:h-17.5 md:bg-transparent md:px-0"
        >
          <Skeleton className="size-19 shrink-0 rounded-lg md:size-14 md:rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="hidden h-8 w-24 md:block" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}
