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
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

const CORRECT_ANSWER_YEAR_TABS = ["all", "2025", "2024", "2021", "2019"] as const;
const LECTURE_YIELD_MODES = ["unique", "all"] as const;

export function ExamAnalysisDashboard({ data }: { data: ExamAnalysisData }) {
  const { stats } = data;
  const [answerYear, setAnswerYear] = useState<string>("all");
  const [yieldMode, setYieldMode] = useState<(typeof LECTURE_YIELD_MODES)[number]>("unique");
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
  const chartLectures = lectureYieldRows.slice(0, 8).map((r) => ({
    name: `Ch ${r.slug.match(/chapter-(\d+)/)?.[1] ?? "?"}`,
    count: r.count,
    full: r.lecture,
  }));

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total questions" value={stats.totalQuestions} />
        <StatCard label="Lecture chapters" value={stats.lectures} />
        <StatCard label="Exam years" value={stats.exams} />
        <StatCard label="Repeated stems" value={stats.repetitive} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Exams at a glance"
          description="Question counts from 2019, 2021, 2024, and 2025 finals."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <CardDescription>Share of the combined pool</CardDescription>
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
            <CardDescription>True/false share per exam</CardDescription>
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
                  <Tooltip
                    formatter={(value) => [`${value ?? 0}%`, "T/F share"]}
                  />
                  <Bar dataKey="trueFalseShare" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </AnalysisChart>
            <p className="mt-3 text-xs text-muted-foreground">
              2024–2025 lean heavily toward MCQ; 2021 is an even split.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Correct answer distribution"
          description={`How often each option is the keyed correct answer for ${answerYearLabel}.`}
        />
        <Tabs value={answerYear} onValueChange={setAnswerYear}>
          <TabsList className="flex flex-wrap h-auto gap-1">
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
            title="Highest-yield chapters"
            description={
              yieldMode === "unique"
                ? `Chapters ranked by unique stems (${lectureYieldTotal} questions after deduplication).`
                : `Chapters ranked by every exam appearance (${lectureYieldTotal} total, including repeats).`
            }
          />
          <Tabs
            value={yieldMode}
            onValueChange={(value) =>
              setYieldMode(value as (typeof LECTURE_YIELD_MODES)[number])
            }
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
                  data={chartLectures}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={36} tick={{ fontSize: 11 }} />
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
                <TableHead>Chapter</TableHead>
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
          title="Questions per chapter by exam year"
          description="How each final samples the chapters."
        />
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chapter</TableHead>
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
                    <TableCell key={e.year} className="text-right tabular-nums text-muted-foreground">
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
            description={`${data.uniqueRepeatedStems} stems appear verbatim in more than one exam — strongest review priority.`}
          />
          <LinkButton href="/repetitive/">All repetitive questions</LinkButton>
          <LinkButton href="/practice/repetitive/" variant="outline">
            Practice repetitive set
          </LinkButton>
        </div>

        {data.fourExamHighlight ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-base">Appeared in all four exams</CardTitle>
              <CardDescription>{data.fourExamHighlight.topic}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm leading-relaxed">
                {data.fourExamHighlight.questionText}
              </p>
              <LinkButton
                href={repetitiveQuestionHref(data.fourExamHighlight.questionKey)}
                variant="outline"
                size="sm"
                className="w-fit"
              >
                View on repetitive page
              </LinkButton>
            </CardContent>
          </Card>
        ) : null}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28 text-right">Occurrences</TableHead>
                <TableHead>Years</TableHead>
                <TableHead className="w-16 text-center">Ch.</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="w-[88px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.repeatedStems.slice(0, 15).map((row) => (
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
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {row.chapterNumber ?? "—"}
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
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Chapter focus by exam year"
          description="Which chapters each year emphasized."
        />
        <Tabs defaultValue={data.examYears[0]?.year ?? "2019"}>
          <TabsList className="flex flex-wrap h-auto gap-1">
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
                      <TableHead>Chapter</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">T/F</TableHead>
                      <TableHead className="text-right">MCQ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.yearLectureBreakdown[e.year] ?? []).map((row) => (
                      <TableRow key={row.lecture}>
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
              label="T/F with negation traps"
              value={`${data.itemPatterns.trueFalseNegation} (${data.itemPatterns.trueFalseShare}% of T/F)`}
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
                  value={Math.round((theme.total / stats.totalQuestions) * 100)}
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
            <CardTitle className="text-lg">Study strategy</CardTitle>
            <CardDescription>Practical order based on this dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                Drill{" "}
                <Link href="/repetitive/" className="text-primary hover:underline">
                  repetitive stems
                </Link>{" "}
                first — especially anything that appeared in 3–4 exams.
              </li>
              <li>
                Weight chapters by pool size: Ch. 21 → 7 → 18 → 11 → 15 → 8 → 13 → 1; Ch. 2
                is minimal.
              </li>
              <li>
                For 2024–2025 style exams, practice MCQ advantage/disadvantage and
                completion-style stems.
              </li>
              <li>
                For T/F items, watch negation and swapped definitions (planning vs
                organizing, skill types).
              </li>
              <li>
                Use{" "}
                <Link href="/by-lecture/" className="text-primary hover:underline">
                  browse by lecture
                </Link>{" "}
                and filter mentally by exam year when simulating a specific final.
              </li>
              <li>
                Keep a one-page map of the four management functions and how exam wording
                labels them.
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Analysis generated {formatGeneratedAt(data.generatedAt)} from the synced question
        catalog.
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
