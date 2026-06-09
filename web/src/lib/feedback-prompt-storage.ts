const STORAGE_KEY = "webstudy:feedback-prompt-v1";

type FeedbackPromptState = {
  submittedAt?: string;
  dismissedPermanentlyAt?: string;
};

function readState(): FeedbackPromptState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FeedbackPromptState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(next: FeedbackPromptState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function shouldShowPracticeFeedbackPrompt(): boolean {
  const state = readState();
  return !state.submittedAt && !state.dismissedPermanentlyAt;
}

export function markPracticeFeedbackSubmitted() {
  const state = readState();
  writeState({
    ...state,
    submittedAt: new Date().toISOString(),
  });
}

export function dismissPracticeFeedbackPromptPermanently() {
  const state = readState();
  writeState({
    ...state,
    dismissedPermanentlyAt: new Date().toISOString(),
  });
}

/** Test helper */
export function clearPracticeFeedbackPromptState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
