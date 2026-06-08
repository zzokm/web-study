import type { Question } from "@/types/question";
import { QuestionExamAppearances } from "@/components/questions/question-exam-appearances";
import { QuestionDetailSections } from "@/components/questions/question-detail-sections";
import { WrittenAiReviewButton } from "@/components/written-questions/written-ai-review-button";

interface AnswerRevealProps {
  question: Question;
  userWrittenAnswer?: string | null;
  showAiReview?: boolean;
}

export function AnswerReveal({
  question,
  userWrittenAnswer,
  showAiReview = false,
}: AnswerRevealProps) {
  const trimmedAnswer = userWrittenAnswer?.trim() ?? "";

  return (
    <div className="flex flex-col gap-6">
      {showAiReview && trimmedAnswer ? (
        <WrittenAiReviewButton question={question} userAnswer={trimmedAnswer} />
      ) : null}
      <QuestionExamAppearances
        question={question}
        variant="detailed"
        className="rounded-lg border bg-muted/30 px-4 py-3"
      />
      <QuestionDetailSections
        question={question}
        userWrittenAnswer={userWrittenAnswer}
      />
    </div>
  );
}
