import { cn } from "@/lib/utils";

interface SlideChapterHeadingProps {
  topic?: string;
  pageNumber: number;
  /** Overrides default "Slide {pageNumber}" suffix. */
  pageSuffix?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function SlideChapterHeading({
  topic,
  pageNumber,
  pageSuffix,
  size = "md",
  className,
}: SlideChapterHeadingProps) {
  const chapter = topic?.trim() || "Lecture slides";
  const suffix = pageSuffix ?? `Slide ${pageNumber}`;
  const textClass =
    size === "xs" ? "text-[11px]" : size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={cn(
        "block min-w-0 truncate font-medium leading-snug text-foreground",
        textClass,
        className
      )}
    >
      {chapter}
      <span className="font-normal text-muted-foreground"> · {suffix}</span>
    </span>
  );
}
