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
  examSimulation?: boolean;
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
  examSimulation = false,
  onSelect,
  onCheck,
  onPrevious,
  onNext,
  onSave,
}: UsePracticeKeyboardOptions) {
  const examSimulationRef = useRef(examSimulation);
  const disabledRef = useRef(disabled);
  const revealedRef = useRef(revealed);
  const selectedIdRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const onCheckRef = useRef(onCheck);
  const onPreviousRef = useRef(onPrevious);
  const onNextRef = useRef(onNext);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    examSimulationRef.current = examSimulation;
    disabledRef.current = disabled;
    revealedRef.current = revealed;
    selectedIdRef.current = selectedId;
    onSelectRef.current = onSelect;
    onCheckRef.current = onCheck;
    onPreviousRef.current = onPrevious;
    onNextRef.current = onNext;
    onSaveRef.current = onSave;
  }, [
    examSimulation,
    disabled,
    revealed,
    selectedId,
    onSelect,
    onCheck,
    onPrevious,
    onNext,
    onSave,
  ]);

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
        if (examSimulationRef.current ? selectedIdRef.current : revealedRef.current) {
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
        if (examSimulationRef.current) {
          onNextRef.current();
        } else {
          onCheckRef.current();
        }
        return;
      }

      if (key.toLowerCase() === "s" && !examSimulationRef.current) {
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
