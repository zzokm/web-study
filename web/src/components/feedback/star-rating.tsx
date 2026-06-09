"use client";

import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedbackStarRating } from "@/lib/feedback-form";

type StarRatingProps = {
  value: FeedbackStarRating | null;
  onChange: (value: FeedbackStarRating) => void;
  label: string;
  size?: "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  md: "size-8",
  lg: "size-10",
} as const;

export function StarRating({
  value,
  onChange,
  label,
  size = "md",
  className,
}: StarRatingProps) {
  const starSize = SIZE_CLASSES[size];

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="radiogroup"
      aria-label={label}
    >
      {([1, 2, 3, 4, 5] as const).map((rating) => {
        const filled = value != null && rating <= value;
        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} out of 5 stars`}
            className={cn(
              "rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filled ? "text-amber-400" : "text-muted-foreground/35 hover:text-amber-300"
            )}
            onClick={() => onChange(rating)}
          >
            <StarIcon
              className={cn(starSize, filled && "fill-current")}
              strokeWidth={filled ? 1.5 : 2}
            />
          </button>
        );
      })}
    </div>
  );
}
