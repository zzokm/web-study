"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { CodeIdeRow, useShikiLines } from "@/components/code/code-ide-shared";
import { LANGUAGE_LABELS } from "@/lib/shiki-highlighter";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  language?: string | null;
  compact?: boolean;
  showLanguage?: boolean;
  /** Stretch to parent height; short files pad with numbered empty lines below the source. */
  fillHeight?: boolean;
  className?: string;
};

function usePadLineCount(
  enabled: boolean,
  scrollRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  lineCount: number
) {
  const [padLineCount, setPadLineCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (!scroll || !content) return;

    function measure() {
      const scrollEl = scrollRef.current;
      const contentEl = contentRef.current;
      if (!scrollEl || !contentEl) return;

      const styles = getComputedStyle(scrollEl);
      const padTop = Number.parseFloat(styles.paddingTop) || 0;
      const padBottom = Number.parseFloat(styles.paddingBottom) || 0;
      const sampleRow = contentEl.querySelector(".code-ide-row");
      const lineHeight = sampleRow?.getBoundingClientRect().height ?? 20;
      const available = scrollEl.clientHeight - padTop - padBottom;
      const used = contentEl.getBoundingClientRect().height;
      const remaining = available - used;
      const extra = Math.max(0, Math.floor(remaining / lineHeight));
      setPadLineCount(extra);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    observer.observe(content);

    return () => observer.disconnect();
  }, [enabled, scrollRef, contentRef, lineCount]);

  return enabled ? padLineCount : 0;
}

export function CodeBlock({
  code,
  language,
  compact = false,
  showLanguage = true,
  fillHeight = false,
  className,
}: CodeBlockProps) {
  const { lines, displayLines, resolvedLanguage } = useShikiLines(code, language);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const padLineCount = usePadLineCount(
    fillHeight,
    scrollRef,
    contentRef,
    displayLines.length
  );

  const codeRows = (
    <>
      <div ref={contentRef}>
        {displayLines.map((rowTokens, index) => (
          <CodeIdeRow
            key={index}
            lineNumber={index + 1}
            tokens={rowTokens}
          />
        ))}
      </div>
      {fillHeight && padLineCount > 0
        ? Array.from({ length: padLineCount }, (_, index) => (
            <CodeIdeRow
              key={`pad-${index}`}
              lineNumber={displayLines.length + index + 1}
              tokens={[]}
            />
          ))
        : null}
    </>
  );

  return (
    <div
      data-compact={compact ? "true" : "false"}
      data-fill-height={fillHeight ? "true" : "false"}
      className={cn(
        "code-ide overflow-hidden rounded-lg border border-[#2d2d2d] bg-[#1e1e1e] shadow-sm",
        fillHeight && "min-h-0",
        className
      )}
    >
      {showLanguage ? (
        <div className="flex shrink-0 items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3 py-1.5">
          <span className="text-[11px] font-medium tracking-wide text-[#cccccc]">
            {LANGUAGE_LABELS[resolvedLanguage]}
          </span>
          <span className="text-[10px] text-[#858585]">
            {lines.length} line{lines.length === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}

      {fillHeight ? (
        <div className="code-ide-body">
          <div ref={scrollRef} className="code-ide-scroll">
            {codeRows}
          </div>
        </div>
      ) : (
        <div className="code-ide-scroll">{codeRows}</div>
      )}
    </div>
  );
}
