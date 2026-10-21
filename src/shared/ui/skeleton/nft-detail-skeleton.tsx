import { Skeleton } from "@/shared/ui/skeleton";

/** Gallery (4 thumbs + main art) and info column of the detail page. */
export function NftDetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[88px_minmax(0,460px)_minmax(0,1fr)]">
      <div className="hidden flex-col gap-4 lg:flex">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="size-[88px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex flex-col">
        <Skeleton className="h-11 w-2/3" />
        <Skeleton className="mt-2 h-7 w-1/4" />
        <Skeleton className="mt-6 h-6 w-1/3" />
        <Skeleton className="mt-3 h-[72px] w-full" />
        <Skeleton className="mt-6 h-6 w-1/4" />
        <div className="mt-3 flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-7 w-14 rounded-full" />
          ))}
        </div>
        <div className="mt-6 flex items-center gap-4">
          <Skeleton className="h-12 w-28 shrink-0" />
          <Skeleton className="h-14 flex-1 rounded-full md:h-11 md:max-w-32 md:rounded-md" />
          <Skeleton className="size-14 shrink-0 rounded-full md:h-11 md:w-32 md:rounded-md" />
        </div>
      </div>
    </div>
  );
}
