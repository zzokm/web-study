"use client";

import { useEffect, useState } from "react";
import {
  getExamPhase,
  getMsUntilExamEnd,
  getMsUntilExamStart,
  type ExamPhase,
} from "@/lib/exam-start";
import { EXAM_END, EXAM_START } from "@/lib/site-links";
import { cn } from "@/lib/utils";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "00 : 00 : 00";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const time = `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;

  return days > 0 ? `${days}d ${time}` : time;
}

const phaseStyles: Record<
  ExamPhase,
  { container: string; label: string; timer: string; subtitle: string }
> = {
  before: {
    container: "border-sidebar-border bg-sidebar-accent/40",
    label: "text-sidebar-foreground/60",
    timer: "text-sidebar-foreground",
    subtitle: "text-sidebar-foreground/50",
  },
  during: {
    container: "border-amber-500/45 bg-amber-500/15",
    label: "text-amber-800/80 dark:text-amber-200/80",
    timer: "text-amber-950 dark:text-amber-50",
    subtitle: "text-amber-800/70 dark:text-amber-200/70",
  },
  after: {
    container: "border-emerald-500/45 bg-emerald-500/15",
    label: "text-emerald-800/80 dark:text-emerald-200/80",
    timer: "text-emerald-950 dark:text-emerald-50",
    subtitle: "text-emerald-800/70 dark:text-emerald-200/70",
  },
};

export function ExamCountdown({ className }: { className?: string }) {
  const [phase, setPhase] = useState<ExamPhase | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      const now = Date.now();
      const nextPhase = getExamPhase(now);
      setPhase(nextPhase);
      setRemainingMs(
        nextPhase === "before"
          ? getMsUntilExamStart(now)
          : nextPhase === "during"
            ? getMsUntilExamEnd(now)
            : 0
      );
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (phase === null) {
    return (
      <div
        className={cn(
          "mx-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5",
          className
        )}
        aria-hidden
      >
        <p className="text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
          Exam in
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-sidebar-foreground/35">
          -- : -- : --
        </p>
      </div>
    );
  }

  const styles = phaseStyles[phase];

  if (phase === "after") {
    return (
      <div
        className={cn(
          "mx-2 rounded-lg border px-3 py-2.5",
          styles.container,
          className
        )}
        aria-live="polite"
      >
        <p className={cn("text-sm font-semibold", styles.timer)}>
          Exam finished <span aria-hidden="true">✅</span>
        </p>
        <p className={cn("mt-1 text-[11px] leading-snug", styles.subtitle)}>
          Hope you did well!
        </p>
      </div>
    );
  }

  const label = phase === "before" ? "Exam in" : "Exam ongoing";
  const subtitle =
    phase === "before"
      ? EXAM_START.label
      : `${EXAM_START.label} · ends ${EXAM_END.label}`;
  const display =
    remainingMs === null ? "-- : -- : --" : formatDuration(remainingMs);

  return (
    <div
      className={cn("mx-2 rounded-lg border px-3 py-2.5", styles.container, className)}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[11px] font-medium uppercase tracking-wide",
            styles.label
          )}
        >
          {label}
        </span>
        <span className={cn("text-[10px]", styles.subtitle)}>{subtitle}</span>
      </div>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums tracking-tight",
          remainingMs === null ? "opacity-35" : "",
          styles.timer
        )}
      >
        {display}
      </p>
    </div>
  );
}
