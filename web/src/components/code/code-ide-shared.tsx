"use client";

import { useEffect, useMemo, useState } from "react";
import type { ThemedToken } from "shiki";
import {
  normalizeCodeIndentation,
  resolveHighlightLanguage,
  type SupportedCodeLanguage,
} from "@/lib/parse-question-content";
import {
  loadHighlighter,
  tokensToDisplayLines,
  type DisplayToken,
} from "@/lib/shiki-highlighter";

export function TokenLine({ tokens }: { tokens: DisplayToken[] }) {
  if (tokens.length === 0) {
    return <span className="code-ide-empty-line">&nbsp;</span>;
  }

  return (
    <>
      {tokens.map((token, index) => (
        <span key={index} style={{ color: token.color }}>
          {token.content}
        </span>
      ))}
    </>
  );
}

export function CodeIdeRow({
  lineNumber,
  tokens,
}: {
  lineNumber: number;
  tokens: DisplayToken[];
}) {
  return (
    <div className="code-ide-row">
      <span className="code-ide-ln" aria-hidden>
        {lineNumber}
      </span>
      <code className="code-ide-src">
        <TokenLine tokens={tokens} />
      </code>
    </div>
  );
}

export function useShikiLines(
  code: string,
  language: string | null | undefined
): {
  lines: string[];
  displayLines: DisplayToken[][];
  resolvedLanguage: SupportedCodeLanguage;
} {
  const normalizedCode = useMemo(
    () => normalizeCodeIndentation(code.replace(/\n$/, "")),
    [code]
  );
  const lines = useMemo(() => normalizedCode.split("\n"), [normalizedCode]);
  const resolvedLanguage = resolveHighlightLanguage(language, code);
  const highlightKey = `${resolvedLanguage}:${normalizedCode}`;
  const [highlightState, setHighlightState] = useState<{
    key: string;
    tokens: ThemedToken[][] | null;
  }>({ key: "", tokens: null });

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const highlighter = await loadHighlighter();
        const tokens = highlighter.codeToTokens(normalizedCode, {
          lang: resolvedLanguage,
          theme: "dark-plus",
        });
        if (!cancelled) {
          setHighlightState({ key: highlightKey, tokens });
        }
      } catch {
        if (!cancelled) {
          setHighlightState({ key: highlightKey, tokens: null });
        }
      }
    }

    void highlight();

    return () => {
      cancelled = true;
    };
  }, [normalizedCode, resolvedLanguage, highlightKey]);

  const tokenLines =
    highlightState.key === highlightKey ? highlightState.tokens : null;
  const displayLines = tokensToDisplayLines(tokenLines, lines);

  return { lines, displayLines, resolvedLanguage };
}
