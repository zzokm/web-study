export type QuestionInline =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "strike"; text: string }
  | { kind: "underline"; text: string };

const BACKTICK_SPLIT_RE = /(`[^`]*`)/g;
const DECORATION_TAG_RE = /<(del|s|u|ins)>([^<]*)<\/\1>/gi;

function parseDecorationsInProse(text: string): QuestionInline[] {
  const nodes: QuestionInline[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(DECORATION_TAG_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push({ kind: "text", text: text.slice(lastIndex, index) });
    }
    const tag = match[1].toLowerCase();
    const inner = match[2];
    nodes.push({
      kind: tag === "del" || tag === "s" ? "strike" : "underline",
      text: inner,
    });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ kind: "text", text: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ kind: "text", text }];
}

/** Parse question stem prose: `code`, <del>/<s> strike, <u>/<ins> underline. */
export function parseQuestionInlines(text: string): QuestionInline[] {
  const parts = text.split(BACKTICK_SPLIT_RE).filter((part) => part.length > 0);
  const nodes: QuestionInline[] = [];

  for (const part of parts) {
    if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push({ kind: "code", text: part.slice(1, -1) });
      continue;
    }
    nodes.push(...parseDecorationsInProse(part));
  }

  return nodes;
}
