import { cn } from "cn";
import { RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/shared/ui/button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
};

export function ErrorState({
  title = "Não foi possível carregar",
  message,
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border-[1.5px] border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <TriangleAlert aria-hidden="true" className="size-10 text-danger" />
      <p className="text-lg leading-7 font-bold text-text">{title}</p>
      <p className="max-w-md text-sm leading-6 text-text-muted">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          className="mt-2"
          onClick={onRetry}
          disabled={retrying}
          aria-busy={retrying}
        >
          <RotateCw aria-hidden="true" className={cn(retrying && "animate-spin")} />
          {retrying ? "Tentando novamente…" : "Tentar novamente"}
        </Button>
      )}
    </div>
  );
}
