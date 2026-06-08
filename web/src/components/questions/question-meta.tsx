import type { Question } from "@/types/question";
import { formatLectureBadgeLabel } from "@/lib/lecture-label";
import {
  examQuestionNumberFromId,
  hasMultipleExamAppearances,
} from "@/lib/question-appearances";
import { getLectureMeta } from "@/lib/questions";
import { Badge } from "@/components/ui/badge";
import { QuestionExamAppearances } from "./question-exam-appearances";

interface QuestionMetaProps {
  question: Question;
}

export function QuestionMeta({ question }: QuestionMetaProps) {
  const multiExam = hasMultipleExamAppearances(question);
  const lectureMeta = getLectureMeta();
  const lectureIds = question.relatedTopics ?? [];
  const questionNumber = examQuestionNumberFromId(
    question.sourceQuestionId,
    question.questionText
  );

  return (
    <div className="flex w-full items-start gap-3">
      <Badge variant="outline" className="shrink-0 tabular-nums">
        Q{questionNumber}
      </Badge>
      <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5">
        {!multiExam ? (
          <Badge variant="secondary" className="tabular-nums">
            {question.origin}
          </Badge>
        ) : null}
        <Badge variant="outline">
          {question.questionType === "true_false"
            ? "T/F"
            : question.questionType === "written"
              ? "Written"
              : "MCQ"}
        </Badge>
        {question.instanceCount != null && question.instanceCount > 1 ? (
          <Badge className="tabular-nums">
            Repeated ×{question.instanceCount}
          </Badge>
        ) : null}
        {lectureIds.length > 0
          ? lectureIds.map((id) => {
              const lec = lectureMeta[id];
              if (!lec) return null;
              return (
                <Badge
                  key={id}
                  variant="outline"
                  className="max-w-full font-normal"
                >
                  {formatLectureBadgeLabel(lec)}
                </Badge>
              );
            })
          : (
            <Badge variant="outline" className="max-w-full truncate font-normal">
              {question.topic}
            </Badge>
          )}
        <QuestionExamAppearances question={question} variant="compact" />
      </div>
    </div>
  );
}
