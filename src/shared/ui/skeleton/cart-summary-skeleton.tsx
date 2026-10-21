import { Skeleton } from "@/shared/ui/skeleton";

export function CartSummarySkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-surface p-6">
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-11 w-full" />
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex justify-between">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-1/4" />
        </div>
      ))}
      <div className="flex justify-between border-t border-border pt-4">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/3" />
      </div>
      <Skeleton className="h-14 w-full rounded-full md:h-11 md:rounded-md" />
    </div>
  );
}
