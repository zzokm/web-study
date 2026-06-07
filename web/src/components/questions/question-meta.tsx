import type { Question } from "@/types/question";
import { formatLectureBadgeLabel } from "@/lib/lecture-label";
import { hasMultipleExamAppearances } from "@/lib/question-appearances";
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
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {!multiExam ? (
          <Badge variant="secondary" className="tabular-nums">
            {question.origin}
          </Badge>
        ) : null}
        <Badge variant="outline">
          {question.questionType === "true_false" ? "T/F" : "MCQ"}
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
      </div>
      <QuestionExamAppearances question={question} variant="compact" />
    </div>
  );
}
