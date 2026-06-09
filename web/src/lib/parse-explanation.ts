export type ExplanationInline =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "em"; text: string }
  | { kind: "strong"; text: string };

const BACKTICK_SPLIT_RE = /(`[^`]*`)/g;
const EMPHASIS_RE = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function parseEmphasisInProse(text: string): ExplanationInline[] {
  const nodes: ExplanationInline[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(EMPHASIS_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push({ kind: "text", text: text.slice(lastIndex, index) });
    }
    if (match[1] !== undefined) {
      nodes.push({ kind: "strong", text: match[1] });
    } else if (match[2] !== undefined) {
      nodes.push({ kind: "em", text: match[2] });
    }
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ kind: "text", text: text.slice(lastIndex) });
  }

  return nodes;
}

/** Parse explanation prose: `code`, *emphasis*, **strong** (backticks only for code). */
export function parseExplanationInlines(text: string): ExplanationInline[] {
  const parts = text.split(BACKTICK_SPLIT_RE).filter((part) => part.length > 0);
  const nodes: ExplanationInline[] = [];

  for (const part of parts) {
    if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push({ kind: "code", text: part.slice(1, -1) });
      continue;
    }
    nodes.push(...parseEmphasisInProse(part));
  }

  return nodes;
}
