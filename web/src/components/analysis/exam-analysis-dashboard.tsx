"use client";

import { useState } from "react";
import type { ExamAnalysisData } from "@/lib/exam-analysis";
import { repetitiveQuestionHref } from "@/lib/exam-analysis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import Link from "next/link";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { AnalysisChart } from "./analysis-chart";

function formatGeneratedAt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function truncate(text: string, max = 72) {
  const line = text.split("\n")[0];
  if (line.length <= max) return line;
  return `${line.slice(0, max).trim()}…`;
}

const CORRECT_ANSWER_YEAR_TABS = ["all", "2025", "2024", "2021"] as const;
type LectureYieldMode = "unique" | "all";

function shortLectureName(name: string, max = 18) {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function ExamAnalysisDashboard({ data }: { data: ExamAnalysisData }) {
  const { stats } = data;
  const [answerYear, setAnswerYear] = useState<string>("all");
  const [yieldMode, setYieldMode] = useState<LectureYieldMode>("unique");
  const answerDistribution =
    data.correctAnswerDistributionByYear[answerYear] ??
    data.correctAnswerDistributionByYear.all;
  const answerYearLabel =
    answerYear === "all" ? "all exam questions" : `the ${answerYear} final`;
  const lectureYieldRows =
    yieldMode === "unique" ? data.lectureYield : data.lectureYieldAll;
  const lectureYieldTotal =
    yieldMode === "unique"
      ? data.lectureYieldTotals.unique
      : data.lectureYieldTotals.all;
  const topLectures = lectureYieldRows.slice(0, 8).map((r) => ({
    name: shortLectureName(r.lecture),
    count: r.count,
    full: r.lecture,
  }));
  const topStudyLectures = lectureYieldRows.slice(0, 5);
  const trackAllocationChart = data.trackAllocation.map((row) => ({
    label: row.label,
    frontendShare: row.frontendShare,
    backendShare: row.backendShare,
  }));

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unique questions" value={stats.totalQuestions} />
        <StatCard label="Exam instances" value={stats.totalExamInstances ?? 0} />
        <StatCard label="Lectures" value={stats.lectures} />
        <StatCard label="Repeated stems" value={stats.repetitive} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Frontend / backend allocation"
          description="Share of lecture topic hits per exam (same basis as mock exam weights). Questions mapped to multiple lectures count toward each track."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {data.trackAllocation.map((row) => (
            <TrackAllocationCard key={row.key} row={row} />
          ))}
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Compare allocation</CardTitle>
            <CardDescription>
              Frontend share across all exams, the mean of the three finals, and each year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalysisChart height={220}>
              {({ width, height }) => (
                <BarChart
                  width={width}
                  height={height}
                  data={trackAllocationChart}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value ?? 0}%`,
                      name === "frontendShare" ? "Frontend" : "Backend",
                    ]}
                  />
                  <Bar
                    dataKey="frontendShare"
                    stackId="track"
                    fill="hsl(var(--chart-1))"
                    radius={[0, 0, 0, 0]}
                    name="Frontend"
                  />
                  <Bar
                    dataKey="backendShare"
                    stackId="track"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                    name="Backend"
                  />
                </BarChart>
              )}
            </AnalysisChart>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Exams at a glance"
          description="Question counts from the 2021, 2024, and 2025 Web Technology finals."
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {data.examYears.map(({ year, count }) => (
            <Card key={year}>
              <CardHeader className="pb-2">
                <CardDescription>{year} final</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{count}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <LinkButton href={`/by-exam/${year}/`} variant="outline" size="sm">
                  Browse
                </LinkButton>
                <LinkButton
                  href={`/practice/exam/${year}/`}
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                >
                  Practice
                </LinkButton>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Question formats</CardTitle>
            <CardDescription>Share of all exam instances combined</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.typeMix.map((row) => (
              <div key={row.type} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.count} ({row.share}%)
                  </span>
                </div>
                <Progress value={row.share} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Format shift by year</CardTitle>
            <CardDescription>True/false share per final</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalysisChart height={220}>
              {({ width, height }) => (
                <BarChart
                  width={width}
                  height={height}
                  data={data.yearFormat}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(value) => [`${value ?? 0}%`, "T/F share"]} />
                  <Bar
                    dataKey="trueFalseShare"
                    fill="hsl(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </AnalysisChart>
            <p className="mt-3 text-xs text-muted-foreground">
              2024 and 2025 are MCQ-heavy; 2021 mixes more true/false with multiple choice.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Correct answer distribution"
          description={`How often each option is the keyed correct answer for ${answerYearLabel}.`}
        />
        <Tabs
          value={answerYear}
          onValueChange={(year) => {
            setAnswerYear(year);
            trackAnalyticsEvent(AnalyticsEvents.analysisFilterChange, {
              filter_type: "answer_year",
              filter_value: year,
            });
          }}
        >
          <TabsList className="flex h-auto flex-wrap gap-1">
            {CORRECT_ANSWER_YEAR_TABS.map((year) => (
              <TabsTrigger key={year} value={year}>
                {year === "all" ? "All" : year}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">True / false</CardTitle>
              <CardDescription>
                {answerDistribution.trueFalse.total} keyed T/F questions
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {answerDistribution.trueFalse.answers.map((row) => (
                <div key={row.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count} ({row.share}%)
                    </span>
                  </div>
                  <Progress value={row.share} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Multiple choice</CardTitle>
              <CardDescription>
                {answerDistribution.mcq.total} keyed MCQ questions (A–E by position)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {answerDistribution.mcq.answers.map((row) => (
                <div key={row.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count} ({row.share}%)
                    </span>
                  </div>
                  <Progress value={row.share} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            title="Highest-yield lectures"
            description={
              yieldMode === "unique"
                ? `Lectures ranked by unique stems (${lectureYieldTotal} questions after deduplication).`
                : `Lectures ranked by every exam appearance (${lectureYieldTotal} total, including repeats).`
            }
          />
          <Tabs
            value={yieldMode}
            onValueChange={(value) => {
              const mode = value as LectureYieldMode;
              setYieldMode(mode);
              trackAnalyticsEvent(AnalyticsEvents.analysisFilterChange, {
                filter_type: "lecture_yield_mode",
                filter_value: mode,
              });
            }}
          >
            <TabsList className="flex h-auto flex-wrap gap-1">
              <TabsTrigger value="unique">
                Unique ({data.lectureYieldTotals.unique})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({data.lectureYieldTotals.all})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Card>
          <CardContent className="pt-6">
            <AnalysisChart height={280}>
              {({ width, height }) => (
                <BarChart
                  width={width}
                  height={height}
                  data={topLectures}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.full ?? ""
                    }
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              )}
            </AnalysisChart>
          </CardContent>
        </Card>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Lecture</TableHead>
                <TableHead>Track</TableHead>
                <TableHead className="text-right">Questions</TableHead>
                <TableHead className="text-right">Share</TableHead>
                <TableHead className="w-[88px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lectureYieldRows.map((row) => (
                <TableRow key={row.slug}>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {row.rank}
                  </TableCell>
                  <TableCell className="font-medium">{row.lecture}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {row.track}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.share}%
                  </TableCell>
                  <TableCell>
                    <LinkButton
                      href={`/by-lecture/${row.slug}/`}
                      variant="outline"
                      size="sm"
                    >
                      View
                    </LinkButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Questions per lecture by exam year"
          description="How each final samples the lecture pool (questions may map to multiple lectures)."
        />
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lecture</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {data.examYears.map((e) => (
                  <TableHead key={e.year} className="text-right">
                    {e.year}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.poolByLecture.map((row) => (
                <TableRow key={row.slug}>
                  <TableCell className="max-w-[240px] font-medium">{row.lecture}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                  {data.examYears.map((e) => (
                    <TableCell
                      key={e.year}
                      className="text-right tabular-nums text-muted-foreground"
                    >
                      {row.byYear[e.year] ?? 0}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading
            title="Cross-exam repetition"
            description={
              data.uniqueRepeatedStems > 0
                ? `${data.uniqueRepeatedStems} stems repeat across finals with the same keyed answer.`
                : "No verbatim cross-exam repeats were detected with the current stem matcher."
            }
          />
          {data.uniqueRepeatedStems > 0 ? (
            <>
              <LinkButton href="/repetitive/">All repetitive questions</LinkButton>
              <LinkButton href="/practice/repetitive/" variant="outline">
                Practice repetitive set
              </LinkButton>
            </>
          ) : null}
        </div>

        {data.allExamsHighlight ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-base">Appeared in all three finals</CardTitle>
              <CardDescription>
                {data.allExamsHighlight.lectureLabels.join(" · ") ||
                  data.allExamsHighlight.topic}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm leading-relaxed">
                {truncate(data.allExamsHighlight.questionText, 200)}
              </p>
              <LinkButton
                href={repetitiveQuestionHref(data.allExamsHighlight.questionKey)}
                variant="outline"
                size="sm"
                className="w-fit"
              >
                View on repetitive page
              </LinkButton>
            </CardContent>
          </Card>
        ) : null}

        {data.repeatedStems.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 text-right">Occurrences</TableHead>
                  <TableHead>Years</TableHead>
                  <TableHead>Lectures</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="w-[88px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.repeatedStems.map((row) => (
                  <TableRow key={row.questionKey}>
                    <TableCell className="text-right font-medium tabular-nums">
                      {row.instanceCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.origins.map((o) => (
                          <Badge key={o} variant="secondary" className="text-xs">
                            {o}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] text-xs text-muted-foreground">
                      {row.lectureLabels.length
                        ? row.lectureLabels.join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-md text-sm">
                      {truncate(row.questionText)}
                    </TableCell>
                    <TableCell>
                      <LinkButton
                        href={repetitiveQuestionHref(row.questionKey)}
                        variant="outline"
                        size="sm"
                      >
                        View
                      </LinkButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Finals mostly reuse concepts with different wording. Prioritize high-yield
              lectures and thematic clusters instead of expecting large repeated-stem sets.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Lecture focus by exam year"
          description="Allocated lecture coverage emphasized in each final."
        />
        <Tabs defaultValue={data.examYears[0]?.year ?? "2021"}>
          <TabsList className="flex h-auto flex-wrap gap-1">
            {data.examYears.map((e) => (
              <TabsTrigger key={e.year} value={e.year}>
                {e.year}
              </TabsTrigger>
            ))}
          </TabsList>
          {data.examYears.map((e) => (
            <TabsContent key={e.year} value={e.year}>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lecture</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">T/F</TableHead>
                      <TableHead className="text-right">MCQ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.yearLectureBreakdown[e.year] ?? []).map((row) => (
                      <TableRow key={row.slug}>
                        <TableCell className="font-medium">{row.lecture}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {row.trueFalse}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {row.mcq}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Item patterns</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <PatternRow
              label="True / false"
              value={`${data.itemPatterns.trueFalse} (${data.typeMix.find((t) => t.type === "true_false")?.share ?? 0}%)`}
            />
            <PatternRow label="Multiple choice" value={String(data.itemPatterns.mcq)} />
            <PatternRow
              label="Fill-in-the-blank stems"
              value={String(data.itemPatterns.fillInBlank)}
            />
            <PatternRow
              label="T/F with negation wording"
              value={`${data.itemPatterns.trueFalseNegation} (${data.itemPatterns.trueFalseShare}% of T/F)`}
            />
            <PatternRow
              label="Shared code context blocks"
              value={String(data.itemPatterns.codeContext)}
            />
            <PatternRow
              label="Code answer choices"
              value={String(data.itemPatterns.codeOptions)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thematic coverage</CardTitle>
            <CardDescription>Keyword hits across all stems (may overlap)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.themes.slice(0, 8).map((theme) => (
              <div key={theme.theme} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span>{theme.theme}</span>
                  <span className="tabular-nums text-muted-foreground">{theme.total}</span>
                </div>
                <Progress
                  value={Math.round(
                    (theme.total / (stats.totalExamInstances ?? stats.totalQuestions)) * 100
                  )}
                  className="h-1.5"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Study priorities</CardTitle>
            <CardDescription>Practical order based on this Web Technology dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {data.uniqueRepeatedStems > 0 ? (
                <li>
                  Drill{" "}
                  <Link href="/repetitive/" className="text-primary hover:underline">
                    repetitive stems
                  </Link>{" "}
                  first — anything that appeared in multiple finals with the same answer.
                </li>
              ) : null}
              <li>
                Weight lectures by pool size:{" "}
                {topStudyLectures.map((l) => l.lecture).join(" → ")}.
              </li>
              <li>
                For 2024–2025 style exams, practice JavaScript output tracing, DOM APIs, and
                Django template/model questions.
              </li>
              <li>
                For 2021, review HTTP fundamentals and true/false traps around protocol
                definitions and caching headers.
              </li>
              <li>
                Use{" "}
                <Link href="/by-lecture/" className="text-primary hover:underline">
                  browse by lecture
                </Link>{" "}
                to drill one PDF track at a time, then simulate a full year with{" "}
                <Link href="/practice/" className="text-primary hover:underline">
                  practice by exam
                </Link>
                .
              </li>
              <li>
                Review code-context blocks carefully — {data.itemPatterns.codeContext} questions
                share a snippet and {data.itemPatterns.codeOptions} use code as answer choices.
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Analysis generated {formatGeneratedAt(data.generatedAt)} from the synced question
        catalog ({stats.totalExamInstances ?? 0} instances, {stats.totalQuestions} unique
        stems).
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function TrackAllocationCard({
  row,
}: {
  row: ExamAnalysisData["trackAllocation"][number];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{row.label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">
          {row.frontendShare}%
          <span className="text-base font-normal text-muted-foreground">
            {" "}
            / {row.backendShare}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="bg-[hsl(var(--chart-1))]"
            style={{ width: `${row.frontendShare}%` }}
          />
          <div
            className="bg-[hsl(var(--chart-2))]"
            style={{ width: `${row.backendShare}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {row.questionCount} questions · FE {row.frontendHits} / BE{" "}
          {row.backendHits} topic hits
        </p>
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PatternRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
