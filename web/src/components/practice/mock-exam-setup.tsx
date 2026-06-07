"use client";

import { useMemo, useState } from "react";
import type { MockExamSpec } from "@/lib/mock-exam";
import {
  getMockExamAllocationPreview,
  getMockExamMaxQuestionCount,
  MOCK_EXAM_MIN_QUESTION_COUNT,
  MOCK_EXAM_SEED_MAX,
  MOCK_EXAM_SEED_MIN,
  normalizeMockExamSpec,
  parseMockExamSeed,
  resolveMockQuestionCountInput,
} from "@/lib/mock-exam";
import type { PracticeSessionConfig } from "@/lib/practice-session-config";
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
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { LinkButton } from "@/components/ui/link-button";
import { PencilIcon } from "lucide-react";

type MockExamSetupProps = {
  spec: MockExamSpec;
  onSpecChange: (spec: MockExamSpec) => void;
  canResume: boolean;
  resumeAnswered: number;
  generatedCount: number;
  onStart: () => void;
  onResume: () => void;
  onStartFresh: () => void;
  onRegenerate: () => void;
  backHref?: string;
};

function LectureAllocationGroup({
  title,
  rows,
}: {
  title: string;
  rows: ReturnType<typeof getMockExamAllocationPreview>;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">{title}</p>
        <p>No lectures allocated at this track share.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-foreground">{title}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li
            key={row.slug}
            className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground"
          >
            <span className="min-w-0 truncate">{row.lecture}</span>
            <span className="shrink-0 tabular-nums">
              {row.historicalSharePercent}% → {row.targetSharePercent}% (
              {row.targetQuestions} Q)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockExamSeedField({
  seed,
  onSeedChange,
}: {
  seed: number;
  onSeedChange: (seed: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(seed));
  const parsedDraft = parseMockExamSeed(draft);

  function startEdit() {
    setDraft(String(seed));
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(String(seed));
    setEditing(false);
  }

  function applyEdit() {
    if (parsedDraft == null) return;
    onSeedChange(parsedDraft);
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      {editing ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="shrink-0">Seed:</span>
          <Input
            id="mock-exam-seed"
            type="number"
            min={MOCK_EXAM_SEED_MIN}
            max={MOCK_EXAM_SEED_MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            className="h-7 w-36 font-mono text-xs"
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7"
            disabled={parsedDraft == null}
            onClick={applyEdit}
          >
            Apply
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={cancelEdit}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <p className="min-w-0 flex-1">
            Seed: <span className="font-mono text-foreground">{seed}</span>
            {" · "}
            Regenerate to draw a new random exam with the same settings.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label="Edit seed"
            onClick={startEdit}
          >
            <PencilIcon className="size-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

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

export function MockExamSetup({
  spec,
  onSpecChange,
  canResume,
  resumeAnswered,
  generatedCount,
  onStart,
  onResume,
  onStartFresh,
  onRegenerate,
  backHref,
}: MockExamSetupProps) {
  const maxCount = getMockExamMaxQuestionCount();
  const { config } = spec;
  const [pendingFrontendShare, setPendingFrontendShare] = useState<number | null>(
    null
  );
  const [questionCountDraft, setQuestionCountDraft] = useState<string | null>(
    null
  );
  const frontendShare = pendingFrontendShare ?? spec.frontendShare;

  const previewSpec = useMemo(
    () =>
      normalizeMockExamSpec({
        ...spec,
        frontendShare,
        backendShare: 100 - frontendShare,
      }),
    [spec, frontendShare]
  );

  const lectureAllocation = useMemo(
    () => getMockExamAllocationPreview(previewSpec),
    [previewSpec]
  );

  const frontendLectures = lectureAllocation.filter((row) => row.track === "frontend");
  const backendLectures = lectureAllocation.filter((row) => row.track === "backend");

  function patchSpec(partial: Partial<MockExamSpec>) {
    onSpecChange(normalizeMockExamSpec({ ...spec, ...partial }));
  }

  function commitFrontendShare(fe: number) {
    patchSpec({ frontendShare: fe, backendShare: 100 - fe });
  }

  function commitQuestionCount() {
    const raw = questionCountDraft ?? String(spec.questionCount);
    setQuestionCountDraft(null);
    patchSpec({ questionCount: resolveMockQuestionCountInput(raw) });
  }

  function patchConfig(partial: Partial<PracticeSessionConfig>) {
    patchSpec({ config: { ...config, ...partial } });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mock exam</h1>
          <p className="text-muted-foreground">
            Synthetic exam from historical lecture allocation across past finals.
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
          <CardTitle>Exam composition</CardTitle>
          <CardDescription>
            Question mix follows averaged lecture shares from 2021, 2024, and
            2025, scaled by the track sliders below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="mock-question-count">Question count</FieldLabel>
            <Input
              id="mock-question-count"
              type="number"
              min={MOCK_EXAM_MIN_QUESTION_COUNT}
              max={maxCount}
              value={questionCountDraft ?? String(spec.questionCount)}
              onChange={(e) => setQuestionCountDraft(e.target.value)}
              onBlur={commitQuestionCount}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Between {MOCK_EXAM_MIN_QUESTION_COUNT} and {maxCount} questions.
              Preview: {generatedCount} generated for the current seed.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium">Frontend</span>
              <span className="tabular-nums text-muted-foreground">
                {frontendShare}% / {100 - frontendShare}% Backend
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[frontendShare]}
              onValueChange={(value) => {
                const values = Array.isArray(value) ? value : [value];
                const fe = Math.round(values[0] ?? frontendShare);
                setPendingFrontendShare(fe);
              }}
              onValueCommitted={(value) => {
                const values = Array.isArray(value) ? value : [value];
                const fe = Math.round(values[0] ?? frontendShare);
                commitFrontendShare(fe);
                setPendingFrontendShare(null);
              }}
            />
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-medium text-foreground">
                Lecture allocation (historical average → this exam)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <LectureAllocationGroup
                  title="Frontend"
                  rows={frontendLectures}
                />
                <LectureAllocationGroup title="Backend" rows={backendLectures} />
              </div>
            </div>
          </div>

          <MockExamSeedField
            seed={spec.seed}
            onSeedChange={(seed) => patchSpec({ seed })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session options</CardTitle>
          <CardDescription>
            Question and answer order are always shuffled for mock exams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-3">
            <SetupOption
              id="mock-show-timer"
              label="Show session timer"
              description="Floating elapsed timer with pause."
              checked={config.showSessionTimer}
              onCheckedChange={(checked) =>
                patchConfig({ showSessionTimer: checked })
              }
            />
            <SetupOption
              id="mock-exam-simulation"
              label="Exam simulation"
              description="No feedback until you submit. Results show answers and explanations."
              checked={config.examSimulation}
              onCheckedChange={(checked) =>
                patchConfig({ examSimulation: checked })
              }
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {canResume ? (
        <div className="w-full rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 ring-1 ring-primary/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-snug">
              In-progress session found ({resumeAnswered}/{generatedCount}{" "}
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

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onRegenerate}>
          Regenerate exam
        </Button>
        <Button type="button" size="lg" onClick={onStart}>
          Start practice
        </Button>
      </div>
    </div>
  );
}
