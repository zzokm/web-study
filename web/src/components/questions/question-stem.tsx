import type { Question } from "@/types/question";
import { QuestionStemContent } from "@/components/code/question-content";
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
  return (
    <QuestionStemContent
      question={question}
      variant={variant}
      className={cn(className)}
    />
  );
}
