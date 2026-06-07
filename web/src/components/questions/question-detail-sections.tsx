"use client";

import type { ReactNode } from "react";
import type { Question } from "@/types/question";
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
  /** Browse vs practice referenced-slides block (passed by parent). */
  referencedSlides?: ReactNode;
}

export function QuestionDetailSections({
  question,
  className,
  referencedSlides,
}: QuestionDetailSectionsProps) {
  const answer = getCorrectAnswerDisplay(question);
  const parsed = question.slideRefParsed;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Answer</CardTitle>
          <CardDescription>Correct response</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{answer.id}</Badge>
            <span className="leading-relaxed text-foreground">{answer.label}</span>
          </div>
        </CardContent>
      </Card>

      {question.explanation ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Explanation</CardTitle>
            <CardDescription>Why this is the correct answer</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-foreground">{question.explanation}</p>
          </CardContent>
        </Card>
      ) : null}

      {question.reference ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Reference</CardTitle>
            <CardDescription>
              {parsed.topic
                ? `Source in ${parsed.topic}`
                : "Source in course materials"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="leading-relaxed text-muted-foreground">
              {question.reference}
            </p>
            {referencedSlides}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
