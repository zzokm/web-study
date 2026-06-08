"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { MonitorOffIcon, MonitorPlayIcon, PlayIcon } from "lucide-react";

export function CodeExamplePreviewUnavailable({
  className,
}: {
  className?: string;
}) {
  return (
    <Empty
      className={cn(
        "gap-3 rounded-md border-border/60 bg-muted/10 px-6 py-10",
        className
      )}
    >
      <EmptyHeader className="gap-2.5">
        <EmptyMedia
          variant="icon"
          className="mb-0 size-11 rounded-full bg-muted text-muted-foreground [&_svg]:size-5"
        >
          <MonitorOffIcon />
        </EmptyMedia>
        <EmptyDescription className="max-w-xs text-balance text-foreground/80">
          Preview unavailable for this code example.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function CodeExamplePreviewFrame({
  src,
  title,
  runCount,
  className,
}: {
  src: string;
  title: string;
  runCount: number;
  className?: string;
}) {
  return (
    <iframe
      key={runCount}
      src={src}
      title={title}
      sandbox="allow-scripts allow-same-origin allow-modals"
      className={cn("h-full min-h-64 w-full rounded-md border bg-white", className)}
    />
  );
}

export function CodeExamplePreviewEmpty({ className }: { className?: string }) {
  return (
    <Empty
      className={cn(
        "gap-3 rounded-md border-border/60 bg-muted/15 px-6 py-10",
        className
      )}
    >
      <EmptyHeader className="gap-2.5">
        <EmptyMedia
          variant="icon"
          className="mb-0 size-11 rounded-full bg-primary/10 text-primary [&_svg]:size-5"
        >
          <MonitorPlayIcon />
        </EmptyMedia>
        <EmptyTitle className="text-base">Live preview</EmptyTitle>
        <EmptyDescription className="max-w-xs text-balance">
          Click{" "}
          <span className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-2 py-0.5 font-medium text-foreground shadow-sm">
            <PlayIcon className="size-3 shrink-0" aria-hidden />
            Run
          </span>{" "}
          first to load the live preview.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
