"use client";

import type { PracticeSessionStatus } from "@/lib/practice-session-pointer";
import {
  derivePracticeHubProgressDisplay,
  practiceHubProgressAriaLabel,
} from "@/lib/practice-hub-progress";
import type { PracticeSessionConfig } from "@/lib/practice-session-config";
import { DEFAULT_PRACTICE_SESSION_CONFIG } from "@/lib/practice-session-config";
import type { WrittenPracticeTrack } from "@/lib/written-practice-filter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { LinkButton } from "@/components/ui/link-button";
import { CircularProgress } from "@/components/practice/circular-progress";

type PracticeSetupProps = {
  title: string;
  questionCount: number;
  config: PracticeSessionConfig;
  onConfigChange: (config: PracticeSessionConfig) => void;
  sessionStatus: PracticeSessionStatus | null;
  statusHydrated?: boolean;
  onContinue: () => void;
  onViewResults: () => void;
  onStart: () => void;
  onStartFresh: () => void;
  backHref?: string;
  /** Written practice: hide shuffle, timer, and exam simulation options. */
  variant?: "default" | "written";
};

function SetupOption({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <FieldLabel htmlFor={id} className="cursor-pointer">
      <Field
        orientation="horizontal"
        data-disabled={disabled ? true : undefined}
        className="items-center"
      >
        <FieldContent>
          <FieldTitle>{label}</FieldTitle>
          {description ? (
            <FieldDescription>{description}</FieldDescription>
          ) : null}
        </FieldContent>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="shrink-0 self-center"
        />
      </Field>
    </FieldLabel>
  );
}

type SetupProgressDisplay = ReturnType<typeof derivePracticeHubProgressDisplay> & {
  showActions: boolean;
};

function deriveSetupProgressDisplay(
  sessionStatus: PracticeSessionStatus | null,
  questionCount: number,
  statusHydrated: boolean
): SetupProgressDisplay {
  const base = derivePracticeHubProgressDisplay(
    sessionStatus,
    questionCount,
    statusHydrated
  );
  return {
    ...base,
    showActions: statusHydrated && sessionStatus != null,
  };
}

function SetupCardProgress({
  progress,
  statusHydrated,
}: {
  progress: SetupProgressDisplay;
  statusHydrated: boolean;
}) {
  const ariaLabel = statusHydrated
    ? practiceHubProgressAriaLabel(progress)
    : "Loading progress";

  return (
    <CircularProgress
      value={statusHydrated ? progress.percent : 0}
      size={40}
      strokeWidth={4}
      centerLabel={progress.centerLabel}
      label={ariaLabel}
      title={ariaLabel}
      className="shrink-0"
    />
  );
}

function SetupCardHeader({
  title,
  description,
  progress,
  statusHydrated,
}: {
  title: string;
  description: string;
  progress: SetupProgressDisplay;
  statusHydrated: boolean;
}) {
  return (
    <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
      <div className="min-w-0 flex-1 pr-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <SetupCardProgress progress={progress} statusHydrated={statusHydrated} />
    </CardHeader>
  );
}

const WRITTEN_TRACK_OPTIONS: {
  value: WrittenPracticeTrack;
  label: string;
  description: string;
}[] = [
  {
    value: "both",
    label: "Frontend and backend",
    description: "All written questions in the set.",
  },
  {
    value: "frontend",
    label: "Frontend only",
    description: "HTML, CSS, and JavaScript questions.",
  },
  {
    value: "backend",
    label: "Backend only",
    description: "Python and Django questions.",
  },
];

function WrittenTrackOption({
  id,
  value,
  label,
  description,
}: {
  id: string;
  value: WrittenPracticeTrack;
  label: string;
  description: string;
}) {
  return (
    <FieldLabel htmlFor={id} className="cursor-pointer">
      <Field orientation="horizontal" className="items-start">
        <RadioGroupItem id={id} value={value} className="mt-0.5" />
        <FieldContent>
          <FieldTitle>{label}</FieldTitle>
          <FieldDescription>{description}</FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  );
}

export function PracticeSetup({
  title,
  questionCount,
  config,
  onConfigChange,
  sessionStatus,
  statusHydrated = true,
  onContinue,
  onViewResults,
  onStart,
  onStartFresh,
  backHref,
  variant = "default",
}: PracticeSetupProps) {
  const isWritten = variant === "written";
  const progress = deriveSetupProgressDisplay(
    sessionStatus,
    questionCount,
    statusHydrated
  );

  function patch(partial: Partial<PracticeSessionConfig>) {
    onConfigChange({ ...config, ...partial });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            {questionCount} question{questionCount === 1 ? "" : "s"}
          </p>
        </div>
        {backHref ? (
          <LinkButton href={backHref} variant="outline">
            Back
          </LinkButton>
        ) : null}
      </div>

      {progress.showActions && statusHydrated ? (
        <div className="flex flex-wrap gap-2">
          {progress.completed ? (
            <Button type="button" onClick={onViewResults}>
              View results
            </Button>
          ) : (
            <Button type="button" onClick={onContinue}>
              Continue where you left off
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onStartFresh}>
            Start fresh
          </Button>
        </div>
      ) : null}

      {isWritten ? (
        <>
          <Card>
            <SetupCardHeader
              title="Session options"
              description="Choose which questions to practice and how the session runs."
              progress={progress}
              statusHydrated={statusHydrated}
            />
            <CardContent>
              <FieldGroup className="gap-4">
                <Field>
                  <FieldContent>
                    <FieldTitle>Question track</FieldTitle>
                    <FieldDescription>
                      Filter by frontend or backend lecture topics.
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroup
                    value={config.writtenTrack ?? "both"}
                    onValueChange={(value) =>
                      patch({
                        writtenTrack: value as WrittenPracticeTrack,
                      })
                    }
                    className="mt-2 gap-2"
                  >
                    {WRITTEN_TRACK_OPTIONS.map((option) => (
                      <WrittenTrackOption
                        key={option.value}
                        id={`written-track-${option.value}`}
                        value={option.value}
                        label={option.label}
                        description={option.description}
                      />
                    ))}
                  </RadioGroup>
                </Field>
                <SetupOption
                  id="written-shuffle-questions"
                  label="Shuffle question order"
                  description="Randomize the sequence of questions in this set."
                  checked={config.shuffleQuestions}
                  onCheckedChange={(checked) =>
                    patch({ shuffleQuestions: checked })
                  }
                />
                <SetupOption
                  id="written-show-timer"
                  label="Show session timer"
                  description="Floating elapsed timer with pause. Per-question thinking time is always recorded."
                  checked={config.showSessionTimer}
                  onCheckedChange={(checked) =>
                    patch({ showSessionTimer: checked })
                  }
                />
              </FieldGroup>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Coding practice with rubric checks</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                <li>Write your answer in the code editor.</li>
                <li>Check your answer to run the rubric and unlock preview when available.</li>
                <li>Review the model solution and explanation after checking.</li>
              </ul>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <SetupCardHeader
            title="Session options"
            description="Choose how you want to practice, then start when ready."
            progress={progress}
            statusHydrated={statusHydrated}
          />
          <CardContent>
            <FieldGroup className="gap-3">
              <SetupOption
                id="shuffle-questions"
                label="Shuffle question order"
                description="Randomize the sequence of questions in this set."
                checked={config.shuffleQuestions}
                onCheckedChange={(checked) =>
                  patch({ shuffleQuestions: checked })
                }
              />
              <SetupOption
                id="shuffle-mcq"
                label="Shuffle MCQ answer order"
                description="Randomize A/B/C/D for multiple choice only. True/false unchanged."
                checked={config.shuffleMcqOptions}
                onCheckedChange={(checked) =>
                  patch({ shuffleMcqOptions: checked })
                }
              />
              <SetupOption
                id="show-timer"
                label="Show session timer"
                description="Floating elapsed timer with pause. Per-question thinking time is always recorded."
                checked={config.showSessionTimer}
                onCheckedChange={(checked) =>
                  patch({ showSessionTimer: checked })
                }
              />
              <SetupOption
                id="exam-simulation"
                label="Exam simulation"
                description="No feedback until you submit. Only the question, answers, and Prev/Next. Results show answers and explanations."
                checked={config.examSimulation}
                onCheckedChange={(checked) =>
                  patch({ examSimulation: checked })
                }
              />
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {isWritten && questionCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          No questions match this track. Choose a different track to start
          practicing.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          size="lg"
          onClick={onStart}
          disabled={isWritten && questionCount === 0}
        >
          {sessionStatus ? "Start new session" : "Start practice"}
        </Button>
      </div>
    </div>
  );
}

export { DEFAULT_PRACTICE_SESSION_CONFIG };
