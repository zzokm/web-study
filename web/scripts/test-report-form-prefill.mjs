/**
 * Verifies report form prefill URLs for all feature scenarios.
 * Run: node scripts/test-report-form-prefill.mjs
 */

import {
  ISSUE_TYPES,
  REPORT_FORM_ENTRIES,
  buildCodeExampleReportContext,
  buildMockExamReportContext,
  buildReportFormUrl,
  deriveReportContext,
  deriveScopeFromPathname,
  enrichReportDescription,
  formatMockExamDetails,
  resolveLocationPageUrl,
} from "../src/lib/report-issue.ts";

const MOCK_SPEC = {
  version: 1,
  seed: 123456789,
  questionCount: 84,
  frontendShare: 70,
  backendShare: 30,
  config: {
    shuffleQuestions: true,
    shuffleMcqOptions: true,
    showSessionTimer: true,
    examSimulation: true,
  },
};

const CODE_EXAMPLE = {
  id: "fe-6-promise-basic",
  file: "200.html",
  title: "Promise basics",
  lectureId: "fe-6",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectEntry(url, entryId, expectedValue, label) {
  const params = new URL(url).searchParams;
  const key = `entry.${entryId}`;
  const actual = params.get(key);
  assert(
    actual === expectedValue,
    `${label}: expected ${key}=${JSON.stringify(expectedValue)}, got ${JSON.stringify(actual)}`
  );
}

function expectHasEntry(url, entryId, label) {
  const params = new URL(url).searchParams;
  assert(
    params.has(`entry.${entryId}`),
    `${label}: missing entry.${entryId}`
  );
}

function expectNoEntry(url, entryId, label) {
  const params = new URL(url).searchParams;
  assert(
    !params.has(`entry.${entryId}`),
    `${label}: should not include entry.${entryId}`
  );
}

function buildBase(overrides) {
  return buildReportFormUrl({
    issueType: "Other Technical Bug or Feedback",
    description: "Test description",
    pageUrl: "/",
    issueScope: "general",
    reportContext: "home",
    deviceInfo: "test-agent",
    timestamp: "2026-06-07T12:00:00.000Z",
    ...overrides,
  });
}

console.log("Checking REPORT_FORM_ENTRIES are wired…");
for (const [name, id] of Object.entries(REPORT_FORM_ENTRIES)) {
  assert(id && String(id).trim(), `REPORT_FORM_ENTRIES.${name} is empty`);
}

console.log("Checking ISSUE_TYPES count matches form (10)…");
assert(ISSUE_TYPES.length === 10, `Expected 10 issue types, got ${ISSUE_TYPES.length}`);

const scenarios = [
  {
    name: "Home — general",
    url: buildBase({ reportContext: "home" }),
    checks: (url) => {
      expectEntry(url, REPORT_FORM_ENTRIES.pageUrl, "/", "pageUrl");
      expectEntry(url, REPORT_FORM_ENTRIES.reportContext, "home", "reportContext");
      expectNoEntry(url, REPORT_FORM_ENTRIES.codeExampleId, "codeExampleId");
      expectNoEntry(url, REPORT_FORM_ENTRIES.mockExamDetails, "mockExamDetails");
    },
  },
  {
    name: "Code example card",
    url: buildReportFormUrl({
      issueType: "Incorrect Code Example Explanation",
      description: enrichReportDescription("Explanation is wrong", {
        codeExample: CODE_EXAMPLE,
      }),
      pageUrl: "/code-examples/fe-6/",
      issueScope: "specific",
      reportContext: buildCodeExampleReportContext(CODE_EXAMPLE),
      lectureSlug: "fe-6",
      codeExampleId: CODE_EXAMPLE.id,
      codeExampleFile: CODE_EXAMPLE.file,
      deviceInfo: "test",
      timestamp: "2026-06-07T12:00:00.000Z",
    }),
    checks: (url) => {
      expectEntry(
        url,
        REPORT_FORM_ENTRIES.issueType,
        "Incorrect Code Example Explanation",
        "issueType"
      );
      expectEntry(url, REPORT_FORM_ENTRIES.codeExampleId, CODE_EXAMPLE.id, "codeExampleId");
      expectEntry(url, REPORT_FORM_ENTRIES.codeExampleFile, CODE_EXAMPLE.file, "codeExampleFile");
      expectEntry(url, REPORT_FORM_ENTRIES.lectureSlug, "fe-6", "lectureSlug");
      expectEntry(
        url,
        REPORT_FORM_ENTRIES.reportContext,
        "code_examples:fe-6:fe-6-promise-basic",
        "reportContext"
      );
      expectHasEntry(url, REPORT_FORM_ENTRIES.description, "description");
      expectNoEntry(url, REPORT_FORM_ENTRIES.mockExamDetails, "mockExamDetails");
    },
  },
  {
    name: "Mock exam setup",
    url: buildReportFormUrl({
      issueType: "Mock Exam Generation Issue",
      description: enrichReportDescription("Wrong allocation", {
        mockExamSpec: MOCK_SPEC,
      }),
      pageUrl: "/practice/mock-exam/",
      issueScope: "specific",
      reportContext: buildMockExamReportContext(MOCK_SPEC),
      mockExamDetails: formatMockExamDetails(MOCK_SPEC),
      deviceInfo: "test",
      timestamp: "2026-06-07T12:00:00.000Z",
    }),
    checks: (url) => {
      expectEntry(
        url,
        REPORT_FORM_ENTRIES.issueType,
        "Mock Exam Generation Issue",
        "issueType"
      );
      expectEntry(
        url,
        REPORT_FORM_ENTRIES.mockExamDetails,
        formatMockExamDetails(MOCK_SPEC),
        "mockExamDetails"
      );
      expectEntry(
        url,
        REPORT_FORM_ENTRIES.reportContext,
        "mock_exam:123456789:84:70",
        "reportContext"
      );
      expectNoEntry(url, REPORT_FORM_ENTRIES.codeExampleId, "codeExampleId");
    },
  },
  {
    name: "Mock exam question + spec",
    url: buildReportFormUrl({
      issueType: "Wrong Answer Key/Incorrect Data",
      description: enrichReportDescription("Answer should be B", {
        mockExamSpec: MOCK_SPEC,
      }),
      pageUrl: "/practice/mock-exam/",
      issueScope: "specific",
      reportContext: buildMockExamReportContext(MOCK_SPEC),
      questionKey: "2024-fe-1-q12",
      mockExamDetails: formatMockExamDetails(MOCK_SPEC),
      deviceInfo: "test",
      timestamp: "2026-06-07T12:00:00.000Z",
    }),
    checks: (url) => {
      expectEntry(url, REPORT_FORM_ENTRIES.questionKey, "2024-fe-1-q12", "questionKey");
      expectHasEntry(url, REPORT_FORM_ENTRIES.mockExamDetails, "mockExamDetails");
      expectNoEntry(url, REPORT_FORM_ENTRIES.expectedAnswer, "expectedAnswer");
    },
  },
  {
    name: "Location picker — code examples fe-5",
    url: (() => {
      const loc = resolveLocationPageUrl("code_examples", "/analysis/", {
        codeExamplesScope: "fe-5",
      });
      return buildBase({
        pageUrl: loc.pageUrl,
        issueScope: loc.issueScope,
        lectureSlug: loc.lectureSlug,
        reportContext: deriveReportContext(loc.pageUrl),
      });
    })(),
    checks: (url) => {
      expectEntry(url, REPORT_FORM_ENTRIES.pageUrl, "/code-examples/fe-5/", "pageUrl");
      expectEntry(url, REPORT_FORM_ENTRIES.lectureSlug, "fe-5", "lectureSlug");
      expectEntry(url, REPORT_FORM_ENTRIES.reportContext, "code_examples_fe-5", "reportContext");
    },
  },
  {
    name: "Location picker — mock exam",
    url: (() => {
      const loc = resolveLocationPageUrl("mock_exam", "/");
      return buildBase({
        pageUrl: loc.pageUrl,
        issueScope: loc.issueScope,
        reportContext: deriveReportContext(loc.pageUrl),
      });
    })(),
    checks: (url) => {
      expectEntry(url, REPORT_FORM_ENTRIES.pageUrl, "/practice/mock-exam/", "pageUrl");
      expectEntry(url, REPORT_FORM_ENTRIES.reportContext, "practice_mock_exam", "reportContext");
    },
  },
  {
    name: "Lecture PDF scope fix",
    url: (() => {
      const scope = deriveScopeFromPathname("/lectures/fe-5/");
      return buildBase({
        pageUrl: "/lectures/fe-5/",
        issueScope: scope.issueScope,
        lectureSlug: scope.lectureSlug,
        reportContext: deriveReportContext("/lectures/fe-5/"),
      });
    })(),
    checks: (url) => {
      expectEntry(url, REPORT_FORM_ENTRIES.lectureSlug, "fe-5", "lectureSlug");
      expectEntry(url, REPORT_FORM_ENTRIES.issueScope, "specific", "issueScope");
    },
  },
  {
    name: "Bug issue — steps to reproduce",
    url: buildBase({
      issueType: "Code Example Preview/Run Issue",
      steps: "1. Open fe-6\n2. Click Run\n3. Blank iframe",
      reportContext: "code_examples_fe-6",
      pageUrl: "/code-examples/fe-6/",
    }),
    checks: (url) => {
      expectEntry(
        url,
        REPORT_FORM_ENTRIES.issueType,
        "Code Example Preview/Run Issue",
        "issueType"
      );
      expectHasEntry(url, REPORT_FORM_ENTRIES.steps, "steps");
    },
  },
];

let passed = 0;
for (const scenario of scenarios) {
  try {
    assert(scenario.url.includes("usp=pp_url"), `${scenario.name}: missing usp=pp_url`);
    scenario.checks(scenario.url);
    console.log(`✓ ${scenario.name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${scenario.name}: ${err.message}`);
    console.error(`  URL: ${scenario.url.slice(0, 120)}…`);
    process.exitCode = 1;
  }
}

// Verify every issue type can be encoded
for (const issueType of ISSUE_TYPES) {
  const url = buildBase({ issueType });
  expectEntry(url, REPORT_FORM_ENTRIES.issueType, issueType, `issueType:${issueType}`);
}

console.log(`\n${passed}/${scenarios.length} scenarios passed; all ${ISSUE_TYPES.length} issue types encode correctly.`);
