"use client";

import { useState } from "react";
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
import { CodeExampleExplanation } from "@/components/code-examples/code-example-explanation";
import { CodeExamplePreview } from "@/components/code-examples/code-example-preview";

export function CodeExampleCard({ example }: { example: CodeExample }) {
  const [runCount, setRunCount] = useState(0);
  const [activeTab, setActiveTab] = useState("code");
  const isRunning = runCount > 0;
  const canPreview = example.previewAvailable;

  function handleRun() {
    setRunCount((count) => count + 1);
    setActiveTab("preview");
  }

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
        {canPreview ? (
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
      </CardHeader>
      <CardContent className="px-4 pt-2">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col gap-2"
        >
          <TabsList>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="code" className="mt-0 flex flex-col gap-3">
            <CodeBlock code={example.source} language={example.language} />
            <CodeExampleExplanation text={example.explanation} />
          </TabsContent>
          <TabsContent value="preview" className="mt-0">
            <CodeExamplePreview
              src={example.previewUrl}
              title={example.title}
              isRunning={isRunning}
              runCount={runCount}
              previewAvailable={canPreview}
              className="min-h-64"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
