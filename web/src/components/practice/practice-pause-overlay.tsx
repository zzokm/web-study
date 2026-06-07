"use client";

import { PauseIcon } from "lucide-react";

export function PracticePauseOverlay() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[45] flex items-center justify-center bg-background/55 backdrop-blur-md transition-[left] duration-200 ease-linear supports-[backdrop-filter]:bg-background/40 md:left-[var(--sidebar-inset-left)]"
      style={{ top: "var(--app-shell-header-height)" }}
      aria-hidden="false"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-background/90 px-8 py-6 shadow-lg">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <PauseIcon className="size-6 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold tracking-tight">Time paused</p>
        <p className="text-sm text-muted-foreground">
          Press play in the header to resume
        </p>
      </div>
    </div>
  );
}
