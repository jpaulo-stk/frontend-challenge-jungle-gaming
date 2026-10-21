import { cn } from "cn";

import { Skeleton } from "@/shared/ui/skeleton";

type NftCardSkeletonProps = {
  className?: string;
};

/** Same box model as `NftCard`: 258×300 art box (fluid on mobile), title and price lines. */
export function NftCardSkeleton({ className }: NftCardSkeletonProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex aspect-258/300 items-center justify-center bg-surface max-md:rounded-xl">
        <Skeleton className="aspect-square w-[calc(100%-8px)] rounded-[15px]" />
      </div>
      {/* Line boxes match the card's title (24px) and price (28px) exactly. */}
      <div className="mt-5 flex h-6 items-center">
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex h-7 items-center">
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}
