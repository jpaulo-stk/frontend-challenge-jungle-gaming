import { cn } from "cn";
import { CircleAlert } from "lucide-react";

type InlineErrorProps = {
  /** Referenced by the field's `aria-describedby`. */
  id: string;
  message: string | undefined;
  className?: string;
};

/** Field-level error. Renders nothing when there is no message. */
export function InlineError({ id, message, className }: InlineErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      className={cn("mt-1.5 flex items-start gap-1.5 text-[13px] leading-5 text-danger", className)}
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
