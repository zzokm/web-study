"use client";

import { useCallback, useState } from "react";
import type { CodeExample } from "@/types/question";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeExampleExpandDialog } from "@/components/code-examples/code-example-expand-dialog";
import { CodeExampleExplanation } from "@/components/code-examples/code-example-explanation";
import { CodeExamplePanelContent } from "@/components/code-examples/code-example-panel-content";
import { CodeExampleTabBar } from "@/components/code-examples/code-example-tab-bar";
import { ReportIssueButton } from "@/components/report/report-issue-button";
import {
  createConsoleLogEntry,
  type ConsoleLogEntry,
  type ConsoleLogLevel,
} from "@/lib/code-example-console-capture";
import { Maximize2Icon, PlayIcon } from "lucide-react";

export function CodeExampleCard({ example }: { example: CodeExample }) {
  const previewAutoRun = example.previewAutoRun ?? false;
  const canPreview = example.previewAvailable;
  const showConsoleTab = canPreview && (example.showConsoleTab ?? true);

  const [runCount, setRunCount] = useState(() => (previewAutoRun && canPreview ? 1 : 0));
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [activeTab, setActiveTab] = useState("code");
  const [expanded, setExpanded] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);
  const isRunning = runCount > 0;

  const handleConsoleMessage = useCallback(
    (level: ConsoleLogLevel, messages: string[]) => {
      setConsoleLogs((previous) => [
        ...previous,
        createConsoleLogEntry(level, messages, previous.length),
      ]);
    },
    []
  );

  const panelProps = {
    example,
    activeTab,
    canPreview,
    showConsoleTab,
    isRunning,
    runCount,
    sessionId,
    consoleLogs,
    onConsoleMessage: handleConsoleMessage,
  };

  function handleRun() {
    setConsoleLogs([]);
    setSessionId(crypto.randomUUID());
    setRunCount((count) => count + 1);
    setActiveTab("preview");
  }

  return (
    <>
      <Card className="gap-2 py-3">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-4 pb-0">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-medium leading-snug">
              {example.title}
            </CardTitle>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {example.file}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ReportIssueButton
              codeExample={{
                id: example.id,
                file: example.file,
                title: example.title,
                lectureId: example.lectureId,
              }}
              pageUrl={`/code-examples/${example.lectureId}/`}
              size="icon"
            />
            {canPreview && !previewAutoRun ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1.5"
                onClick={handleRun}
              >
                <PlayIcon className="size-3.5" />
                {isRunning ? "Run again" : "Run"}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-4 pt-2">
          <div className="flex flex-col gap-3">
            <CodeExampleTabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              showConsoleTab={showConsoleTab}
              trailing={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setExpanded(true)}
                  aria-label="Expand code example"
                >
                  <Maximize2Icon className="size-4" />
                </Button>
              }
            />
            {expanded ? (
              <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/15 px-4 py-10 text-center text-sm text-muted-foreground">
                Viewing in expanded mode
              </div>
            ) : (
              <CodeExamplePanelContent {...panelProps} variant="inline" />
            )}
          </div>
          <CodeExampleExplanation text={example.explanation} />
        </CardContent>
      </Card>

      <CodeExampleExpandDialog
        open={expanded}
        onOpenChange={setExpanded}
        onTabChange={setActiveTab}
        {...panelProps}
      />
    </>
  );
}
