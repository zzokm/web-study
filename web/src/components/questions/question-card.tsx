"use client";

import type { Question } from "@/types/question";
import { isAnswerCorrect } from "@/lib/questions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QuestionMeta } from "./question-meta";
import { OptionContent } from "@/components/code/question-content";
import { QuestionStem } from "./question-stem";

interface QuestionCardProps {
  question: Question;
  selectedId: string | null;
  onSelect: (id: string) => void;
  revealed: boolean;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  selectedId,
  onSelect,
  revealed,
  disabled,
}: QuestionCardProps) {
  const isTf = question.questionType === "true_false";

  function radioItemClass(optionId: string) {
    const isSelected = selectedId === optionId;
    if (!isSelected) return "shrink-0";

    const indicatorDot =
      "[&_[data-slot=radio-group-indicator]_span]:size-2.5 [&_[data-slot=radio-group-indicator]_span]:bg-current";

    if (!revealed) {
      return cn(
        "shrink-0 border-black bg-background text-black dark:bg-background dark:text-black",
        "data-checked:border-black data-checked:bg-background dark:data-checked:bg-background",
        indicatorDot
      );
    }

    const isCorrect = isAnswerCorrect(optionId, question.correctAnswerId);
    if (isCorrect) {
      return cn(
        "shrink-0 border-green-600 bg-background text-green-600 dark:bg-background",
        "data-checked:border-green-600 data-checked:bg-background dark:data-checked:bg-background",
        indicatorDot
      );
    }

    return cn(
      "shrink-0 border-red-600 bg-background text-red-600 dark:bg-background",
      "data-checked:border-red-600 data-checked:bg-background dark:data-checked:bg-background",
      indicatorDot
    );
  }

  function optionClass(optionId: string) {
    const isSelected = selectedId === optionId;

    if (!revealed) {
      if (isSelected) {
        return "border-2 border-black ring-2 ring-black outline outline-2 outline-black";
      }
      return "";
    }

    const isCorrect = isAnswerCorrect(optionId, question.correctAnswerId);

    if (isCorrect) {
      return cn(
        "border-green-600 bg-green-500/15 ring-2 ring-green-600/80 dark:bg-green-500/20",
        isSelected ? "text-green-950 dark:text-green-50" : "text-green-900 dark:text-green-100"
      );
    }
    if (isSelected) {
      return "border-red-600 bg-red-500/15 ring-2 ring-red-600/80 text-red-950 dark:bg-red-500/20 dark:text-red-50";
    }
    return "opacity-50";
  }

  if (isTf) {
    return (
      <div className="flex flex-col gap-6">
        <QuestionMeta question={question} />
        <QuestionStem question={question} />
        <div className="flex flex-col gap-3 sm:flex-row">
          {question.options.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant="outline"
              size="lg"
              disabled={disabled || revealed}
              className={cn("flex-1 h-auto py-4", optionClass(opt.id))}
              onClick={() => onSelect(opt.id)}
            >
              {opt.content}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <QuestionMeta question={question} />
      <QuestionStem question={question} />
      <RadioGroup
        value={selectedId ?? ""}
        onValueChange={onSelect}
        className="flex flex-col gap-3"
        disabled={disabled || revealed}
      >
        {question.options.map((opt) => {
          const interactive = !disabled && !revealed;

          return (
            <div
              key={opt.id}
              onClick={() => {
                if (!interactive) return;
                onSelect(opt.id);
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-all duration-150",
                interactive &&
                  "cursor-pointer hover:border-muted-foreground/30 hover:bg-muted/45 hover:shadow-sm active:scale-[0.995]",
                !interactive && "cursor-default",
                optionClass(opt.id)
              )}
            >
              <RadioGroupItem
                value={opt.id}
                id={`${question.questionKey}-${opt.id}`}
                className={radioItemClass(opt.id)}
              />
              <div className="pointer-events-none grid min-w-0 flex-1 grid-cols-[auto_1fr] items-center gap-x-2 text-base leading-snug">
                <span className="font-medium uppercase text-muted-foreground">
                  {opt.id}.
                </span>
                <div className="flex min-w-0 items-center">
                  <OptionContent option={opt} compact={opt.type === "code"} />
                </div>
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
