"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { CodeExampleConsole } from "@/components/code-examples/code-example-console";
import { CodeExampleTabBar } from "@/components/code-examples/code-example-tab-bar";
import {
  createConsoleLogEntry,
  type ConsoleLogEntry,
  type ConsoleLogLevel,
} from "@/lib/code-example-console-capture";
import { wrapHtmlIfNeeded } from "@/lib/written-html";
import { WrittenHtmlEditor } from "@/components/written-questions/written-html-editor";
import { WrittenHtmlRunner } from "@/components/written-questions/written-html-runner";
import { WrittenPreviewLocked } from "@/components/written-questions/written-preview-locked";
import { cn } from "@/lib/utils";

export type WrittenQuestionPanelHandle = {
  showPreview: () => void;
};

export const WrittenQuestionPanel = forwardRef<
  WrittenQuestionPanelHandle,
  {
    value: string;
    onChange: (value: string) => void;
    hasChecked: boolean;
    runCount: number;
    disabled?: boolean;
    title?: string;
    className?: string;
    editorLanguage?: string;
    showPreviewTabs?: boolean;
  }
>(function WrittenQuestionPanel(
  {
    value,
    onChange,
    hasChecked,
    runCount,
    disabled = false,
    title = "Written answer",
    className,
    editorLanguage = "html",
    showPreviewTabs = true,
  },
  ref
) {
  const [activeTab, setActiveTab] = useState("code");
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);

  const isRunning = hasChecked && runCount > 0;
  const sessionId = useMemo(
    () => (runCount > 0 ? crypto.randomUUID() : "pending"),
    [runCount]
  );
  const preparedHtml = useMemo(() => wrapHtmlIfNeeded(value), [value]);

  const handleConsoleMessage = useCallback(
    (level: ConsoleLogLevel, messages: string[]) => {
      setConsoleLogs((previous) => [
        ...previous,
        createConsoleLogEntry(level, messages, previous.length),
      ]);
    },
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      showPreview() {
        setConsoleLogs([]);
        setActiveTab("preview");
      },
    }),
    []
  );

  const panelClass = "min-h-64";

  if (!showPreviewTabs) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <WrittenHtmlEditor
          value={value}
          onChange={onChange}
          disabled={disabled}
          language={editorLanguage}
          className={panelClass}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <CodeExampleTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showConsoleTab={true}
      />
      <div className={panelClass}>
        {activeTab === "code" ? (
          <div className="flex flex-col gap-2">
            <WrittenHtmlEditor
              value={value}
              onChange={onChange}
              disabled={disabled}
              language={editorLanguage}
            />
            {isRunning ? (
              <div
                className="pointer-events-none fixed -left-[9999px] top-0 h-96 w-full max-w-3xl opacity-0"
                aria-hidden
              >
                <WrittenHtmlRunner
                  html={preparedHtml}
                  title={title}
                  runCount={runCount}
                  sessionId={sessionId}
                  onConsoleMessage={handleConsoleMessage}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "preview" ? (
          <div className={cn("relative", panelClass)}>
            {!hasChecked || !isRunning ? (
              <WrittenPreviewLocked className="min-h-64" />
            ) : (
              <WrittenHtmlRunner
                html={preparedHtml}
                title={title}
                runCount={runCount}
                sessionId={sessionId}
                onConsoleMessage={handleConsoleMessage}
                className="min-h-64"
              />
            )}
          </div>
        ) : null}

        {activeTab === "console" ? (
          <div className={cn("relative", panelClass)}>
            {!hasChecked || !isRunning ? (
              <WrittenPreviewLocked className="min-h-64" />
            ) : (
              <>
                <CodeExampleConsole
                  logs={consoleLogs}
                  hasRun={isRunning}
                  className="min-h-64"
                />
                <div
                  className="pointer-events-none fixed -left-[9999px] top-0 h-96 w-full max-w-3xl opacity-0"
                  aria-hidden
                >
                  <WrittenHtmlRunner
                    html={preparedHtml}
                    title={title}
                    runCount={runCount}
                    sessionId={sessionId}
                    onConsoleMessage={handleConsoleMessage}
                  />
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
});
