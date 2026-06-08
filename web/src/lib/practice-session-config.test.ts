import { describe, expect, it } from "vitest";
import { getWrittenQuestions } from "@/lib/questions";
import { createSeededRandom } from "@/lib/seeded-random";
import {
  configFromSessionKey,
  configStorageSuffix,
  preparePracticeQuestions,
  type PracticeSessionConfig,
} from "@/lib/practice-session-config";
import { canonicalPracticeSessionKey } from "@/lib/practice-progress";

describe("written practice session config", () => {
  const config: PracticeSessionConfig = {
    shuffleQuestions: true,
    shuffleMcqOptions: false,
    showSessionTimer: true,
    examSimulation: false,
    writtenTrack: "frontend",
  };

  it("round-trips written track in session key suffix", () => {
    const canonical = canonicalPracticeSessionKey(getWrittenQuestions());
    const sessionKey = canonical + configStorageSuffix(config);
    expect(configFromSessionKey(sessionKey, canonical)).toEqual(config);
  });

  it("defaults written track to both when suffix omits track", () => {
    const canonical = canonicalPracticeSessionKey(getWrittenQuestions());
    const sessionKey = canonical + ":s1000";
    expect(configFromSessionKey(sessionKey, canonical)?.writtenTrack).toBe("both");
  });

  it("shuffles all-written pools when shuffle is enabled", () => {
    const questions = getWrittenQuestions().slice(0, 4);
    const random = createSeededRandom(42);
    const prepared = preparePracticeQuestions(
      questions,
      {
        shuffleQuestions: true,
        shuffleMcqOptions: false,
        showSessionTimer: false,
        examSimulation: false,
      },
      random
    );
    expect(prepared.map((q) => q.questionKey)).not.toEqual(
      questions.map((q) => q.questionKey)
    );
    expect(prepared.map((q) => q.questionKey).sort()).toEqual(
      questions.map((q) => q.questionKey).sort()
    );
  });
});
