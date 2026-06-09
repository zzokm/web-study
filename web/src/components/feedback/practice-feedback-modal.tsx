"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckIcon, SparklesIcon } from "lucide-react";
import { FeedbackDecorativeStars } from "@/components/feedback/feedback-decorative-stars";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  FEEDBACK_DEVICE_CHOICES,
  FEEDBACK_NO_ISSUES_CHOICE,
  FEEDBACK_STAR_QUESTIONS,
  FEEDBACK_TECHNICAL_ISSUE_CHOICES,
  FEEDBACK_VALUABLE_FEATURE_CHOICES,
  FEEDBACK_VALUABLE_FEATURE_OTHER,
  buildFeedbackFormUrl,
  detectFeedbackDevice,
  feedbackRequiresIssueDetail,
  isFeedbackFormComplete,
  type FeedbackDevice,
  type FeedbackFormPayload,
  type FeedbackStarFieldId,
  type FeedbackStarRating,
  type FeedbackTechnicalIssue,
  type FeedbackValuableFeature,
} from "@/lib/feedback-form";
import {
  dismissPracticeFeedbackPromptPermanently,
  markPracticeFeedbackSubmitted,
} from "@/lib/feedback-prompt-storage";
import { StarRating } from "@/components/feedback/star-rating";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const COUNTDOWN_SECONDS = 10;

export type FeedbackSource = "sidebar" | "home" | "practice";

export type FeedbackFormDialogProps = {
  open: boolean;
  onClose: () => void;
  variant: "general" | "practice";
  source?: FeedbackSource;
  practiceTitle?: string;
  scorePercent?: number;
};

type PracticeFeedbackModalProps = {
  open: boolean;
  practiceTitle: string;
  scorePercent: number;
  onComplete: () => void;
};

function FeedbackFieldLabel({
  htmlFor,
  children,
  required = false,
  description,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={htmlFor} className="text-sm font-medium leading-snug">
        {children}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function SelectBlockOption({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-sm leading-snug transition-all",
        checked
          ? "border-amber-500/60 bg-amber-500/15 font-medium text-foreground shadow-sm ring-1 ring-amber-500/25"
          : "border-border/80 bg-background hover:border-border hover:bg-muted/30"
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="sr-only"
      />
      <span className="flex-1">{label}</span>
      {checked ? (
        <CheckIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      ) : null}
    </label>
  );
}

type FeedbackModalFormState = FeedbackFormPayload & {
  otherFeatureSelected: boolean;
  otherFeatureText: string;
};

function createInitialFormState(): FeedbackModalFormState {
  return {
    ratings: {},
    valuableFeatures: [],
    otherFeatureSelected: false,
    otherFeatureText: "",
    technicalIssues: [],
    issueDetail: "",
    device: detectFeedbackDevice(),
    likedFeatures: "",
    suggestions: "",
    contactEmail: "",
  };
}

function toFeedbackPayload(form: FeedbackModalFormState): FeedbackFormPayload {
  return {
    ratings: form.ratings,
    valuableFeatures: form.valuableFeatures,
    valuableFeatureOther: form.otherFeatureSelected
      ? form.otherFeatureText.trim() || undefined
      : undefined,
    technicalIssues: form.technicalIssues,
    issueDetail: form.issueDetail?.trim() || undefined,
    device: form.device,
    likedFeatures: form.likedFeatures?.trim() || undefined,
    suggestions: form.suggestions?.trim() || undefined,
    contactEmail: form.contactEmail?.trim() || undefined,
  };
}

export function PracticeFeedbackModal({
  open,
  practiceTitle,
  scorePercent,
  onComplete,
}: PracticeFeedbackModalProps) {
  return (
    <FeedbackFormDialog
      open={open}
      onClose={onComplete}
      variant="practice"
      source="practice"
      practiceTitle={practiceTitle}
      scorePercent={scorePercent}
    />
  );
}

export function FeedbackFormDialog({
  open,
  onClose,
  variant,
  source = "home",
  practiceTitle = "",
  scorePercent = 0,
}: FeedbackFormDialogProps) {
  const isPractice = variant === "practice";
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [form, setForm] = useState(createInitialFormState);

  useEffect(() => {
    if (!open) return;

    trackAnalyticsEvent(AnalyticsEvents.feedbackPromptOpen, {
      practice_title: isPractice ? practiceTitle : source,
      score_percent: isPractice ? scorePercent : 0,
    });

    if (!isPractice) return;

    const timer = window.setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open, isPractice, practiceTitle, scorePercent, source]);

  const resultsReady = !isPractice || countdown === 0;

  const payload = useMemo(() => toFeedbackPayload(form), [form]);

  const otherFeatureValid =
    !form.otherFeatureSelected || form.otherFeatureText.trim().length > 0;
  const canSubmit = isFeedbackFormComplete(payload) && otherFeatureValid;
  const showIssueDetail = feedbackRequiresIssueDetail(form.technicalIssues);

  function setRating(id: FeedbackStarFieldId, value: FeedbackStarRating) {
    setForm((current) => ({
      ...current,
      ratings: { ...current.ratings, [id]: value },
    }));
  }

  function toggleValuableFeature(feature: FeedbackValuableFeature, checked: boolean) {
    setForm((current) => ({
      ...current,
      valuableFeatures: checked
        ? [...current.valuableFeatures, feature]
        : current.valuableFeatures.filter((item) => item !== feature),
    }));
  }

  function toggleTechnicalIssue(issue: FeedbackTechnicalIssue, checked: boolean) {
    setForm((current) => {
      if (issue === FEEDBACK_NO_ISSUES_CHOICE) {
        return checked
          ? { ...current, technicalIssues: [FEEDBACK_NO_ISSUES_CHOICE], issueDetail: "" }
          : {
              ...current,
              technicalIssues: current.technicalIssues.filter(
                (item) => item !== FEEDBACK_NO_ISSUES_CHOICE
              ),
            };
      }

      const withoutNoIssues = current.technicalIssues.filter(
        (item) => item !== FEEDBACK_NO_ISSUES_CHOICE
      );
      const technicalIssues = checked
        ? [...withoutNoIssues, issue]
        : withoutNoIssues.filter((item) => item !== issue);

      return { ...current, technicalIssues };
    });
  }

  function handleViewResults(skipReason: "countdown" | "skip") {
    trackAnalyticsEvent(AnalyticsEvents.feedbackPromptSkip, {
      practice_title: practiceTitle,
      score_percent: scorePercent,
      skip_reason: skipReason,
      overall_rated: form.ratings.overallSatisfaction != null,
    });
    onClose();
  }

  function handleDontShowAgain() {
    dismissPracticeFeedbackPromptPermanently();
    trackAnalyticsEvent(AnalyticsEvents.feedbackPromptDismiss, {
      practice_title: isPractice ? practiceTitle : source,
      score_percent: isPractice ? scorePercent : 0,
      overall_rated: form.ratings.overallSatisfaction != null,
    });
    onClose();
  }

  function handleSubmit() {
    if (!canSubmit) return;

    const url = buildFeedbackFormUrl(payload);

    markPracticeFeedbackSubmitted();
    trackAnalyticsEvent(AnalyticsEvents.feedbackPromptSubmit, {
      practice_title: isPractice ? practiceTitle : source,
      score_percent: isPractice ? scorePercent : 0,
      overall_rating: form.ratings.overallSatisfaction,
      rated_count: Object.keys(form.ratings).length,
    });

    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPractice) onClose();
      }}
      disablePointerDismissal={isPractice}
    >
      <DialogContent
        showCloseButton={!isPractice}
        className="flex max-h-[min(92vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl md:max-w-2xl"
      >
        <div className="relative shrink-0 border-b bg-gradient-to-br from-amber-500/10 via-background to-primary/5 px-5 pt-5 pb-6 md:px-6">
          <FeedbackDecorativeStars />

          <DialogHeader className="relative z-10 gap-2.5 text-left">
            <div className="flex items-center gap-2 text-amber-500">
              <SparklesIcon className="size-4" aria-hidden />
              <span className="text-xs font-semibold tracking-wide uppercase">
                Quick feedback
              </span>
            </div>
            <DialogTitle className="text-xl leading-snug">
              {isPractice
                ? "Before you see your results — how was this session?"
                : "Share your feedback"}
            </DialogTitle>
            <DialogDescription className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">Takes less than a minute.</span>{" "}
                Your feedback means a lot to me — it helps me improve Web Study and future
                projects.
              </span>
              <span>
                Your responses are{" "}
                <span className="font-medium text-foreground">100% anonymous</span> unless
                you choose to add your email below.
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5 md:px-6">
          {FEEDBACK_STAR_QUESTIONS.map((question) => (
            <div
              key={question.id}
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-4",
                question.prominent
                  ? "border-amber-500/25 bg-amber-500/5"
                  : "border-border/70 bg-muted/20"
              )}
            >
              <FeedbackFieldLabel required description={question.label}>
                {question.shortLabel}
              </FeedbackFieldLabel>
              <StarRating
                value={form.ratings[question.id] ?? null}
                onChange={(value) => setRating(question.id, value)}
                label={question.shortLabel}
                size={question.prominent ? "lg" : "md"}
              />
            </div>
          ))}

          <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-4">
            <FeedbackFieldLabel
              required
              description="Select everything you used or found helpful on Web Study."
            >
              Which features did you find most valuable?
            </FeedbackFieldLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEEDBACK_VALUABLE_FEATURE_CHOICES.map((feature) => (
                <SelectBlockOption
                  key={feature}
                  id={`valuable-${feature}`}
                  label={feature}
                  checked={form.valuableFeatures.includes(feature)}
                  onCheckedChange={(checked) =>
                    toggleValuableFeature(feature, checked)
                  }
                />
              ))}
              <SelectBlockOption
                id="valuable-other"
                label={FEEDBACK_VALUABLE_FEATURE_OTHER}
                checked={form.otherFeatureSelected}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    otherFeatureSelected: checked,
                    otherFeatureText: checked ? current.otherFeatureText : "",
                  }))
                }
              />
            </div>
            {form.otherFeatureSelected ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="practice-feedback-other-feature" className="text-sm font-medium">
                  Describe the other feature
                  <span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="practice-feedback-other-feature"
                  value={form.otherFeatureText}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      otherFeatureText: event.target.value,
                    }))
                  }
                  placeholder="Describe the other feature you found valuable…"
                  aria-invalid={!otherFeatureValid}
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-4">
            <FeedbackFieldLabel
              required
              description="Tell us if anything broke or got in your way during this session."
            >
              Did you run into any technical issues?
            </FeedbackFieldLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEEDBACK_TECHNICAL_ISSUE_CHOICES.map((issue) => (
                <SelectBlockOption
                  key={issue}
                  id={`issue-${issue}`}
                  label={issue}
                  checked={form.technicalIssues.includes(issue)}
                  onCheckedChange={(checked) => toggleTechnicalIssue(issue, checked)}
                />
              ))}
            </div>
          </div>

          {showIssueDetail ? (
            <div className="flex flex-col gap-2">
              <FeedbackFieldLabel
                htmlFor="practice-feedback-issue-detail"
                required
                description="A short note helps us reproduce and fix the problem faster."
              >
                What went wrong?
              </FeedbackFieldLabel>
              <Textarea
                id="practice-feedback-issue-detail"
                value={form.issueDetail ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    issueDetail: event.target.value,
                  }))
                }
                placeholder="Describe the bug or issue you encountered…"
                rows={3}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <FeedbackFieldLabel htmlFor="practice-feedback-device" required>
              What device did you primarily use?
            </FeedbackFieldLabel>
            <Select
              value={form.device ?? null}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  device: value as FeedbackDevice,
                }))
              }
            >
              <SelectTrigger id="practice-feedback-device" className="w-full">
                <SelectValue placeholder="Select your device">
                  {form.device ?? "Select your device"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_DEVICE_CHOICES.map((device) => (
                  <SelectItem key={device} value={device}>
                    {device}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <FeedbackFieldLabel htmlFor="practice-feedback-liked">
              List any specific features you used that you particularly liked.
            </FeedbackFieldLabel>
            <Textarea
              id="practice-feedback-liked"
              value={form.likedFeatures ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  likedFeatures: event.target.value,
                }))
              }
              placeholder="Features, explanations, or moments that helped you study better…"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <FeedbackFieldLabel htmlFor="practice-feedback-suggestions">
              Do you have any suggestions for new features or improvements?
            </FeedbackFieldLabel>
            <Textarea
              id="practice-feedback-suggestions"
              value={form.suggestions ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  suggestions: event.target.value,
                }))
              }
              placeholder="New features, confusing parts, or anything that felt missing…"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <FeedbackFieldLabel
              htmlFor="practice-feedback-email"
              description="Only if you are open to follow-up questions about your feedback."
            >
              Email for follow-up
            </FeedbackFieldLabel>
            <Input
              id="practice-feedback-email"
              type="email"
              value={form.contactEmail ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contactEmail: event.target.value,
                }))
              }
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            We&apos;ll open the feedback form with your answers pre-filled so you can
            review and submit in one click.
          </p>
        </div>

        <DialogFooter className="mx-0 mb-0 flex flex-col gap-2 rounded-b-xl border-t bg-background px-5 py-4 md:flex-row md:items-stretch md:gap-3 md:px-6">
          {isPractice ? (
            <>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground md:flex-1"
                disabled={!resultsReady}
                onClick={handleDontShowAgain}
              >
                {resultsReady
                  ? "Don't show this again"
                  : `Don't show again (${countdown}s)`}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full md:flex-1"
                disabled={!resultsReady}
                onClick={() => handleViewResults("skip")}
              >
                {resultsReady ? "View results now" : `View results (${countdown}s)`}
              </Button>
              <Button
                type="button"
                className="w-full md:flex-1"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                Submit feedback
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground md:flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="w-full md:flex-1"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                Submit feedback
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
