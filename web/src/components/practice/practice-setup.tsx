"use client";

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

type PracticeSetupProps = {
  title: string;
  questionCount: number;
  config: PracticeSessionConfig;
  onConfigChange: (config: PracticeSessionConfig) => void;
  canResume: boolean;
  resumeAnswered: number;
  onStart: () => void;
  onResume: () => void;
  onStartFresh: () => void;
  backHref?: string;
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

export function PracticeSetup({
  title,
  questionCount,
  config,
  onConfigChange,
  canResume,
  resumeAnswered,
  onStart,
  onResume,
  onStartFresh,
  backHref,
}: PracticeSetupProps) {
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

      <Card>
        <CardHeader>
          <CardTitle>Session options</CardTitle>
          <CardDescription>
            Choose how you want to practice, then start when ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-3">
            <SetupOption
              id="shuffle-questions"
              label="Shuffle question order"
              description="Randomize the sequence of questions in this set."
              checked={config.shuffleQuestions}
              onCheckedChange={(checked) => patch({ shuffleQuestions: checked })}
            />
            <SetupOption
              id="shuffle-mcq"
              label="Shuffle MCQ answer order"
              description="Randomize A/B/C/D for multiple choice only. True/false unchanged."
              checked={config.shuffleMcqOptions}
              onCheckedChange={(checked) => patch({ shuffleMcqOptions: checked })}
            />
            <SetupOption
              id="show-timer"
              label="Show session timer"
              description="Floating elapsed timer with pause. Per-question thinking time is always recorded."
              checked={config.showSessionTimer}
              onCheckedChange={(checked) => patch({ showSessionTimer: checked })}
              disabled={config.examSimulation}
            />
            <SetupOption
              id="exam-simulation"
              label="Exam simulation"
              description="No feedback until you submit. Only the question, answers, and Prev/Next. Results show answers and explanations."
              checked={config.examSimulation}
              onCheckedChange={(checked) =>
                patch({
                  examSimulation: checked,
                  showSessionTimer: checked ? false : config.showSessionTimer,
                })
              }
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {canResume ? (
        <div className="w-full rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 ring-1 ring-primary/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-snug">
              In-progress session found ({resumeAnswered}/{questionCount}{" "}
              answered).
            </p>
            <div className="flex shrink-0 gap-2 sm:justify-end">
              <Button type="button" variant="outline" size="sm" onClick={onStartFresh}>
                Start fresh
              </Button>
              <Button type="button" size="sm" onClick={onResume}>
                Resume
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="button" size="lg" onClick={onStart}>
          Start practice
        </Button>
      </div>
    </div>
  );
}

export { DEFAULT_PRACTICE_SESSION_CONFIG };
