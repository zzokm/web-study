"use client";

import { useCallback, useEffect, useState } from "react";
import type { CodeExample } from "@/types/question";
import { CodeBlock } from "@/components/code/code-block";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayIcon } from "lucide-react";
import { CodeExampleConsole } from "@/components/code-examples/code-example-console";
import { CodeExampleExplanation } from "@/components/code-examples/code-example-explanation";
import { CodeExampleIframeRunner } from "@/components/code-examples/code-example-iframe-runner";
import {
  CodeExamplePreviewEmpty,
  CodeExamplePreviewFrame,
  CodeExamplePreviewUnavailable,
} from "@/components/code-examples/code-example-preview";
import { ReportIssueButton } from "@/components/report/report-issue-button";
import {
  createConsoleLogEntry,
  type ConsoleLogEntry,
  type ConsoleLogLevel,
} from "@/lib/code-example-console-capture";

export function CodeExampleCard({ example }: { example: CodeExample }) {
  const previewAutoRun = example.previewAutoRun ?? false;
  const canPreview = example.previewAvailable;
  const showConsoleTab = canPreview && (example.showConsoleTab ?? true);

  const [runCount, setRunCount] = useState(() => (previewAutoRun && canPreview ? 1 : 0));
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [activeTab, setActiveTab] = useState("code");
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

  function handleRun() {
    setConsoleLogs([]);
    setSessionId(crypto.randomUUID());
    setRunCount((count) => count + 1);
    setActiveTab("preview");
  }

  useEffect(() => {
    if (previewAutoRun && canPreview && runCount === 0) {
      setRunCount(1);
    }
  }, [previewAutoRun, canPreview, runCount]);

  return (
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
        <div className="grid grid-cols-1 gap-3">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="contents"
          >
            <TabsList className="col-start-1 row-start-1">
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              {showConsoleTab ? (
                <TabsTrigger value="console">Console</TabsTrigger>
              ) : null}
            </TabsList>
            <TabsContent
              value="code"
              className="col-start-1 row-start-2 mt-0"
            >
              <CodeBlock code={example.source} language={example.language} />
            </TabsContent>
          <TabsContent
            value="preview"
            className="col-start-1 row-start-2 mt-0 min-h-64"
          >
            {!canPreview ? (
              <CodeExamplePreviewUnavailable className="min-h-64" />
            ) : !isRunning ? (
              <CodeExamplePreviewEmpty className="min-h-64" />
            ) : showConsoleTab ? null : (
              <CodeExamplePreviewFrame
                src={example.previewUrl}
                title={example.title}
                runCount={runCount}
                className="min-h-64"
              />
            )}
          </TabsContent>
          {showConsoleTab ? (
            <TabsContent
              value="console"
              className="col-start-1 row-start-2 mt-0 min-h-64"
            >
              <CodeExampleConsole
                logs={consoleLogs}
                hasRun={isRunning}
                className="min-h-64"
              />
            </TabsContent>
          ) : null}
          </Tabs>
          {showConsoleTab && canPreview && isRunning ? (
            <div
              className={
                activeTab === "preview"
                  ? "col-start-1 row-start-2 min-h-64"
                  : "pointer-events-none fixed -left-[9999px] top-0 h-96 w-full max-w-3xl opacity-0"
              }
              aria-hidden={activeTab !== "preview"}
            >
              <CodeExampleIframeRunner
                src={example.previewUrl}
                title={example.title}
                runCount={runCount}
                sessionId={sessionId}
                onConsoleMessage={handleConsoleMessage}
                className="min-h-64"
              />
            </div>
          ) : null}
        </div>
        <CodeExampleExplanation text={example.explanation} />
      </CardContent>
    </Card>
  );
}
