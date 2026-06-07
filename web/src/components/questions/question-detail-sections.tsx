"use client";

import type { Question } from "@/types/question";
import { OptionContent } from "@/components/code/question-content";
import { getCorrectAnswerDisplay, isAnswerCorrect } from "@/lib/questions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExplanationText } from "@/components/questions/explanation-text";
import { ReportIssueButton } from "@/components/report/report-issue-button";
import { cn } from "@/lib/utils";

interface QuestionDetailSectionsProps {
  question: Question;
  className?: string;
  variant?: "default" | "browse";
  /** Pin report control on the answer card (browse pages). */
  showReportButton?: boolean;
}

function browseRevealOptionClass(
  optionId: string,
  correctAnswerId: string
): string {
  if (isAnswerCorrect(optionId, correctAnswerId)) {
    return cn(
      "border-green-600 bg-green-500/15 ring-2 ring-green-600/80",
      "text-green-900 dark:text-green-100"
    );
  }
  return "border-border/70 bg-background text-muted-foreground";
}

function BrowseAnswerOptions({ question }: { question: Question }) {
  const isTf = question.questionType === "true_false";

  if (isTf) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        {question.options.map((opt) => (
          <div
            key={opt.id}
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium",
              browseRevealOptionClass(opt.id, question.correctAnswerId)
            )}
          >
            {opt.content}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {question.options.map((opt) => (
        <div
          key={opt.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3",
            browseRevealOptionClass(opt.id, question.correctAnswerId)
          )}
        >
          <span className="shrink-0 text-sm font-medium uppercase tabular-nums">
            {opt.id}.
          </span>
          <div className="min-w-0 flex-1 text-sm leading-snug">
            <OptionContent option={opt} compact={opt.type === "code"} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuestionDetailSections({
  question,
  className,
  variant = "default",
  showReportButton = false,
}: QuestionDetailSectionsProps) {
  const isBrowse = variant === "browse";
  const answer = getCorrectAnswerDisplay(question);
  const correctOption = question.options.find(
    (o) => o.id.toLowerCase() === question.correctAnswerId.toLowerCase()
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Card size="sm" className={cn(showReportButton && "relative")}>
        {showReportButton ? (
          <div className="absolute top-3 right-3 z-10">
            <ReportIssueButton question={question} corner />
          </div>
        ) : null}
        <CardHeader className={showReportButton ? "pr-24" : undefined}>
          <CardTitle>Answer</CardTitle>
          <CardDescription>Correct response</CardDescription>
        </CardHeader>
        <CardContent>
          {isBrowse ? (
            <BrowseAnswerOptions question={question} />
          ) : correctOption?.type === "code" ? (
            <OptionContent option={correctOption} compact />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{answer.id}</Badge>
              <span className="leading-relaxed text-foreground">
                {answer.label}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {question.explanation ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Explanation</CardTitle>
            <CardDescription>Why this is the correct answer</CardDescription>
          </CardHeader>
          <CardContent>
            <ExplanationText text={question.explanation} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
