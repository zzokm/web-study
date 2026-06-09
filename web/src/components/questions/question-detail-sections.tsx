"use client";

import type { MockExamSpec } from "@/lib/mock-exam";
import type { Question } from "@/types/question";
import { CodeBlock } from "@/components/code/code-block";
import { OptionContent } from "@/components/code/question-content";
import { mcqOptionDisplayLabel } from "@/lib/mcq-options";
import {
  getCorrectAnswerDisplay,
  isOptionCorrect,
  isWrittenQuestion,
} from "@/lib/questions";
import { inferWrittenEditorLanguage } from "@/lib/written-question-utils";
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
  mockExamSpec?: MockExamSpec;
  /** User-submitted HTML for written questions (practice results). */
  userWrittenAnswer?: string | null;
}

function browseRevealOptionClass(
  optionId: string,
  question: Question
): string {
  if (isOptionCorrect(optionId, question)) {
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
              browseRevealOptionClass(opt.id, question)
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
      {question.options.map((opt, index) => (
        <div
          key={opt.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3",
            browseRevealOptionClass(opt.id, question)
          )}
        >
          <span className="shrink-0 text-sm font-medium uppercase tabular-nums">
            {mcqOptionDisplayLabel(index)}.
          </span>
          <div className="min-w-0 flex-1 text-sm leading-snug">
            <OptionContent option={opt} compact={opt.type === "code"} />
          </div>
        </div>
      ))}
    </div>
  );
}

function WrittenUserAnswer({ code }: { code: string }) {
  if (!code.trim()) return null;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Your answer</CardTitle>
        <CardDescription>HTML you submitted</CardDescription>
      </CardHeader>
      <CardContent>
        <CodeBlock code={code} language="html" compact className="w-full" />
      </CardContent>
    </Card>
  );
}

function WrittenModelAnswer({ question }: { question: Question }) {
  if (!question.expectedAnswer?.trim()) return null;
  const language = inferWrittenEditorLanguage(question);
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Model answer</CardTitle>
        <CardDescription>Reference solution</CardDescription>
      </CardHeader>
      <CardContent>
        <CodeBlock
          code={question.expectedAnswer}
          language={language}
          compact
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}

export function QuestionDetailSections({
  question,
  className,
  variant = "default",
  showReportButton = false,
  mockExamSpec,
  userWrittenAnswer,
}: QuestionDetailSectionsProps) {
  const isBrowse = variant === "browse";
  const isWritten = isWrittenQuestion(question);
  const answer = getCorrectAnswerDisplay(question);
  const correctOption = question.options.find(
    (o) => o.id.toLowerCase() === question.correctAnswerId.toLowerCase()
  );

  if (isWritten) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        {userWrittenAnswer ? (
          <WrittenUserAnswer code={userWrittenAnswer} />
        ) : null}
        {question.explanation ? (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Explanation</CardTitle>
              <CardDescription>What a correct solution should achieve</CardDescription>
            </CardHeader>
            <CardContent>
              <ExplanationText text={question.explanation} />
            </CardContent>
          </Card>
        ) : null}
        <WrittenModelAnswer question={question} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Card size="sm" className={cn(showReportButton && "relative")}>
        {showReportButton ? (
          <div className="absolute top-3 right-3 z-10">
            <ReportIssueButton
              question={question}
              mockExamSpec={mockExamSpec}
              corner
            />
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
