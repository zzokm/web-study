import type { Question } from "@/types/question";
import { cn } from "@/lib/utils";

interface QuestionStemProps {
  question: Question;
  /** Truncate long stems in browse accordion rows. */
  variant?: "default" | "browse";
  className?: string;
}

export function QuestionStem({
  question,
  variant = "default",
  className,
}: QuestionStemProps) {
  const context = question.context?.trim();
  const showContext = Boolean(context);

  if (variant === "browse") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {showContext ? (
          <span className="line-clamp-4 text-sm font-normal leading-relaxed text-muted-foreground">
            {context}
          </span>
        ) : null}
        <span className="line-clamp-3 font-normal leading-relaxed text-foreground">
          {question.questionText}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showContext ? (
        <p className="border-l-2 border-black pl-4 text-base leading-relaxed text-black dark:text-foreground">
          {context}
        </p>
      ) : null}
      <p className="text-lg leading-relaxed">{question.questionText}</p>
    </div>
  );
}
