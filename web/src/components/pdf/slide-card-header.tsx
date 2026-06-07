"use client";

import { Button } from "@/components/ui/button";
import { SlideChapterHeading } from "./slide-chapter-heading";
import { cn } from "@/lib/utils";
import { Maximize2Icon } from "lucide-react";

interface SlideCardHeaderProps {
  topic: string;
  pageNum: number;
  pageSuffix?: string;
  compact?: boolean;
  onFullscreen: () => void;
}

export function SlideCardHeader({
  topic,
  pageNum,
  pageSuffix,
  compact = false,
  onFullscreen,
}: SlideCardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b bg-muted/50",
        compact ? "min-h-9 px-2.5" : "min-h-10 px-3"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center self-stretch py-1">
        <SlideChapterHeading
          topic={topic}
          pageNumber={pageNum}
          pageSuffix={pageSuffix}
          size={compact ? "xs" : "sm"}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7 shrink-0 hover:bg-zinc-300/90 dark:hover:bg-zinc-600/80"
        aria-label={`Open slide ${pageNum} in full viewer`}
        title="Full screen"
        onClick={onFullscreen}
      >
        <Maximize2Icon className="size-3.5" />
      </Button>
    </div>
  );
}
