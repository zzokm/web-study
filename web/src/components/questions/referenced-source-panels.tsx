"use client";

import type { Question, SlideRefParsed } from "@/types/question";
import { hasReferencedSlidePreview } from "@/lib/referenced-slides";
import { questionSourceRefsParsed } from "@/lib/slide-ref";
import { SlidePanel } from "@/components/pdf/slide-panel-dynamic";
import { cn } from "@/lib/utils";

interface ReferencedSourcePanelsProps {
  question: Question;
  density?: "default" | "compact";
  className?: string;
}

function refSectionTitle(parsed: SlideRefParsed): string {
  return parsed.kind === "book" ? "Textbook" : "Slides";
}

export function ReferencedSourcePanels({
  question,
  density = "compact",
  className,
}: ReferencedSourcePanelsProps) {
  const refs = questionSourceRefsParsed(question).filter(
    hasReferencedSlidePreview
  );

  if (refs.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {refs.map((parsed) => (
        <div key={parsed.syntax} className="flex flex-col gap-3">
          {refs.length > 1 ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {refSectionTitle(parsed)}
            </p>
          ) : null}
          <SlidePanel
            slideRefParsed={parsed}
            question={question}
            density={density}
          />
        </div>
      ))}
    </div>
  );
}
