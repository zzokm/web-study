"use client";

import type { Question } from "@/types/question";
import { OptionContent } from "@/components/code/question-content";
import { getCorrectAnswerDisplay } from "@/lib/questions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuestionDetailSectionsProps {
  question: Question;
  className?: string;
  variant?: "default" | "browse";
}

export function QuestionDetailSections({
  question,
  className,
  variant = "default",
}: QuestionDetailSectionsProps) {
  const answer = getCorrectAnswerDisplay(question);
  const correctOption = question.options.find(
    (o) => o.id.toLowerCase() === question.correctAnswerId.toLowerCase()
  );
  const isBrowse = variant === "browse";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Card
        size="sm"
        className={cn(isBrowse && "gap-0 py-0 ring-foreground/8")}
      >
        <CardHeader
          className={cn(
            isBrowse && "gap-0 border-b border-border/60 px-4 py-3"
          )}
        >
          <CardTitle>Answer</CardTitle>
          {!isBrowse ? (
            <CardDescription>Correct response</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className={cn(isBrowse && "px-4 py-3")}>
          {correctOption?.type === "code" ? (
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
        <Card
          size="sm"
          className={cn(isBrowse && "mb-0 gap-0 py-0 ring-foreground/8")}
        >
          <CardHeader
            className={cn(
              isBrowse && "gap-0 border-b border-border/60 px-4 py-3"
            )}
          >
            <CardTitle>Explanation</CardTitle>
            {!isBrowse ? (
              <CardDescription>Why this is the correct answer</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className={cn(isBrowse && "px-4 py-3")}>
            <p className="leading-relaxed text-foreground">
              {question.explanation}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
