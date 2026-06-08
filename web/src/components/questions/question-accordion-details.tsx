"use client";

import { useState } from "react";
import type { MockExamSpec } from "@/lib/mock-exam";
import type { Question } from "@/types/question";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { QuestionContextPanel } from "@/components/code/question-content";
import { QuestionExamAppearances } from "./question-exam-appearances";
import { QuestionDetailSections } from "./question-detail-sections";
import { QuestionStem } from "./question-stem";

interface QuestionAccordionDetailsProps {
  question: Question;
  className?: string;
  /** When false, skip repeating context/stem (shown in accordion trigger). */
  showStem?: boolean;
  /** When false, skip exam list (already shown in accordion trigger on browse pages). */
  showExamAppearances?: boolean;
  variant?: "default" | "browse";
  showReportButton?: boolean;
  mockExamSpec?: MockExamSpec;
  userWrittenAnswer?: string | null;
}

function ContextCodeCollapsible({ question }: { question: Question }) {
  const [open, setOpen] = useState(false);
  const ctx = question.context;
  if (!ctx?.code) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium",
          "bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
        <span>{ctx.text ? ctx.text : "Code context"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2">
          <QuestionContextPanel context={ctx} compact />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Answer and explanation for browse / results views. */
export function QuestionAccordionDetails({
  question,
  className,
  showStem = true,
  showExamAppearances = true,
  variant = "default",
  showReportButton = false,
  mockExamSpec,
  userWrittenAnswer,
}: QuestionAccordionDetailsProps) {
  const showContextCollapsible = !showStem && variant === "browse";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showStem ? <QuestionStem question={question} /> : null}
      {showContextCollapsible ? (
        <ContextCodeCollapsible question={question} />
      ) : null}
      {showExamAppearances ? (
        <QuestionExamAppearances
          question={question}
          variant="detailed"
          className="rounded-lg border bg-muted/30 px-4 py-3"
        />
      ) : null}
      <QuestionDetailSections
        question={question}
        variant={variant}
        showReportButton={showReportButton}
        mockExamSpec={mockExamSpec}
        userWrittenAnswer={userWrittenAnswer}
      />
    </div>
  );
}
