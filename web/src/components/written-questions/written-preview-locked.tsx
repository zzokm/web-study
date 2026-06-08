"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { CircleCheckIcon } from "lucide-react";

export function WrittenPreviewLocked({ className }: { className?: string }) {
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
          <CircleCheckIcon />
        </EmptyMedia>
        <EmptyTitle className="text-base">Check answer first</EmptyTitle>
        <EmptyDescription className="max-w-xs text-balance">
          Write your HTML in the Code tab, then click{" "}
          <span className="font-medium text-foreground">Check answer</span> to
          run your code and unlock preview and console.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
