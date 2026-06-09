import { describe, expect, it } from "vitest";
import { getWrittenQuestions } from "@/lib/questions";
import { createSeededRandom } from "@/lib/seeded-random";
import {
  configFromSessionKey,
  configStorageSuffix,
  practiceConfigAnalyticsParams,
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
    includeWrittenQuestions: false,
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

  it("includes written track in analytics params when filtered", () => {
    expect(
      practiceConfigAnalyticsParams({
        ...config,
        writtenTrack: "backend",
      })
    ).toEqual({
      shuffle_questions: true,
      shuffle_mcq_options: false,
      show_session_timer: true,
      exam_simulation: false,
      written_track: "backend",
    });
    expect(
      practiceConfigAnalyticsParams({
        ...config,
        writtenTrack: "both",
      }).written_track
    ).toBeUndefined();
  });

  it("round-trips includeWrittenQuestions in session key suffix", () => {
    const canonical = "q1\0q2";
    const sessionKey =
      canonical +
      configStorageSuffix({
        shuffleQuestions: false,
        shuffleMcqOptions: false,
        showSessionTimer: true,
        examSimulation: false,
        includeWrittenQuestions: true,
      });
    expect(configFromSessionKey(sessionKey, canonical)).toEqual({
      shuffleQuestions: false,
      shuffleMcqOptions: false,
      showSessionTimer: true,
      examSimulation: false,
      includeWrittenQuestions: true,
      writtenTrack: "both",
    });
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
