"use client";

import { useEffect, useRef } from "react";
import type { Question } from "@/types/question";
import {
  isPracticeKeyboardTarget,
  resolvePracticeOptionKey,
} from "@/lib/practice-keyboard";

interface UsePracticeKeyboardOptions {
  question: Question | undefined;
  revealed: boolean;
  selectedId: string | null;
  disabled?: boolean;
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
  disabled = false,
  onSelect,
  onCheck,
  onPrevious,
  onNext,
  onSave,
}: UsePracticeKeyboardOptions) {
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const onCheckRef = useRef(onCheck);
  onCheckRef.current = onCheck;

  const onPreviousRef = useRef(onPrevious);
  onPreviousRef.current = onPrevious;

  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!question) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabledRef.current) return;
      if (isPracticeKeyboardTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const { key } = event;

      if (key === "ArrowLeft") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onPreviousRef.current();
        return;
      }

      if (key === "ArrowRight") {
        if (revealedRef.current) {
          event.preventDefault();
          event.stopImmediatePropagation();
          onNextRef.current();
        }
        return;
      }

      if (
        (key === "Enter" || key === " ") &&
        !revealedRef.current &&
        selectedIdRef.current
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCheckRef.current();
        return;
      }

      if (key.toLowerCase() === "s") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onSaveRef.current();
        return;
      }

      if (!revealedRef.current && key.length === 1) {
        const optionId = resolvePracticeOptionKey(question, key);
        if (optionId) {
          event.preventDefault();
          event.stopImmediatePropagation();
          onSelectRef.current(optionId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [question]);
}
