import type { Question } from "@/types/question";
import { cn } from "@/lib/utils";
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
}

/** Answer and explanation for browse / results views. */
export function QuestionAccordionDetails({
  question,
  className,
  showStem = true,
  showExamAppearances = true,
  variant = "default",
}: QuestionAccordionDetailsProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showStem ? <QuestionStem question={question} /> : null}
      {showExamAppearances ? (
        <QuestionExamAppearances
          question={question}
          variant="detailed"
          className="rounded-lg border bg-muted/30 px-4 py-3"
        />
      ) : null}
      <QuestionDetailSections question={question} variant={variant} />
    </div>
  );
}
