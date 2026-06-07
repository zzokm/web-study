import type { Question } from "@/types/question";
import { cn } from "@/lib/utils";
import { QuestionExamAppearances } from "./question-exam-appearances";
import { QuestionDetailSections } from "./question-detail-sections";
import { BrowseReferencedSlides } from "./browse-referenced-slides";
import { QuestionStem } from "./question-stem";

interface QuestionAccordionDetailsProps {
  question: Question;
  className?: string;
  /** When false, skip repeating context/stem (shown in accordion trigger). */
  showStem?: boolean;
}

/** Answer, explanation, reference, and slide preview for browse / results views. */
export function QuestionAccordionDetails({
  question,
  className,
  showStem = true,
}: QuestionAccordionDetailsProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showStem ? <QuestionStem question={question} /> : null}
      <QuestionExamAppearances
        question={question}
        variant="detailed"
        className="rounded-lg border bg-muted/30 px-4 py-3"
      />
      <QuestionDetailSections
        question={question}
        referencedSlides={<BrowseReferencedSlides question={question} />}
      />
    </div>
  );
}
