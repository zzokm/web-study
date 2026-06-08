import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearActivePracticeSession,
  loadActivePracticeSession,
  saveActivePracticeSession,
} from "@/lib/practice-active-session";
import { DEFAULT_PRACTICE_SESSION_CONFIG } from "@/lib/practice-session-config";

describe("practice-active-session", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips active session state", () => {
    saveActivePracticeSession({
      version: 1,
      returnPath: "/practice/lecture/fe-1/",
      sessionKey: "2021:block_1:q1:s0000",
      canonicalKey: "2021:block_1:q1",
      config: DEFAULT_PRACTICE_SESSION_CONFIG,
      currentIndex: 4,
      updatedAt: "2026-06-08T22:00:00.000Z",
    });

    expect(loadActivePracticeSession()).toEqual({
      version: 1,
      returnPath: "/practice/lecture/fe-1/",
      sessionKey: "2021:block_1:q1:s0000",
      canonicalKey: "2021:block_1:q1",
      config: DEFAULT_PRACTICE_SESSION_CONFIG,
      currentIndex: 4,
      updatedAt: "2026-06-08T22:00:00.000Z",
    });

    clearActivePracticeSession();
    expect(loadActivePracticeSession()).toBeNull();
  });
});
