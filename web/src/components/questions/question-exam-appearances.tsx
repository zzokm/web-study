import type { Question } from "@/types/question";
import {
  formatExamAppearanceLabel,
  getSortedExamAppearances,
  hasMultipleExamAppearances,
} from "@/lib/question-appearances";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuestionExamAppearancesProps {
  question: Question;
  /** compact: inline badges; detailed: labeled list (accordion body) */
  variant?: "compact" | "detailed";
  className?: string;
}

export function QuestionExamAppearances({
  question,
  variant = "compact",
  className,
}: QuestionExamAppearancesProps) {
  const appearances = getSortedExamAppearances(question);
  if (!appearances?.length) return null;

  const showSingleWrittenExam =
    question.origin === "written" && appearances.length === 1;
  if (!showSingleWrittenExam && !hasMultipleExamAppearances(question)) {
    return null;
  }

  if (variant === "detailed") {
    return (
      <div className={cn("text-sm", className)}>
        <p className="font-medium text-foreground">Appeared in</p>
        <ul className="mt-1.5 flex flex-col gap-1">
          {appearances.map((a) => (
            <li
              key={`${a.origin}:${a.sourceQuestionId}`}
              className="text-muted-foreground"
            >
              {formatExamAppearanceLabel(a)}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      {appearances.map((a) => (
        <Badge
          key={`${a.origin}:${a.sourceQuestionId}`}
          variant="secondary"
          className={cn("font-normal tabular-nums", className)}
        >
          {formatExamAppearanceLabel(a)}
        </Badge>
      ))}
    </>
  );
}
