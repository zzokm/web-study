import { describe, expect, it } from "vitest";
import {
  FEEDBACK_FORM_ENTRIES,
  FEEDBACK_NO_ISSUES_CHOICE,
  buildFeedbackFormUrl,
  feedbackRequiresIssueDetail,
  hasValuableFeatureSelection,
  isFeedbackFormComplete,
} from "@/lib/feedback-form";

const completePayload = {
  ratings: {
    overallSatisfaction: 5 as const,
    explanationsClarity: 4 as const,
    navigationEase: 4 as const,
    contentQuality: 5 as const,
  },
  valuableFeatures: ["Practice/Quiz Mode"] as const,
  technicalIssues: [FEEDBACK_NO_ISSUES_CHOICE] as const,
  device: "Desktop/Laptop (Windows/Mac/Linux)" as const,
  suggestions: "More mock exams please",
};

describe("feedback form helpers", () => {
  it("requires issue detail when bugs are selected", () => {
    expect(
      feedbackRequiresIssueDetail(["Bugs/errors in the practice / quiz mode"])
    ).toBe(true);
    expect(feedbackRequiresIssueDetail([FEEDBACK_NO_ISSUES_CHOICE])).toBe(false);
  });

  it("accepts listed features or other free-text", () => {
    expect(hasValuableFeatureSelection({ ...completePayload, valuableFeatures: [] })).toBe(
      false
    );
    expect(
      hasValuableFeatureSelection({
        ...completePayload,
        valuableFeatures: [],
        valuableFeatureOther: "Flashcards",
      })
    ).toBe(true);
  });

  it("validates required fields except optional last three", () => {
    expect(isFeedbackFormComplete(completePayload)).toBe(true);
    expect(
      isFeedbackFormComplete({
        ...completePayload,
        ratings: { overallSatisfaction: 5 },
      })
    ).toBe(false);
    expect(
      isFeedbackFormComplete({
        ...completePayload,
        technicalIssues: ["Bugs/errors in the practice / quiz mode"],
        issueDetail: "",
      })
    ).toBe(false);
  });
});

describe("buildFeedbackFormUrl", () => {
  it("prefills only user-provided answers without session metadata", () => {
    const url = buildFeedbackFormUrl({
      ...completePayload,
      valuableFeatures: ["Practice/Quiz Mode", "Viewing Detailed Results and Progress"],
      likedFeatures: "Clear explanations",
      valuableFeatureOther: "Night mode",
      contactEmail: "student@example.com",
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get("usp")).toBe("pp_url");
    expect(parsed.searchParams.get(`entry.${FEEDBACK_FORM_ENTRIES.overallSatisfaction}`)).toBe(
      "5"
    );
    expect(parsed.searchParams.get(`entry.${FEEDBACK_FORM_ENTRIES.suggestions}`)).toBe(
      "More mock exams please"
    );
    expect(parsed.searchParams.get(`entry.${FEEDBACK_FORM_ENTRIES.email}`)).toBe(
      "student@example.com"
    );
    expect(
      parsed.searchParams.getAll(`entry.${FEEDBACK_FORM_ENTRIES.valuableFeatures}`)
    ).toEqual(["Practice/Quiz Mode", "Viewing Detailed Results and Progress"]);
    expect(
      parsed.searchParams.get(`entry.${FEEDBACK_FORM_ENTRIES.likedFeatures}`)
    ).toBe("Other valuable feature: Night mode\n\nClear explanations");
    expect(
      parsed.searchParams.get(`entry.${FEEDBACK_FORM_ENTRIES.likedFeatures}`)
    ).not.toContain("Device info");
    expect(
      parsed.searchParams.get(`entry.${FEEDBACK_FORM_ENTRIES.likedFeatures}`)
    ).not.toContain("Practice session");
  });
});
