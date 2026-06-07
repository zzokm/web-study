"use client";

import { useState } from "react";
import type { Question } from "@/types/question";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { questionAnalyticsParams, trackEvent } from "@/lib/analytics";
import { questionHasReferencedSlidePreview } from "@/lib/referenced-slides";
import { ReferencedSourcePanels } from "@/components/questions/referenced-source-panels";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

interface BrowseReferencedSlidesProps {
  question: Question;
  className?: string;
}

/** Browse / by-lecture: bordered collapsible section, collapsed by default. */
export function BrowseReferencedSlides({
  question,
  className,
}: BrowseReferencedSlidesProps) {
  const [open, setOpen] = useState(false);

  if (!questionHasReferencedSlidePreview(question)) return null;

  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        trackEvent(
          next
            ? AnalyticsEvents.slidePreviewOpen
            : AnalyticsEvents.slidePreviewClose,
          {
            ...questionAnalyticsParams(question),
            lecture_id: question.slideRefParsed.lectureId,
          }
        );
      }}
      className={cn(
        "overflow-hidden rounded-lg border border-border/60 bg-muted/20",
        className
      )}
    >
      <CollapsibleTrigger
        className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-medium text-foreground outline-none hover:text-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-expanded={open}
      >
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
        <span>Referenced sources</span>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t border-border/60 px-3 pb-3 pt-3">
        <ReferencedSourcePanels question={question} density="compact" />
      </CollapsibleContent>
    </Collapsible>
  );
}
