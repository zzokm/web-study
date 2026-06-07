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
  if (!appearances || !hasMultipleExamAppearances(question)) return null;

  if (variant === "detailed") {
    return (
      <div className={cn("text-sm", className)}>
        <p className="font-medium text-foreground">Final exam appearances</p>
        <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-muted-foreground">
          {appearances.map((a) => (
            <li key={`${a.origin}:${a.sourceQuestionId}`}>
              {formatExamAppearanceLabel(a)}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">
        Appeared on finals
      </span>
      <div className="flex flex-wrap gap-1.5">
        {appearances.map((a) => (
          <Badge
            key={`${a.origin}:${a.sourceQuestionId}`}
            variant="secondary"
            className="font-normal tabular-nums"
          >
            {formatExamAppearanceLabel(a)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
