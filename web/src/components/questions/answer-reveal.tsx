import type { Question } from "@/types/question";
import { QuestionExamAppearances } from "@/components/questions/question-exam-appearances";
import { QuestionDetailSections } from "@/components/questions/question-detail-sections";

interface AnswerRevealProps {
  question: Question;
}

export function AnswerReveal({ question }: AnswerRevealProps) {
  return (
    <div className="flex flex-col gap-6">
      <QuestionExamAppearances
        question={question}
        variant="detailed"
        className="rounded-lg border bg-muted/30 px-4 py-3"
      />
      <QuestionDetailSections question={question} />
    </div>
  );
}
