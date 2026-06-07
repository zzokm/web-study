"use client";

import { PauseIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PracticePauseOverlay({ open }: { open: boolean }) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[45] flex items-center justify-center transition-all duration-300 ease-out md:left-[var(--sidebar-inset-left)] supports-[backdrop-filter]:bg-background/40",
        open
          ? "pointer-events-auto bg-background/55 opacity-100 backdrop-blur-md"
          : "pointer-events-none bg-background/0 opacity-0 backdrop-blur-none"
      )}
      style={{ top: "var(--app-shell-header-height)" }}
      aria-hidden={!open}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border bg-background/90 px-8 py-6 shadow-lg transition-all duration-300 ease-out",
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-95 opacity-0"
        )}
      >
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-full bg-muted transition-transform duration-300 ease-out",
            open && "scale-100",
            !open && "scale-90"
          )}
        >
          <PauseIcon className="size-6 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold tracking-tight">Time paused</p>
        <p className="text-sm text-muted-foreground">
          Press play on the timer to resume
        </p>
      </div>
    </div>
  );
}
