import { cn } from "cn";
import { Star } from "lucide-react";

type RatingStarsProps = {
  average: number;
  count: number;
  className?: string;
};

const formatAverage = (value: number) => value.toFixed(1).replace(".", ",");

export function RatingStars({ average, count, className }: RatingStarsProps) {
  const filled = Math.floor(average);
  return (
    <p className={cn("flex items-center gap-1 text-[15px] text-text", className)}>
      <span aria-hidden="true" className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              "size-4",
              index < filled ? "fill-primary-hi text-primary-hi" : "fill-text-dim text-text-dim",
            )}
          />
        ))}
      </span>
      <span className="sr-only">Nota {formatAverage(average)} de 5, </span>
      {count} avaliações de colecionadores
    </p>
  );
}
