import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dismissPracticeFeedbackPromptPermanently,
  markPracticeFeedbackSubmitted,
  shouldShowPracticeFeedbackPrompt,
} from "@/lib/feedback-prompt-storage";

describe("feedback prompt storage", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("localStorage", localStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the prompt by default", () => {
    expect(shouldShowPracticeFeedbackPrompt()).toBe(true);
  });

  it("hides after feedback is submitted", () => {
    markPracticeFeedbackSubmitted();
    expect(shouldShowPracticeFeedbackPrompt()).toBe(false);
  });

  it("hides after permanent dismiss", () => {
    dismissPracticeFeedbackPromptPermanently();
    expect(shouldShowPracticeFeedbackPrompt()).toBe(false);
  });
});
