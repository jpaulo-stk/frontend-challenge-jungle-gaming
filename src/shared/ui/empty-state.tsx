import { cn } from "cn";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Optional call to action, e.g. a "Limpar filtros" button. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border-[1.5px] border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="text-primary [&_svg]:size-10">
          {icon}
        </span>
      )}
      <p className="text-lg leading-7 font-bold text-text">{title}</p>
      {description && <p className="max-w-md text-sm leading-6 text-text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
