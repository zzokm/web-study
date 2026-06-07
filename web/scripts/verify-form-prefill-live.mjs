/**
 * Fetches prefilled Google Form URLs and checks values appear in the response.
 * Run: node scripts/verify-form-prefill-live.mjs
 */

const FORM_ID = "1FAIpQLSc_xJ6zuD2eGeWSraN0TCq4WYBRJAVsaseA9e_DtfQOod8QaA";
const BASE = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform`;

const cases = [
  {
    name: "Code example",
    params: {
      usp: "pp_url",
      "entry.924018450": "Incorrect Code Example Explanation",
      "entry.142573693": "[Code example: Promise basics (200.html)]\n\nTest",
      "entry.254584609": "/code-examples/fe-6/",
      "entry.1178971734": "specific",
      "entry.1904904607": "code_examples:fe-6:fe-6-promise-basic",
      "entry.2037647722": "fe-6",
      "entry.382395630": "fe-6-promise-basic",
      "entry.358580894": "200.html",
      "entry.2064139030": "test-agent",
      "entry.1035001243": "2026-06-07T12:00:00.000Z",
    },
    mustContain: [
      "Incorrect Code Example Explanation",
      "fe-6-promise-basic",
      "200.html",
      "code_examples:fe-6:fe-6-promise-basic",
    ],
  },
  {
    name: "Mock exam",
    params: {
      usp: "pp_url",
      "entry.924018450": "Mock Exam Generation Issue",
      "entry.142573693": "[Mock exam: seed=123456789, questions=84]\n\nTest",
      "entry.254584609": "/practice/mock-exam/",
      "entry.1178971734": "specific",
      "entry.1904904607": "mock_exam:123456789:84:70",
      "entry.51481666":
        "seed=123456789, questions=84, frontend=70%, backend=30%, shuffleQuestions=true, shuffleMcqOptions=true, examSimulation=true, showSessionTimer=true, version=1",
      "entry.2064139030": "test-agent",
      "entry.1035001243": "2026-06-07T12:00:00.000Z",
    },
    mustContain: [
      "Mock Exam Generation Issue",
      "mock_exam:123456789:84:70",
      "123456789",
      "entry.51481666",
    ],
  },
];

let failed = 0;

for (const testCase of cases) {
  const qs = new URLSearchParams(testCase.params).toString();
  const url = `${BASE}?${qs}`;
  const res = await fetch(url);
  const html = await res.text();

  const missing = testCase.mustContain.filter((s) => !html.includes(s));
  if (missing.length) {
    console.error(`✗ ${testCase.name}: response missing ${missing.join(", ")}`);
    failed++;
  } else {
    console.log(`✓ ${testCase.name}: prefill values present in form HTML`);
  }
}

if (failed) process.exit(1);
console.log(`\nAll ${cases.length} live prefill checks passed.`);
