"use client";

import type { PracticeSessionStatus } from "@/lib/practice-session-pointer";
import type { PracticeSessionConfig } from "@/lib/practice-session-config";
import { DEFAULT_PRACTICE_SESSION_CONFIG } from "@/lib/practice-session-config";
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

function deriveProgressDisplay(
  sessionStatus: PracticeSessionStatus | null,
  questionCount: number
): {
  percent: number;
  statusTitle: string;
  statusDetail: string;
  centerLabel?: string;
  showActions: boolean;
  completed: boolean;
} {
  if (!sessionStatus) {
    return {
      percent: 0,
      statusTitle: "Not started",
      statusDetail: `0 of ${questionCount} answered`,
      showActions: false,
      completed: false,
    };
  }

  if (sessionStatus.kind === "completed") {
    return {
      percent: 100,
      statusTitle: "Completed",
      statusDetail: "You finished this practice set.",
      centerLabel: "Done",
      showActions: true,
      completed: true,
    };
  }

  return {
    percent: sessionStatus.percent,
    statusTitle: "In progress",
    statusDetail: `${sessionStatus.answered} of ${sessionStatus.total} question${
      sessionStatus.total === 1 ? "" : "s"
    } answered`,
    showActions: true,
    completed: false,
  };
}

function SetupCardProgress({
  progress,
  statusHydrated,
}: {
  progress: ReturnType<typeof deriveProgressDisplay>;
  statusHydrated: boolean;
}) {
  const ariaLabel = statusHydrated
    ? `${progress.statusTitle} — ${progress.statusDetail}`
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
  progress: ReturnType<typeof deriveProgressDisplay>;
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
  const progress = deriveProgressDisplay(sessionStatus, questionCount);

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
        <Card>
          <SetupCardHeader
            title="How it works"
            description="HTML coding practice"
            progress={progress}
            statusHydrated={statusHydrated}
          />
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Write your HTML in the code editor.</li>
              <li>Check your answer to run the rubric and unlock preview.</li>
              <li>Review the model solution and explanation after checking.</li>
            </ul>
          </CardContent>
        </Card>
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

      <div className="flex justify-end">
        <Button type="button" size="lg" onClick={onStart}>
          {sessionStatus ? "Start new session" : "Start practice"}
        </Button>
      </div>
    </div>
  );
}

export { DEFAULT_PRACTICE_SESSION_CONFIG };
