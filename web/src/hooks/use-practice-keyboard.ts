"use client";

import { useEffect } from "react";
import type { Question } from "@/types/question";
import {
  isPracticeKeyboardTarget,
  resolvePracticeOptionKey,
} from "@/lib/practice-keyboard";

interface UsePracticeKeyboardOptions {
  question: Question | undefined;
  revealed: boolean;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  onCheck: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
}

export function usePracticeKeyboard({
  question,
  revealed,
  selectedId,
  onSelect,
  onCheck,
  onPrevious,
  onNext,
  onSave,
}: UsePracticeKeyboardOptions) {
  useEffect(() => {
    if (!question) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPracticeKeyboardTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const { key } = event;

      if (key === "ArrowLeft") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onPrevious();
        return;
      }

      if (key === "ArrowRight") {
        if (revealed) {
          event.preventDefault();
          event.stopImmediatePropagation();
          onNext();
        }
        return;
      }

      if ((key === "Enter" || key === " ") && !revealed && selectedId) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCheck();
        return;
      }

      if (key.toLowerCase() === "s") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onSave();
        return;
      }

      if (!revealed && key.length === 1) {
        const optionId = resolvePracticeOptionKey(question, key);
        if (optionId) {
          event.preventDefault();
          event.stopImmediatePropagation();
          onSelect(optionId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [
    question,
    revealed,
    selectedId,
    onSelect,
    onCheck,
    onPrevious,
    onNext,
    onSave,
  ]);
}
