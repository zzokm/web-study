import type { Question } from "@/types/question";

export function isPracticeKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest("[role='dialog'], [role='alertdialog']")) return true;
  return false;
}

/** Map A–D, 1–4, and T/F keys to an option id for the current question. */
export function resolvePracticeOptionKey(
  question: Question,
  key: string
): string | null {
  if (!key || question.options.length === 0) return null;

  const normalized = key.length === 1 ? key.toLowerCase() : "";

  if (/^[1-9]$/.test(normalized)) {
    const index = Number.parseInt(normalized, 10) - 1;
    return question.options[index]?.id ?? null;
  }

  if (/^[a-d]$/.test(normalized)) {
    return (
      question.options.find((option) => option.id.toLowerCase() === normalized)
        ?.id ?? null
    );
  }

  if (question.questionType === "true_false") {
    const trueOption = question.options.find(
      (option) => option.content.trim().toLowerCase() === "true"
    );
    const falseOption = question.options.find(
      (option) => option.content.trim().toLowerCase() === "false"
    );

    if (normalized === "t") return trueOption?.id ?? null;
    if (normalized === "f") return falseOption?.id ?? null;
  }

  return null;
}
