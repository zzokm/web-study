"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ConsoleLogEntry } from "@/lib/code-example-console-capture";
import { cn } from "@/lib/utils";
import { PlayIcon, TerminalIcon } from "lucide-react";

const LEVEL_STYLES: Record<ConsoleLogEntry["level"], string> = {
  log: "text-zinc-100",
  info: "text-sky-300",
  warn: "text-amber-300",
  error: "text-red-400",
  debug: "text-zinc-400",
};

export function CodeExampleConsole({
  logs,
  hasRun,
  className,
}: {
  logs: ConsoleLogEntry[];
  hasRun: boolean;
  className?: string;
}) {
  if (!hasRun) {
    return (
      <Empty
        className={cn(
          "gap-3 rounded-md border-border/60 bg-muted/15 px-6 py-10",
          className
        )}
      >
        <EmptyHeader className="gap-2.5">
          <EmptyMedia
            variant="icon"
            className="mb-0 size-11 rounded-full bg-primary/10 text-primary [&_svg]:size-5"
          >
            <TerminalIcon />
          </EmptyMedia>
          <EmptyTitle className="text-base">Console output</EmptyTitle>
          <EmptyDescription className="max-w-xs text-balance">
            Click{" "}
            <span className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-2 py-0.5 font-medium text-foreground shadow-sm">
              <PlayIcon className="size-3 shrink-0" aria-hidden />
              Run
            </span>{" "}
            first to capture console output from the example.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (logs.length === 0) {
    return (
      <Empty
        className={cn(
          "gap-3 rounded-md border-border/60 bg-muted/10 px-6 py-10",
          className
        )}
      >
        <EmptyHeader className="gap-2.5">
          <EmptyMedia
            variant="icon"
            className="mb-0 size-11 rounded-full bg-muted text-muted-foreground [&_svg]:size-5"
          >
            <TerminalIcon />
          </EmptyMedia>
          <EmptyDescription className="max-w-xs text-balance text-foreground/80">
            No console output yet. Output from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              console.log
            </code>
            , errors, and unhandled rejections will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div
      className={cn(
        "overflow-auto rounded-md border bg-zinc-950 p-3 font-mono text-xs leading-relaxed",
        className
      )}
    >
      {logs.map((entry) => (
        <div
          key={entry.id}
          className={cn("whitespace-pre-wrap break-words", LEVEL_STYLES[entry.level])}
        >
          {entry.messages.join(" ")}
        </div>
      ))}
    </div>
  );
}
