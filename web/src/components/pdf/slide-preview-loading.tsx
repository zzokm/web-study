import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface SlidePreviewLoadingProps {
  compact?: boolean;
  className?: string;
}

/** Fixed-size placeholder — no pulse or layout growth while PDF loads. */
export function SlidePreviewLoading({
  compact = false,
  className,
}: SlidePreviewLoadingProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center rounded-lg border border-border/50 bg-muted/25",
        compact ? "h-[220px]" : "h-[260px]",
        className
      )}
      role="status"
      aria-label="Loading slide preview"
    >
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  );
}
