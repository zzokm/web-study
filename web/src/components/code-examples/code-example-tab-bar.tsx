"use client";

import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CodeExampleTabBar({
  activeTab,
  onTabChange,
  showConsoleTab,
  trailing,
  className,
}: {
  activeTab: string;
  onTabChange: (value: string) => void;
  showConsoleTab: boolean;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "flex items-center justify-between gap-2"}>
      <Tabs value={activeTab} onValueChange={onTabChange} className="min-w-0">
        <TabsList>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          {showConsoleTab ? (
            <TabsTrigger value="console">Console</TabsTrigger>
          ) : null}
        </TabsList>
      </Tabs>
      {trailing ? <div className="flex shrink-0 items-center">{trailing}</div> : null}
    </div>
  );
}
