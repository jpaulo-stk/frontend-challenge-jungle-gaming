import { Skeleton } from "@/shared/ui/skeleton";

export function PagePending() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando página"
      className="page-container flex flex-col gap-4 py-10"
    >
      <Skeleton className="h-11 w-64" />
      <Skeleton className="h-6 w-full max-w-xl" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
