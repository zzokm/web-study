"use client";

import type { CodeExample } from "@/types/question";
import { CodeBlock } from "@/components/code/code-block";
import { CodeExampleConsole } from "@/components/code-examples/code-example-console";
import { CodeExampleIframeRunner } from "@/components/code-examples/code-example-iframe-runner";
import {
  CodeExamplePreviewEmpty,
  CodeExamplePreviewFrame,
  CodeExamplePreviewUnavailable,
} from "@/components/code-examples/code-example-preview";
import type { ConsoleLogEntry, ConsoleLogLevel } from "@/lib/code-example-console-capture";
import { cn } from "@/lib/utils";

export function CodeExamplePanelContent({
  example,
  activeTab,
  canPreview,
  showConsoleTab,
  isRunning,
  runCount,
  sessionId,
  consoleLogs,
  onConsoleMessage,
  variant = "inline",
}: {
  example: CodeExample;
  activeTab: string;
  canPreview: boolean;
  showConsoleTab: boolean;
  isRunning: boolean;
  runCount: number;
  sessionId: string;
  consoleLogs: ConsoleLogEntry[];
  onConsoleMessage: (level: ConsoleLogLevel, messages: string[]) => void;
  variant?: "inline" | "expanded";
}) {
  const isExpanded = variant === "expanded";
  const panelClass = isExpanded
    ? "flex h-full min-h-0 flex-1 flex-col"
    : "min-h-64";
  const surfaceClass = isExpanded
    ? "h-full min-h-0 flex-1"
    : "min-h-64";

  if (activeTab === "code") {
    return (
      <div className={panelClass}>
        <CodeBlock
          code={example.source}
          language={example.language}
          fillHeight={isExpanded}
          className={isExpanded ? "min-h-0 flex-1" : undefined}
        />
        {showConsoleTab && canPreview && isRunning ? (
          <OffscreenIframeRunner
            example={example}
            runCount={runCount}
            sessionId={sessionId}
            onConsoleMessage={onConsoleMessage}
          />
        ) : null}
      </div>
    );
  }

  if (activeTab === "console" && showConsoleTab) {
    return (
      <div className={cn("relative", panelClass)}>
        <CodeExampleConsole
          logs={consoleLogs}
          hasRun={isRunning}
          className={surfaceClass}
        />
        {canPreview && isRunning ? (
          <OffscreenIframeRunner
            example={example}
            runCount={runCount}
            sessionId={sessionId}
            onConsoleMessage={onConsoleMessage}
          />
        ) : null}
      </div>
    );
  }

  if (activeTab === "preview") {
    return (
      <div className={cn("relative", panelClass)}>
        {!canPreview ? (
          <CodeExamplePreviewUnavailable className={surfaceClass} />
        ) : !isRunning ? (
          <CodeExamplePreviewEmpty className={surfaceClass} />
        ) : showConsoleTab ? (
          <CodeExampleIframeRunner
            src={example.previewUrl}
            title={example.title}
            runCount={runCount}
            sessionId={sessionId}
            onConsoleMessage={onConsoleMessage}
            className={surfaceClass}
          />
        ) : (
          <CodeExamplePreviewFrame
            src={example.previewUrl}
            title={example.title}
            runCount={runCount}
            className={surfaceClass}
          />
        )}
      </div>
    );
  }

  return null;
}

function OffscreenIframeRunner({
  example,
  runCount,
  sessionId,
  onConsoleMessage,
}: {
  example: CodeExample;
  runCount: number;
  sessionId: string;
  onConsoleMessage: (level: ConsoleLogLevel, messages: string[]) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed -left-[9999px] top-0 h-96 w-full max-w-3xl opacity-0"
      aria-hidden
    >
      <CodeExampleIframeRunner
        src={example.previewUrl}
        title={example.title}
        runCount={runCount}
        sessionId={sessionId}
        onConsoleMessage={onConsoleMessage}
        className="min-h-64"
      />
    </div>
  );
}
