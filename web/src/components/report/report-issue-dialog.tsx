"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { getExamYears, getLectureSlugs } from "@/lib/questions";
import {
  BUG_ISSUE_TYPES,
  CODE_EXAMPLES_LECTURE_IDS,
  ISSUE_TYPE_WRONG_ANSWER,
  ISSUE_TYPES,
  REPORT_HUB_LOCATIONS,
  buildCodeExampleReportContext,
  buildMockExamReportContext,
  buildReportFormUrl,
  collectDeviceInfo,
  deriveCodeExamplesScopeFromPathname,
  deriveReportContext,
  enrichReportDescription,
  formatMockExamDetails,
  formatReportCodeExampleSummary,
  formatReportMockExamSummary,
  formatReportQuestionSummary,
  resolveLocationPageUrl,
  type CodeExamplesScope,
  type IssueType,
  type OpenReportIssueOptions,
  type ReportLocationId,
} from "@/lib/report-issue";
import { useReportIssue } from "@/components/report/report-issue-context";
import { Button } from "@/components/ui/button";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const LOCATION_OPTIONS: Array<{ value: ReportLocationId; label: string }> = [
  { value: "this_page", label: "This page" },
  ...REPORT_HUB_LOCATIONS.map((h) => ({ value: h.id, label: h.label })),
  { value: "code_examples", label: "Code examples" },
  { value: "mock_exam", label: "Mock exam" },
  { value: "by_exam", label: "By exam" },
  { value: "by_lecture", label: "By lecture" },
];

function locationLabel(id: ReportLocationId): string {
  return LOCATION_OPTIONS.find((opt) => opt.value === id)?.label ?? "Select location";
}

function examScopeLabel(scope: "general" | "year"): string {
  return scope === "general" ? "General (all exams)" : "Specific year";
}

function lectureScopeLabel(scope: "general" | "lecture"): string {
  return scope === "general" ? "General (all lectures)" : "Specific lecture";
}

function codeExamplesScopeLabel(scope: CodeExamplesScope): string {
  if (scope === "general") return "General (frontend lectures hub)";
  if (scope === "fe-4") return "CSS (fe-4)";
  if (scope === "fe-5") return "JavaScript 1 (fe-5)";
  return "JavaScript 2 (fe-6)";
}

const REPORT_SELECT_TRIGGER = "w-full min-w-0";

const REPORT_SELECT_CONTENT = "max-h-56";

function ReportSelectContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <SelectContent
      side="bottom"
      align="start"
      sideOffset={4}
      alignItemWithTrigger={false}
      positionMethod="fixed"
      collisionAvoidance={{
        side: "none",
        align: "shift",
        fallbackAxisSide: "none",
      }}
      positionerClassName="z-[100]"
      className={cn(REPORT_SELECT_CONTENT, className)}
    >
      {children}
    </SelectContent>
  );
}

const REPORT_SELECT_ITEM_WRAP =
  "items-start py-2.5 *:whitespace-normal *:text-pretty";

function ReportField({
  id,
  label,
  required = false,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

function ReportSubFields({ children }: { children: ReactNode }) {
  return (
    <div className="ml-0.5 flex flex-col gap-3 border-l-2 border-border/70 pl-4">
      {children}
    </div>
  );
}

export function ReportIssueDialog() {
  const { open, sessionId, options, closeReportIssue } = useReportIssue();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeReportIssue()}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {open ? (
          <ReportIssueForm
            key={sessionId}
            options={options}
            onClose={closeReportIssue}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ReportIssueForm({
  options,
  onClose,
}: {
  options: OpenReportIssueOptions;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPageUrl = useMemo(() => {
    const search = searchParams.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);

  const lockedQuestion = options.question;
  const lockedCodeExample = options.codeExample;
  const lockedMockExamSpec = options.mockExamSpec;
  const hasLockedTarget = Boolean(
    lockedQuestion || lockedCodeExample || lockedMockExamSpec
  );
  const examYears = useMemo(() => getExamYears(), []);
  const lectureSlugs = useMemo(() => getLectureSlugs(), []);

  const [locationId, setLocationId] = useState<ReportLocationId>("this_page");
  const [codeExamplesScope, setCodeExamplesScope] = useState<CodeExamplesScope>(
    () => deriveCodeExamplesScopeFromPathname(pathname)
  );
  const [byExamScope, setByExamScope] = useState<"general" | "year">("general");
  const [selectedExamYear, setSelectedExamYear] = useState(
    () => lockedQuestion?.origin ?? examYears[0] ?? ""
  );
  const [byLectureScope, setByLectureScope] = useState<"general" | "lecture">(
    "general"
  );
  const [selectedLectureSlug, setSelectedLectureSlug] = useState(
    () => lockedQuestion?.lectureSlug ?? lectureSlugs[0]?.slug ?? ""
  );
  const [issueType, setIssueType] = useState<IssueType | "">(
    () => options.issueType ?? ""
  );
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [steps, setSteps] = useState("");

  useEffect(() => {
    trackAnalyticsEvent(AnalyticsEvents.issueReportOpen, {
      has_question_key: Boolean(lockedQuestion?.questionKey),
      report_context: lockedCodeExample
        ? buildCodeExampleReportContext(lockedCodeExample)
        : lockedMockExamSpec
          ? buildMockExamReportContext(lockedMockExamSpec)
          : deriveReportContext(pathname),
    });
  }, [lockedCodeExample, lockedMockExamSpec, lockedQuestion?.questionKey, pathname]);

  const resolvedLocation = useMemo(() => {
    if (options.pageUrl) {
      const pagePath = options.pageUrl.split("?")[0] ?? options.pageUrl;
      return {
        ...resolveLocationPageUrl("this_page", options.pageUrl),
        pageUrl: options.pageUrl,
        reportContext: deriveReportContext(pagePath),
      };
    }

    const location = resolveLocationPageUrl(locationId, currentPageUrl, {
      byExamScope,
      examYear: selectedExamYear,
      byLectureScope,
      lectureSlug: selectedLectureSlug,
      codeExamplesScope,
    });
    const pagePath = location.pageUrl.split("?")[0] ?? location.pageUrl;

    return {
      ...location,
      reportContext: deriveReportContext(pagePath),
    };
  }, [
    options.pageUrl,
    locationId,
    currentPageUrl,
    byExamScope,
    selectedExamYear,
    byLectureScope,
    selectedLectureSlug,
    codeExamplesScope,
  ]);

  const showExpectedAnswer = issueType === ISSUE_TYPE_WRONG_ANSWER;
  const showSteps =
    issueType !== "" && BUG_ISSUE_TYPES.has(issueType as IssueType);
  const canSubmit = issueType !== "" && description.trim().length > 0;
  const questionSummary = lockedQuestion
    ? formatReportQuestionSummary(lockedQuestion)
    : null;
  const codeExampleSummary = lockedCodeExample
    ? formatReportCodeExampleSummary(lockedCodeExample)
    : null;
  const mockExamSummary = lockedMockExamSpec
    ? formatReportMockExamSummary(lockedMockExamSpec)
    : null;

  function handleSubmit() {
    if (!canSubmit) return;

    const pageUrl = options.pageUrl ?? resolvedLocation.pageUrl;
    const pagePath = pageUrl.split("?")[0] ?? pageUrl;
    const issueScope = hasLockedTarget
      ? "specific"
      : resolvedLocation.issueScope;
    const reportContext = lockedCodeExample
      ? buildCodeExampleReportContext(lockedCodeExample)
      : lockedMockExamSpec
        ? buildMockExamReportContext(lockedMockExamSpec)
        : deriveReportContext(pagePath);

    const url = buildReportFormUrl({
      issueType,
      description: enrichReportDescription(description.trim(), {
        codeExample: lockedCodeExample,
        mockExamSpec: lockedMockExamSpec,
      }),
      contactEmail: contactEmail.trim() || undefined,
      expectedAnswer: expectedAnswer.trim() || undefined,
      steps: steps.trim() || undefined,
      pageUrl,
      issueScope,
      reportContext,
      questionKey: lockedQuestion?.questionKey,
      examYear: lockedQuestion?.origin ?? resolvedLocation.examYear,
      lectureSlug:
        lockedCodeExample?.lectureId ??
        lockedQuestion?.lectureSlug ??
        resolvedLocation.lectureSlug,
      codeExampleId: lockedCodeExample?.id,
      codeExampleFile: lockedCodeExample?.file,
      mockExamDetails: lockedMockExamSpec
        ? formatMockExamDetails(lockedMockExamSpec)
        : undefined,
      deviceInfo: collectDeviceInfo(),
      timestamp: new Date().toISOString(),
    });

    trackAnalyticsEvent(AnalyticsEvents.issueReportSubmit, {
      issue_type: issueType,
      issue_scope: issueScope,
      report_context: reportContext,
      has_question_key: Boolean(lockedQuestion?.questionKey),
    });

    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <>
      <DialogHeader className="gap-1.5 border-b px-4 py-4 pr-14">
        <DialogTitle>Report an issue</DialogTitle>
        <DialogDescription>
          Describe the problem. We&apos;ll open a Google Form with your details
          pre-filled — review and submit there.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 py-4">
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Where is the issue?</h3>

          {lockedQuestion ? (
            <div className="rounded-lg border bg-muted/30 px-3 py-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Reporting about
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {questionSummary?.headline}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {questionSummary?.subtitle}
              </p>
              {mockExamSummary ? (
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {mockExamSummary.headline} · {mockExamSummary.subtitle}
                </p>
              ) : null}
            </div>
          ) : lockedCodeExample ? (
            <div className="rounded-lg border bg-muted/30 px-3 py-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Reporting about
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {codeExampleSummary?.headline}
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {codeExampleSummary?.subtitle}
              </p>
            </div>
          ) : lockedMockExamSpec ? (
            <div className="rounded-lg border bg-muted/30 px-3 py-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Reporting about
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {mockExamSummary?.headline}
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {mockExamSummary?.subtitle}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ReportField id="report-location" label="Location" required>
                <Select
                  value={locationId}
                  onValueChange={(v) => setLocationId(v as ReportLocationId)}
                >
                  <SelectTrigger id="report-location" className={REPORT_SELECT_TRIGGER}>
                    <SelectValue>{locationLabel(locationId)}</SelectValue>
                  </SelectTrigger>
                  <ReportSelectContent>
                    <SelectItem value="this_page">This page</SelectItem>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Site pages</SelectLabel>
                      {REPORT_HUB_LOCATIONS.map((hub) => (
                        <SelectItem key={hub.id} value={hub.id}>
                          {hub.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Materials</SelectLabel>
                      <SelectItem value="code_examples">Code examples</SelectItem>
                      <SelectItem value="mock_exam">Mock exam</SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Browse</SelectLabel>
                      <SelectItem value="by_exam">By exam</SelectItem>
                      <SelectItem value="by_lecture">By lecture</SelectItem>
                    </SelectGroup>
                  </ReportSelectContent>
                </Select>
              </ReportField>

              {locationId === "by_exam" ? (
                <ReportSubFields>
                  <ReportField id="report-exam-scope" label="Exam scope">
                    <Select
                      value={byExamScope}
                      onValueChange={(v) =>
                        setByExamScope(v as "general" | "year")
                      }
                    >
                      <SelectTrigger id="report-exam-scope" className={REPORT_SELECT_TRIGGER}>
                        <SelectValue>{examScopeLabel(byExamScope)}</SelectValue>
                      </SelectTrigger>
                      <ReportSelectContent>
                        <SelectItem value="general">General (all exams)</SelectItem>
                        <SelectItem value="year">Specific year</SelectItem>
                      </ReportSelectContent>
                    </Select>
                  </ReportField>
                  {byExamScope === "year" ? (
                    <ReportField id="report-exam-year" label="Exam year">
                      <Select
                        value={selectedExamYear}
                        onValueChange={(v) => v && setSelectedExamYear(v)}
                      >
                        <SelectTrigger id="report-exam-year" className={REPORT_SELECT_TRIGGER}>
                          <SelectValue>
                            {selectedExamYear
                              ? `${selectedExamYear} Final`
                              : "Select year"}
                          </SelectValue>
                        </SelectTrigger>
                        <ReportSelectContent>
                          {examYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year} Final
                            </SelectItem>
                          ))}
                        </ReportSelectContent>
                      </Select>
                    </ReportField>
                  ) : null}
                </ReportSubFields>
              ) : null}

              {locationId === "code_examples" ? (
                <ReportSubFields>
                  <ReportField id="report-code-scope" label="Code examples scope">
                    <Select
                      value={codeExamplesScope}
                      onValueChange={(v) =>
                        setCodeExamplesScope(v as CodeExamplesScope)
                      }
                    >
                      <SelectTrigger
                        id="report-code-scope"
                        className={REPORT_SELECT_TRIGGER}
                      >
                        <SelectValue>
                          {codeExamplesScopeLabel(codeExamplesScope)}
                        </SelectValue>
                      </SelectTrigger>
                      <ReportSelectContent>
                        <SelectItem value="general">
                          General (frontend lectures hub)
                        </SelectItem>
                        {CODE_EXAMPLES_LECTURE_IDS.map((lectureId) => (
                          <SelectItem key={lectureId} value={lectureId}>
                            {codeExamplesScopeLabel(lectureId)}
                          </SelectItem>
                        ))}
                      </ReportSelectContent>
                    </Select>
                  </ReportField>
                </ReportSubFields>
              ) : null}

              {locationId === "by_lecture" ? (
                <ReportSubFields>
                  <ReportField id="report-lecture-scope" label="Lecture scope">
                    <Select
                      value={byLectureScope}
                      onValueChange={(v) =>
                        setByLectureScope(v as "general" | "lecture")
                      }
                    >
                      <SelectTrigger
                        id="report-lecture-scope"
                        className={REPORT_SELECT_TRIGGER}
                      >
                        <SelectValue>{lectureScopeLabel(byLectureScope)}</SelectValue>
                      </SelectTrigger>
                      <ReportSelectContent>
                        <SelectItem value="general">General (all lectures)</SelectItem>
                        <SelectItem value="lecture">Specific lecture</SelectItem>
                      </ReportSelectContent>
                    </Select>
                  </ReportField>
                  {byLectureScope === "lecture" ? (
                    <ReportField id="report-lecture" label="Lecture">
                      <Select
                        value={selectedLectureSlug}
                        onValueChange={(v) => v && setSelectedLectureSlug(v)}
                      >
                        <SelectTrigger id="report-lecture" className={REPORT_SELECT_TRIGGER}>
                          <SelectValue>
                            {lectureSlugs.find((lec) => lec.slug === selectedLectureSlug)
                              ?.lecture ?? "Select lecture"}
                          </SelectValue>
                        </SelectTrigger>
                        <ReportSelectContent>
                          {lectureSlugs.map((lec) => (
                            <SelectItem
                              key={lec.slug}
                              value={lec.slug}
                              className={REPORT_SELECT_ITEM_WRAP}
                            >
                              {lec.lecture}
                            </SelectItem>
                          ))}
                        </ReportSelectContent>
                      </Select>
                    </ReportField>
                  ) : null}
                </ReportSubFields>
              ) : null}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Issue details</h3>

          <ReportField id="report-issue-type" label="Issue type" required>
            <Select
              value={issueType}
              onValueChange={(v) => setIssueType(v as IssueType)}
            >
              <SelectTrigger id="report-issue-type" className={REPORT_SELECT_TRIGGER}>
                <SelectValue>
                  {issueType || "Select issue type"}
                </SelectValue>
              </SelectTrigger>
              <ReportSelectContent>
                {ISSUE_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className={REPORT_SELECT_ITEM_WRAP}>
                    {type}
                  </SelectItem>
                ))}
              </ReportSelectContent>
            </Select>
          </ReportField>

          <ReportField id="report-description" label="Description" required>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What went wrong? Include as much detail as you can."
              rows={4}
            />
          </ReportField>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-medium text-muted-foreground">Optional</h3>

          <ReportField id="report-email" label="Contact email">
            <Input
              id="report-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </ReportField>

          {showExpectedAnswer ? (
            <ReportField id="report-expected" label="Expected correct answer">
              <Textarea
                id="report-expected"
                value={expectedAnswer}
                onChange={(e) => setExpectedAnswer(e.target.value)}
                placeholder="What should the correct answer be?"
                rows={2}
              />
            </ReportField>
          ) : null}

          {showSteps ? (
            <ReportField id="report-steps" label="Steps to reproduce">
              <Textarea
                id="report-steps"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="1. Go to… 2. Click… 3. See error…"
                rows={3}
              />
            </ReportField>
          ) : null}
        </section>
      </div>

      <DialogFooter className="mx-0 mb-0 flex-row items-center justify-end gap-3 border-t bg-background px-4 py-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          Submit report
        </Button>
      </DialogFooter>
    </>
  );
}
