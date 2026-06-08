"use client";

import { useCallback, useRef, useState } from "react";
import { CodeIdeRow, useShikiLines } from "@/components/code/code-ide-shared";
import { LANGUAGE_LABELS } from "@/lib/shiki-highlighter";
import { cn } from "@/lib/utils";

type CodeIdeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language?: string | null;
  disabled?: boolean;
  className?: string;
  minLines?: number;
  "aria-label"?: string;
};

export function CodeIdeEditor({
  value,
  onChange,
  language = "html",
  disabled = false,
  className,
  minLines = 12,
  "aria-label": ariaLabel = "Code editor",
}: CodeIdeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollOffset, setScrollOffset] = useState({ top: 0, left: 0 });
  const { lines, displayLines, resolvedLanguage } = useShikiLines(value, language);

  const rowCount = Math.max(displayLines.length, minLines);

  const handleScroll = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    setScrollOffset({
      top: textarea.scrollTop,
      left: textarea.scrollLeft,
    });
  }, []);

  return (
    <div
      data-compact="false"
      className={cn(
        "code-ide overflow-hidden rounded-lg border border-[#2d2d2d] bg-[#1e1e1e] shadow-sm",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3 py-1.5">
        <span className="text-[11px] font-medium tracking-wide text-[#569cd6]">
          {LANGUAGE_LABELS[resolvedLanguage]}
        </span>
        <span className="text-[10px] text-[#858585]">
          {lines.length} line{lines.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="code-ide-editor-viewport">
        <div
          aria-hidden
          className="code-ide-editor-highlight pointer-events-none"
          style={{
            transform: `translate(${-scrollOffset.left}px, ${-scrollOffset.top}px)`,
          }}
        >
          {Array.from({ length: rowCount }, (_, index) => (
            <CodeIdeRow
              key={index}
              lineNumber={index + 1}
              tokens={displayLines[index] ?? []}
            />
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={handleScroll}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          data-gramm="false"
          data-enable-grammarly="false"
          aria-label={ariaLabel}
          className={cn(
            "code-ide-editor-input",
            disabled && "cursor-not-allowed opacity-70"
          )}
        />
      </div>
    </div>
  );
}
