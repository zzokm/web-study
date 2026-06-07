# Report issue — Google Form setup

The in-app **Report issue** modal prefills [this Google Form](https://docs.google.com/forms/d/e/1FAIpQLSc_xJ6zuD2eGeWSraN0TCq4WYBRJAVsaseA9e_DtfQOod8QaA/viewform) and opens it in a new tab. Entry IDs live in `web/src/lib/report-issue.ts` (`REPORT_FORM_ENTRIES`).

---

## Existing prefilled fields

| Form question (label in app) | Entry id | Prefill source |
|------------------------------|----------|----------------|
| Issue type | `924018450` | User selection |
| Description | `142573693` | User text (+ code-example header when reporting a demo) |
| Contact email | `1247312475` | Optional |
| Expected correct answer | `283859182` | When issue type = wrong answer |
| Steps to reproduce | `864977798` | Bug-type issues |
| Page URL | `254584609` | Current or selected location |
| Issue scope | `1178971734` | `general` or `specific` |
| Report context | `1904904607` | Derived route key (see below) |
| Question key | `619076863` | When reporting from a question |
| Exam year | `698876340` | Exam-scoped reports |
| Lecture slug | `2037647722` | Lecture-scoped reports (`fe-5`, `be-3`, …) |
| Device info | `2064139030` | User agent + viewport |
| Timestamp | `1035001243` | ISO time at submit |
| Code example ID | `382395630` | When reporting from a code example card |
| Code example file | `358580894` | When reporting from a code example card |
| Mock exam details | `51481666` | Seed, counts, FE/BE split, session flags |

---

## Google Form setup (done)

### 1. Issue type — **update dropdown options**

Open the form editor → **Issue type** question → add these choices (keep existing ones):

- `Incorrect Code Example Explanation`
- `Code Example Preview/Run Issue`
- `Mock Exam Generation Issue`

Must match the strings in `ISSUE_TYPES` in `report-issue.ts` exactly.

Issue type dropdown includes all 10 values from `ISSUE_TYPES`. Optional short-answer fields for code example id/file and mock exam details are wired in `REPORT_FORM_ENTRIES`.

### Verify prefill after form edits

```bash
node scripts/inspect-report-form.mjs      # list field titles + entry ids
npx tsx scripts/test-report-form-prefill.mjs  # URL builder scenarios
node scripts/verify-form-prefill-live.mjs     # fetch prefilled form HTML
```

---

## Report context values (auto-filled)

| Route / situation | `reportContext` value |
|-------------------|------------------------|
| Home | `home` |
| Practice hub | `practice_hub` |
| Mock exam setup / picker | `practice_mock_exam` |
| Mock exam locked report | `mock_exam:SEED:COUNT:FE%` |
| Practice by lecture | `practice_lecture` |
| Practice by exam year | `practice_exam` |
| Code examples fe-5 page | `code_examples_fe-5` |
| Code examples fe-6 page | `code_examples_fe-6` |
| Specific code example card | `code_examples:fe-5:fe-5-dialogs` |
| Frontend lectures hub | `pdf_lecture` (legacy key for `/lectures/…`) |
| By-lecture browse | `browse_by_lecture` / `browse_by_lecture_hub` |
| Other | `other` |

---

## In-app location picker (no form change)

The modal **Location** dropdown now includes:

- **This page** — current URL
- **Code examples** → scope: general (frontend hub), fe-5, or fe-6
- **Mock exam** → `/practice/mock-exam/`
- Existing hubs: Practice, Analysis, Exam PDFs, lectures, Repetitive, Saved
- **By exam** / **By lecture** with sub-scopes

Code example cards have a **flag** button that locks the report to that demo (title, file, lecture, id).

Mock exam **setup**, **active session** (exam simulation), **results**, and per-question review attach the current spec (seed, counts, FE/BE split, shuffle/timer flags).

---

## In-app report entry points (new features)

| Feature | Where to report |
|---------|-----------------|
| Code examples | Flag on each example card; location picker → Code examples |
| Mock exam generator | Setup page **Report issue**; location picker → Mock exam |
| Mock exam session | Flag on each question during exam simulation |
| Mock exam results | Header **Report issue** + per-question flags in review accordion |
| Practice setup / seeded shuffle | Header pill (general); use **Practice** location or **This page** on setup routes |

---

## Feedback form (separate)

General satisfaction feedback uses a different form: `FEEDBACK_FORM_URL` in `web/src/lib/site-links.ts` (`forms.gle/yWE4Ekhs2AaCubGg6`).

Suggested additions to that **feedback** form (not the report form):

**“Most valuable feature”** — add options:

- Code examples (runnable demos)
- Mock exam generator
- Code example explanations
- Repetitive questions mode

**“Technical issues”** — add:

- Code example preview / Run button not working
- Mock exam generation or resume issue

---

## Finding entry ids after editing the form

1. Open the form → **Send** → link with prefill, or inspect `FB_PUBLIC_LOAD_DATA` on the public viewform page.
2. Use the **inner** field id (`field[4][0][0]`), not the wrapper id — same method documented in `report-issue.ts`.
3. Update `REPORT_FORM_ENTRIES` and redeploy.
