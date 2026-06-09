export const FEEDBACK_FORM_ID =
  "1FAIpQLSfBiJXyAAXxykycB2fRpCUBfBBenziAI-zs3eCUk3Q0UoNjgw";

export const FEEDBACK_FORM_BASE = `https://docs.google.com/forms/d/e/${FEEDBACK_FORM_ID}/viewform`;

/** Google Form prefill entry IDs from inspect-feedback-form.mjs */
export const FEEDBACK_FORM_ENTRIES = {
  overallSatisfaction: "931604357",
  explanationsClarity: "335870983",
  navigationEase: "1027015984",
  contentQuality: "1018410170",
  valuableFeatures: "699804080",
  technicalIssues: "1917413978",
  issueDetail: "994616944",
  device: "282947782",
  likedFeatures: "935931881",
  suggestions: "499541475",
  email: "1340872650",
} as const;

export type FeedbackStarFieldId = keyof Pick<
  typeof FEEDBACK_FORM_ENTRIES,
  | "overallSatisfaction"
  | "explanationsClarity"
  | "navigationEase"
  | "contentQuality"
>;

export type FeedbackStarRating = 1 | 2 | 3 | 4 | 5;

export const FEEDBACK_STAR_QUESTIONS: ReadonlyArray<{
  id: FeedbackStarFieldId;
  label: string;
  shortLabel: string;
  prominent?: boolean;
}> = [
  {
    id: "overallSatisfaction",
    label: "Overall satisfaction with Web Study",
    shortLabel: "Overall satisfaction",
    prominent: true,
  },
  {
    id: "explanationsClarity",
    label:
      "Clarity and helpfulness of explanations and feedback in study materials or practice mode",
    shortLabel: "Explanations & feedback",
  },
  {
    id: "navigationEase",
    label: "How easy it was to navigate and find the content you needed",
    shortLabel: "Navigation & finding content",
  },
  {
    id: "contentQuality",
    label:
      "Quality and accuracy of the content (lectures, questions, and answers)",
    shortLabel: "Content quality & accuracy",
  },
];

export const FEEDBACK_VALUABLE_FEATURE_CHOICES = [
  "Viewing PDFs",
  "Browsing Lectures/Exams",
  "Practice/Quiz Mode",
  "Viewing Detailed Results and Progress",
  "Saving progress/bookmarks",
  "Study Analysis/Statistics",
  "Keyboard Shortcuts/Navigation",
  "Code Examples and their Explanations",
  "Randomized Mock Exams",
] as const;

/** UI-only option — free-text value is sent via the liked-features field. */
export const FEEDBACK_VALUABLE_FEATURE_OTHER = "Other" as const;

export type FeedbackValuableFeature =
  (typeof FEEDBACK_VALUABLE_FEATURE_CHOICES)[number];

export const FEEDBACK_TECHNICAL_ISSUE_CHOICES = [
  "Issues viewing or downloading PDFs",
  "Bugs/errors in the practice / quiz mode",
  "Broken or incorrect links",
  "Display/functionality issues on mobile devices",
  "Problems saving progress or results (Autosaved)",
  "Mock exam generation or resume issue",
  "Code example preview / Run button not working",
  "No, everything worked perfectly!",
] as const;

export type FeedbackTechnicalIssue =
  (typeof FEEDBACK_TECHNICAL_ISSUE_CHOICES)[number];

export const FEEDBACK_NO_ISSUES_CHOICE: FeedbackTechnicalIssue =
  "No, everything worked perfectly!";

export const FEEDBACK_DEVICE_CHOICES = [
  "Desktop/Laptop (Windows/Mac/Linux)",
  "Tablet (iPad/Android)",
  "Smartphone (iPhone/Android)",
] as const;

export type FeedbackDevice = (typeof FEEDBACK_DEVICE_CHOICES)[number];

export type FeedbackFormPayload = {
  ratings: Partial<Record<FeedbackStarFieldId, FeedbackStarRating>>;
  valuableFeatures: FeedbackValuableFeature[];
  valuableFeatureOther?: string;
  technicalIssues: FeedbackTechnicalIssue[];
  issueDetail?: string;
  device?: FeedbackDevice;
  likedFeatures?: string;
  suggestions?: string;
  contactEmail?: string;
};

function appendEntry(
  params: URLSearchParams,
  entryId: string | undefined,
  value: string | undefined
) {
  if (entryId?.trim() && value?.trim()) {
    params.set(`entry.${entryId.trim()}`, value.trim());
  }
}

function appendEntries(
  params: URLSearchParams,
  entryId: string | undefined,
  values: readonly string[] | undefined
) {
  if (!entryId?.trim() || !values?.length) return;
  for (const value of values) {
    if (value.trim()) {
      params.append(`entry.${entryId.trim()}`, value.trim());
    }
  }
}

export function detectFeedbackDevice(): FeedbackDevice {
  if (typeof window === "undefined") {
    return "Desktop/Laptop (Windows/Mac/Linux)";
  }

  const width = window.innerWidth;
  const ua = navigator.userAgent;

  if (width < 768 || /iPhone|Android.+Mobile/i.test(ua)) {
    return "Smartphone (iPhone/Android)";
  }
  if (width < 1024 || /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) {
    return "Tablet (iPad/Android)";
  }
  return "Desktop/Laptop (Windows/Mac/Linux)";
}

export function hasValuableFeatureSelection(payload: FeedbackFormPayload): boolean {
  if (payload.valuableFeatures.length > 0) return true;
  return Boolean(payload.valuableFeatureOther?.trim());
}

export function feedbackRequiresIssueDetail(
  technicalIssues: readonly FeedbackTechnicalIssue[]
): boolean {
  return technicalIssues.some((issue) => issue !== FEEDBACK_NO_ISSUES_CHOICE);
}

export function isFeedbackFormComplete(payload: FeedbackFormPayload): boolean {
  const allStarsRated = FEEDBACK_STAR_QUESTIONS.every(
    (question) => payload.ratings[question.id] != null
  );

  if (!allStarsRated) return false;
  if (!hasValuableFeatureSelection(payload)) return false;
  if (payload.technicalIssues.length === 0) return false;
  if (!payload.device) return false;

  if (
    feedbackRequiresIssueDetail(payload.technicalIssues) &&
    !payload.issueDetail?.trim()
  ) {
    return false;
  }

  return true;
}

export function buildFeedbackFormUrl(payload: FeedbackFormPayload): string {
  const params = new URLSearchParams();
  params.set("usp", "pp_url");

  for (const question of FEEDBACK_STAR_QUESTIONS) {
    const rating = payload.ratings[question.id];
    if (rating) {
      appendEntry(
        params,
        FEEDBACK_FORM_ENTRIES[question.id],
        String(rating)
      );
    }
  }

  appendEntries(
    params,
    FEEDBACK_FORM_ENTRIES.valuableFeatures,
    payload.valuableFeatures
  );
  appendEntries(
    params,
    FEEDBACK_FORM_ENTRIES.technicalIssues,
    payload.technicalIssues
  );
  appendEntry(params, FEEDBACK_FORM_ENTRIES.issueDetail, payload.issueDetail);
  appendEntry(params, FEEDBACK_FORM_ENTRIES.device, payload.device);

  const likedFeaturesParts: string[] = [];
  if (payload.valuableFeatureOther?.trim()) {
    likedFeaturesParts.push(
      `Other valuable feature: ${payload.valuableFeatureOther.trim()}`
    );
  }
  if (payload.likedFeatures?.trim()) {
    likedFeaturesParts.push(payload.likedFeatures.trim());
  }
  appendEntry(
    params,
    FEEDBACK_FORM_ENTRIES.likedFeatures,
    likedFeaturesParts.length > 0 ? likedFeaturesParts.join("\n\n") : undefined
  );

  appendEntry(params, FEEDBACK_FORM_ENTRIES.suggestions, payload.suggestions);
  appendEntry(params, FEEDBACK_FORM_ENTRIES.email, payload.contactEmail);

  const query = params.toString();
  return query ? `${FEEDBACK_FORM_BASE}?${query}` : FEEDBACK_FORM_BASE;
}
