"use client";

import type { Question } from "@/types/question";
import { questionHasReferencedSlidePreview } from "@/lib/referenced-slides";
import { ReferencedSourcePanels } from "@/components/questions/referenced-source-panels";
import { cn } from "@/lib/utils";

interface PracticeReferencedSlidesProps {
  question: Question;
  className?: string;
}

/** Practice after check: always expanded, flat section under reference text. */
export function PracticeReferencedSlides({
  question,
  className,
}: PracticeReferencedSlidesProps) {
  if (!questionHasReferencedSlidePreview(question)) return null;

  return (
    <section
      className={cn(
        "flex flex-col gap-4 border-t border-border/60 pt-5",
        className
      )}
      aria-label="Referenced sources"
    >
      <h4 className="text-sm font-medium tracking-tight text-foreground">
        Referenced sources
      </h4>

      <ReferencedSourcePanels question={question} density="compact" />
    </section>
  );
}
