import type { Question } from "@/types/question";
import { hasMultipleExamAppearances } from "@/lib/question-appearances";
import { Badge } from "@/components/ui/badge";
import { QuestionExamAppearances } from "./question-exam-appearances";

export function QuestionMeta({ question }: { question: Question }) {
  const multiExam = hasMultipleExamAppearances(question);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {!multiExam ? <Badge variant="secondary">{question.origin}</Badge> : null}
        <Badge variant="outline">
          {question.questionType === "true_false" ? "T/F" : "MCQ"}
        </Badge>
        {question.instanceCount != null && question.instanceCount > 1 ? (
          <Badge>Repeated ×{question.instanceCount}</Badge>
        ) : null}
        <Badge variant="outline" className="max-w-full truncate font-normal">
          {question.topic}
        </Badge>
      </div>
      <QuestionExamAppearances question={question} variant="compact" />
    </div>
  );
}
