"use client";

import type { CodeExample } from "@/types/question";
import { CodeExampleExplanation } from "@/components/code-examples/code-example-explanation";
import { CodeExamplePanelContent } from "@/components/code-examples/code-example-panel-content";
import { CodeExampleTabBar } from "@/components/code-examples/code-example-tab-bar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ConsoleLogEntry, ConsoleLogLevel } from "@/lib/code-example-console-capture";
import { XIcon } from "lucide-react";

export function CodeExampleExpandDialog({
  open,
  onOpenChange,
  example,
  activeTab,
  onTabChange,
  showConsoleTab,
  canPreview,
  isRunning,
  runCount,
  sessionId,
  consoleLogs,
  onConsoleMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  example: CodeExample;
  activeTab: string;
  onTabChange: (value: string) => void;
  showConsoleTab: boolean;
  canPreview: boolean;
  isRunning: boolean;
  runCount: number;
  sessionId: string;
  consoleLogs: ConsoleLogEntry[];
  onConsoleMessage: (level: ConsoleLogLevel, messages: string[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(92vh,900px)] max-h-[min(92vh,900px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{example.title}</DialogTitle>
          <DialogDescription>{example.file}</DialogDescription>
        </DialogHeader>

        <div className="relative flex items-center gap-3 border-b px-4 py-2.5 pr-12">
          <CodeExampleTabBar
            activeTab={activeTab}
            onTabChange={onTabChange}
            showConsoleTab={showConsoleTab}
            className="flex min-w-0 flex-1 items-center"
          />
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-2 right-2"
              />
            }
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-3">
            <CodeExamplePanelContent
              example={example}
              activeTab={activeTab}
              canPreview={canPreview}
              showConsoleTab={showConsoleTab}
              isRunning={isRunning}
              runCount={runCount}
              sessionId={sessionId}
              consoleLogs={consoleLogs}
              onConsoleMessage={onConsoleMessage}
              variant="expanded"
            />
          </div>
          {example.explanation.trim() ? (
            <div className="shrink-0 border-t px-4 py-3">
              <CodeExampleExplanation text={example.explanation} />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
