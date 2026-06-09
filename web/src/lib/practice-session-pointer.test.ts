import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Question } from "@/types/question";
import {
  canonicalPracticeSessionKey,
  type PracticeProgress,
} from "@/lib/practice-progress";
import { scopeStorageKey } from "@/lib/practice-scope";
import { resultStorageId } from "@/lib/practice-results";
import {
  bumpPracticeStatusStore,
  getPracticeSessionStatusSnapshot,
  resolveLectureIncludeWrittenQuestions,
  savePracticeSessionPointer,
} from "@/lib/practice-session-pointer";

const POINTER_PREFIX = "webstudy:practice-pointer-v1:";
const PROGRESS_PREFIX = "webstudy:practice-v1:";
const RESULT_PREFIX = "webstudy:practice-result-v1:";
const LECTURE_SCOPE = "lecture:fe-1" as const;
const EXAM_SCOPE = "exam:2021" as const;

function mcq(questionKey: string): Question {
  return {
    questionKey,
    questionType: "mcq",
    correctAnswerId: "a",
    options: [
      { id: "a", content: "A", type: "text" },
      { id: "b", content: "B", type: "text" },
    ],
  } as unknown as Question;
}

function written(questionKey: string): Question {
  return {
    questionKey,
    questionType: "written",
    correctAnswerId: "",
    options: [],
    expectedAnswer: "ok",
  } as unknown as Question;
}

function revealedProgress(keys: string[]): PracticeProgress {
  return Object.fromEntries(
    keys.map((key) => [key, { selectedId: "a", revealed: true }])
  );
}

describe("getPracticeSessionStatusSnapshot legacy pools", () => {
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
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    });
    bumpPracticeStatusStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves completed status when the catalog adds a question to the pool", () => {
    const oldQuestions = [mcq("2021:block_1:q1"), mcq("2021:block_1:q2")];
    const newQuestions = [
      ...oldQuestions,
      mcq("2024:block_1:q23"),
    ];
    const oldCanonical = canonicalPracticeSessionKey(oldQuestions);
    const sessionKey = `${oldCanonical}:s0000`;
    const resultId = resultStorageId(sessionKey);

    store.set(
      `${PROGRESS_PREFIX}${sessionKey}`,
      JSON.stringify(revealedProgress(["2021:block_1:q1", "2021:block_1:q2"]))
    );
    store.set(
      `${RESULT_PREFIX}${resultId}`,
      JSON.stringify({
        sessionKey,
        title: "F1 Internet Protocols — Practice",
        finishedAt: "2026-06-08T21:48:50.458Z",
        questionKeys: ["2021:block_1:q1", "2021:block_1:q2"],
        progress: revealedProgress(["2021:block_1:q1", "2021:block_1:q2"]),
        config: {
          shuffleQuestions: false,
          shuffleMcqOptions: false,
          showSessionTimer: false,
          examSimulation: false,
        },
        returnHref: "/practice/lecture/fe-1/",
      })
    );
    savePracticeSessionPointer(LECTURE_SCOPE, oldCanonical, {
      sessionKey,
      config: {
        shuffleQuestions: false,
        shuffleMcqOptions: false,
        showSessionTimer: false,
        examSimulation: false,
      },
      status: "completed",
      resultId,
      updatedAt: "2026-06-08T21:48:50.463Z",
    });

    const status = getPracticeSessionStatusSnapshot(newQuestions, LECTURE_SCOPE);

    expect(status?.kind).toBe("completed");
    if (status?.kind === "completed") {
      expect(status.percent).toBe(100);
      expect(status.resultId).toBe(resultId);
    }

    const migratedPointer = store.get(
      `${POINTER_PREFIX}${scopeStorageKey(
        LECTURE_SCOPE,
        canonicalPracticeSessionKey(newQuestions)
      )}`
    );
    expect(migratedPointer).toBeTruthy();
  });

  it("counts legacy in-progress progress after the pool changes", () => {
    const oldQuestions = [mcq("2021:block_1:q1"), mcq("2021:block_1:q2")];
    const newQuestions = [
      ...oldQuestions,
      mcq("2024:block_1:q23"),
    ];
    const oldCanonical = canonicalPracticeSessionKey(oldQuestions);
    const sessionKey = `${oldCanonical}:s0000`;

    store.set(
      `${PROGRESS_PREFIX}${sessionKey}`,
      JSON.stringify(revealedProgress(["2021:block_1:q1"]))
    );

    const status = getPracticeSessionStatusSnapshot(newQuestions, LECTURE_SCOPE);

    expect(status?.kind).toBe("in_progress");
    if (status?.kind === "in_progress") {
      expect(status.answered).toBe(1);
      expect(status.total).toBe(3);
      expect(status.percent).toBe(33);
    }
  });

  it("resolves lecture MCQ-only progress stored on a full pool session key", () => {
    const mcqQuestions = [mcq("lecture:q1"), mcq("lecture:q2")];
    const fullQuestions = [...mcqQuestions, written("lecture:w1")];
    const fullCanonical = canonicalPracticeSessionKey(fullQuestions);
    const sessionKey = `${fullCanonical}:s0000`;

    store.set(
      `${PROGRESS_PREFIX}${scopeStorageKey(LECTURE_SCOPE, sessionKey)}`,
      JSON.stringify(revealedProgress(["lecture:q1"]))
    );

    const status = getPracticeSessionStatusSnapshot(mcqQuestions, LECTURE_SCOPE);

    expect(status?.kind).toBe("in_progress");
    if (status?.kind === "in_progress") {
      expect(status.answered).toBe(1);
      expect(status.total).toBe(2);
      expect(status.percent).toBe(50);
    }
  });

  it("infers includeWrittenQuestions from a legacy full-pool session key", () => {
    const mcqQuestions = [mcq("lecture:q1"), mcq("lecture:q2")];
    const fullQuestions = [...mcqQuestions, written("lecture:w1")];
    const fullCanonical = canonicalPracticeSessionKey(fullQuestions);
    const sessionKey = `${fullCanonical}:s0000`;

    expect(
      resolveLectureIncludeWrittenQuestions(
        {
          shuffleQuestions: false,
          shuffleMcqOptions: false,
          showSessionTimer: false,
          examSimulation: false,
          includeWrittenQuestions: false,
        },
        sessionKey,
        fullQuestions
      )
    ).toBe(true);
  });

  it("does not count exam progress toward lecture scope", () => {
    const sharedKey = "2021:block_1:q1";
    const lectureQuestions = [mcq(sharedKey), mcq("2021:block_1:q2")];
    const examQuestions = [
      mcq(sharedKey),
      mcq("2021:block_1:q3"),
      mcq("2021:block_1:q4"),
    ];
    const examCanonical = canonicalPracticeSessionKey(examQuestions);
    const examSessionKey = `${examCanonical}:s0000`;

    store.set(
      `${PROGRESS_PREFIX}${scopeStorageKey(EXAM_SCOPE, examSessionKey)}`,
      JSON.stringify(revealedProgress([sharedKey, "2021:block_1:q3"]))
    );

    const lectureStatus = getPracticeSessionStatusSnapshot(
      lectureQuestions,
      LECTURE_SCOPE
    );
    const examStatus = getPracticeSessionStatusSnapshot(
      examQuestions,
      EXAM_SCOPE
    );

    expect(lectureStatus).toBeNull();
    expect(examStatus?.kind).toBe("in_progress");
    if (examStatus?.kind === "in_progress") {
      expect(examStatus.answered).toBe(2);
    }
  });
});
