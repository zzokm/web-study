"use client";

import { useMemo, useState } from "react";
import type { Question } from "@/types/question";
import {
  getAttempt,
  getQuestionThinkingMs,
  isAttemptCorrect,
  type PracticeProgress,
} from "@/lib/practice-progress";
import { formatThinkingDuration, hasTimingData } from "@/lib/practice-timing";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PracticeResultsBreakdownProps {
  questions: Question[];
  progress: PracticeProgress;
}

type BreakdownRow = {
  index: number;
  question: Question;
  status: "correct" | "wrong" | "skipped";
  answerLabel: string;
  thinkingMs: number | null;
};

function statusLabel(status: BreakdownRow["status"]): string {
  if (status === "correct") return "Correct";
  if (status === "wrong") return "Incorrect";
  return "Not answered";
}

export function PracticeResultsBreakdown({
  questions,
  progress,
}: PracticeResultsBreakdownProps) {
  const [slowestFirst, setSlowestFirst] = useState(false);

  const rows = useMemo((): BreakdownRow[] => {
    return questions.map((question, index) => {
      const attempt = getAttempt(progress, question.questionKey);
      const thinkingMs = getQuestionThinkingMs(attempt);
      const answerLabel =
        question.options.find((o) => o.id === attempt.selectedId)?.content ??
        attempt.selectedId ??
        "—";

      let status: BreakdownRow["status"] = "skipped";
      if (attempt.revealed && attempt.selectedId) {
        status = isAttemptCorrect(question, attempt) ? "correct" : "wrong";
      }

      return { index, question, status, answerLabel, thinkingMs };
    });
  }, [questions, progress]);

  if (!hasTimingData(progress)) return null;

  const timedRows = rows.filter((row) => row.thinkingMs != null);
  if (timedRows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => {
    if (slowestFirst) {
      return (b.thinkingMs ?? -1) - (a.thinkingMs ?? -1);
    }
    return a.index - b.index;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Question breakdown</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSlowestFirst((v) => !v)}
        >
          {slowestFirst ? "Question order" : "Slowest first"}
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Q#</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Your answer</TableHead>
              <TableHead className="text-right">Thinking time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.question.questionKey}>
                <TableCell className="font-medium tabular-nums">
                  {row.index + 1}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      row.status === "correct" &&
                        "text-green-700 dark:text-green-400",
                      row.status === "wrong" &&
                        "text-red-700 dark:text-red-400",
                      row.status === "skipped" && "text-muted-foreground"
                    )}
                  >
                    {statusLabel(row.status)}
                  </span>
                </TableCell>
                <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                  {row.answerLabel}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {row.thinkingMs != null
                    ? formatThinkingDuration(row.thinkingMs)
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
