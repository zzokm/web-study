"use client";

import type { Question } from "@/types/question";

const STORAGE_KEY = "webstudy:saved-v1";

export interface SavedQuestionEntry {
  questionKey: string;
  savedAt: string;
  snapshot: {
    id: string;
    topic: string;
    questionText: string;
    origin: string;
    questionType: string;
  };
}

interface SavedStore {
  version: 1;
  items: SavedQuestionEntry[];
}

function readStore(): SavedStore {
  if (typeof window === "undefined") {
    return { version: 1, items: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, items: [] };
    const parsed = JSON.parse(raw) as SavedStore;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: [] };
    }
    return parsed;
  } catch {
    return { version: 1, items: [] };
  }
}

function writeStore(store: SavedStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("webstudy-saved-changed"));
}

export function getSavedQuestions(): SavedQuestionEntry[] {
  return readStore().items;
}

export function isQuestionSaved(questionKey: string): boolean {
  return readStore().items.some((i) => i.questionKey === questionKey);
}

export function saveQuestion(q: Question): void {
  const store = readStore();
  if (store.items.some((i) => i.questionKey === q.questionKey)) return;
  store.items.push({
    questionKey: q.questionKey,
    savedAt: new Date().toISOString(),
    snapshot: {
      id: q.id,
      topic: q.topic,
      questionText: q.questionText,
      origin: q.origin,
      questionType: q.questionType,
    },
  });
  writeStore(store);
}

export function removeSavedQuestion(questionKey: string): void {
  const store = readStore();
  store.items = store.items.filter((i) => i.questionKey !== questionKey);
  writeStore(store);
}

export function toggleSavedQuestion(q: Question): boolean {
  if (isQuestionSaved(q.questionKey)) {
    removeSavedQuestion(q.questionKey);
    return false;
  }
  saveQuestion(q);
  return true;
}
