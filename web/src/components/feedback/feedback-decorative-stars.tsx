import { StarIcon } from "lucide-react";

export function FeedbackDecorativeStars() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <StarIcon
        className="absolute -top-6 -right-4 size-28 fill-current text-amber-400/20"
        strokeWidth={1}
      />
      <StarIcon
        className="absolute top-8 left-3 size-14 fill-current text-amber-300/25"
        strokeWidth={1}
      />
    </div>
  );
}
