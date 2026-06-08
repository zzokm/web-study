# Written questions guide

All HTML coding (written) questions live in **`data/written-questions/questions.json`** — one file, many questions. The manifest at **`data/manifests/written-questions.json`** only points to that file.

Sync builds **two catalog entries** per question when `examPlacement` is set:

- **Written hub** — `written:<id>` on `/practice/written/` and the “Written questions” card
- **Exam placement** — e.g. `2025:block_6:q81` appended at the **end** of that year’s exam practice (stem prefixed with `81.`)

---

## File layout

```
data/
  manifests/
    written-questions.json     ← points to questions.json
  written-questions/
    README.md                  ← this guide
    questions.json             ← all written questions (single source of truth)
```

After `npm run sync` (in `web/`):

- Manifest copied to `web/public/data/written_questions_manifest.json`
- Questions merged into `catalog.json` with keys like `written:wq-style-english-arabic`

---

## Manifest (`data/manifests/written-questions.json`)

```json
{
  "version": 1,
  "description": "Written questions for /practice/written/. All questions live in data/written-questions/questions.json.",
  "file": "questions.json"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `version` | yes | Always `1` |
| `file` | yes | Filename under `data/written-questions/` (use `questions.json`) |

---

## Questions file schema (`data/written-questions/questions.json`)

### Root

| Field | Required | Description |
|-------|----------|-------------|
| `version` | yes | Always `1` |
| `description` | no | Short note about the file |
| `questions` | yes | Array of written question objects (see below) |

### Each item in `questions[]`

#### Identity & placement

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Stable ID used in catalog (`wq-style-english-arabic`) |
| `order` | yes | Sort order on `/practice/written/` (1, 2, 3, …) |
| `examPlacement` | no | When set, also inject this question at the end of an exam year at sync time |
| `examPlacement.year` | yes* | Exam year (`"2025"`, `"2024"`, …) |
| `examPlacement.blockId` | yes* | Block id for catalog key (e.g. `block_6`) |
| `examPlacement.questionId` | yes* | Question id within block (e.g. `q81`) |
| `examPlacement.questionNumber` | yes* | Printed number prepended to `questionText` in exam practice (e.g. `81`) |
| `examPlacement.topic` | no | Exam block topic; defaults to the question’s `topic` |

\* Required when `examPlacement` is present.

#### Question content

| Field | Required | Description |
|-------|----------|-------------|
| `type` | yes | Must be `"written"` |
| `topic` | yes | Short group title (e.g. `"Written — HTML styling"`) |
| `questionText` | yes | Stem shown in practice. Use `\n` for numbered parts. Do **not** include the exam number prefix here — sync adds it for `examPlacement`. |
| `context` | yes | Shared block context object, or `null` for standalone coding tasks |
| `relatedTopics` | yes | Lecture IDs (`fe-3`, `be-5`, …). **1–2 entries max.** See [Lecture IDs](#lecture-ids-relatedtopics) below. |
| `answerLanguage` | no | Editor language (`html`, `javascript`, `css`, `python`). Defaults from topic and rubric. Python/Django/text-only tasks hide preview and console. |

#### Model answer, correction checks, and explanation

| Field | Required | Description |
|-------|----------|-------------|
| `expectedAnswer` | yes | **Model answer** — reference HTML shown in results after the student checks their work. Any valid solution that passes the rubric is accepted; this is one canonical example. |
| `writtenRubric` | yes | **Correction checks** — auto-grader rules. Student HTML runs in a sandbox iframe; **every check must pass** for a correct result. See [Rubric check types](#writtenrubric--correction-checks). |
| `explanation` | yes | **Explanation** — feedback text shown after checking. Describe what a correct solution must do; you can point the student to the model answer (e.g. “See the model answer below.”). |

#### Must not include

| Field | Written questions |
|-------|-------------------|
| `options` | Omit entirely |
| `correctAnswerId` | Omit entirely |

Grading uses **`writtenRubric`**, not MCQ options.

### Optional `context`

Use when several questions share one HTML snippet (exam-style blocks):

```json
"context": {
  "text": "Based on the page below, …",
  "code": "<html>...</html>",
  "codeLanguage": "html"
}
```

Standalone coding tasks: `"context": null`.

---

## `writtenRubric` — correction checks

```json
"writtenRubric": {
  "version": 1,
  "checks": [ ]
}
```

### Check types

#### 1. `element_text_includes`

Text appears inside elements matching a CSS selector.

```json
{
  "id": "paragraph_text",
  "type": "element_text_includes",
  "selector": "p",
  "text": "My favorite subject is"
}
```

#### 2. `text_has_decoration`

Specific text has strikethrough or underline (`<s>`, `<del>`, `<u>`, `<ins>`, or CSS).

```json
{
  "id": "english_struck",
  "type": "text_has_decoration",
  "text": "English",
  "decoration": "strikethrough"
}
```

`decoration`: `"strikethrough"` | `"underline"`

#### 3. `control_labeled`

A button or input exists with an exact label (input uses `value`).

```json
{
  "id": "style_button",
  "type": "control_labeled",
  "role": "button",
  "label": "Style"
}
```

`role`: `"button"` | `"input"`

#### 4. `click_applies_computed_styles`

Click a button by label, then verify **computed** styles on a target element.

```json
{
  "id": "click_styles",
  "type": "click_applies_computed_styles",
  "triggerLabel": "Style",
  "targetSelector": "p",
  "styles": {
    "color": ["green", "rgb(0, 128, 0)", "#008000"],
    "fontSize": ["14px"],
    "fontFamily": ["arial"]
  }
}
```

`styles` keys: `color`, `fontSize`, `fontFamily`. Each value is a list of accepted alternatives.

#### 5. `code_contains_string`

Source-text check for snippets that are not run in a browser (Python, Django, CSS-only, JS-only). Matching is case-insensitive, ignores extra whitespace, and treats `'` and `"` as equivalent.

```json
{
  "id": "has_try_block",
  "type": "code_contains_string",
  "text": "except ZeroDivisionError:"
}
```

Use **only** `code_contains_string` checks when the answer cannot be executed (Python/Django). The editor shows code only — no preview or console tabs.

---

## Lecture IDs (`relatedTopics`)

Use these keys in `relatedTopics`. Pick **1–2** lectures that best match the question content.

### Frontend (`fe-*`)

| ID | Lec # | Title |
|----|-------|-------|
| `fe-0` | 0 | Course Overview |
| `fe-1` | 1 | Internet Protocols |
| `fe-2` | 2 | Architecture and HTML |
| `fe-3` | 3 | HTML Document Object Model |
| `fe-4` | 4 | CSS |
| `fe-5` | 5 | JavaScript 1 |
| `fe-6` | 6 | JavaScript 2 & AJAX |

### Backend (`be-*`)

| ID | Lec # | Title |
|----|-------|-------|
| `be-1` | 1 | Intro |
| `be-2` | 2 | Python Essentials |
| `be-3` | 3 | OOP and File Handling |
| `be-4` | 4 | Web Basics, HTTP, URLs, and Status Codes |
| `be-5` | 5 | Django I |
| `be-6` | 6 | Django II |
| `be-7` | 7 | Django III |
| `be-8` | 8 | Django IV |

Source of truth: `data/manifests/lectures.json`.

---

## Full example (one entry in `questions[]`)

See [`questions.json`](./questions.json) for the live file. One complete question with model answer, rubric, and explanation:

```json
{
  "id": "wq-style-english-arabic",
  "order": 1,
  "examPlacement": {
    "year": "2025",
    "blockId": "block_6",
    "questionId": "q81",
    "questionNumber": 81,
    "topic": "Written — HTML styling"
  },
  "type": "written",
  "topic": "Written — HTML styling",
  "questionText": "1. Display the text \"My favorite subject is English Arabic\" where \"English\" is struck-through and \"Arabic\" is underlined.\n2. Add a button labeled \"Style\" that, when clicked, changes the paragraph's:\n- Font color to green\n- Font size to 14px\n- Font family to Arial",
  "context": null,
  "expectedAnswer": "<p id=\"myPara\">My favorite subject is <s>English</s> <u>Arabic</u></p>\n<button onclick=\"changeStyle()\">Style</button>\n<script>\nfunction changeStyle() {\n  let p = document.getElementById(\"myPara\");\n  p.style.color = \"green\";\n  p.style.fontSize = \"14px\";\n  p.style.fontFamily = \"Arial\";\n}\n</script>",
  "writtenRubric": {
    "version": 1,
    "checks": [
      {
        "id": "paragraph_text",
        "type": "element_text_includes",
        "selector": "p",
        "text": "My favorite subject is"
      },
      {
        "id": "english_struck",
        "type": "text_has_decoration",
        "text": "English",
        "decoration": "strikethrough"
      },
      {
        "id": "arabic_underlined",
        "type": "text_has_decoration",
        "text": "Arabic",
        "decoration": "underline"
      },
      {
        "id": "style_button",
        "type": "control_labeled",
        "role": "button",
        "label": "Style"
      },
      {
        "id": "click_styles",
        "type": "click_applies_computed_styles",
        "triggerLabel": "Style",
        "targetSelector": "p",
        "styles": {
          "color": ["green", "rgb(0, 128, 0)", "#008000"],
          "fontSize": ["14px"],
          "fontFamily": ["arial"]
        }
      }
    ]
  },
  "explanation": "Your snippet should render the sentence with strike-through on \"English\" and underline on \"Arabic\", include a button labeled \"Style\", and apply green 14px Arial styling to the paragraph when clicked. Any valid HTML/CSS/JS approach works as long as the outcome matches. See the model answer below.",
  "relatedTopics": ["fe-3"]
}
```

### 2025 exam placement

This question also appears as **q81** at the end of `/practice/exam/2025/` (81 questions total). It is **not** duplicated in `data/exams/2025.json`; sync injects it from `examPlacement`.

---

## Add a new written question

1. **Append** a new object to the `questions` array in `data/written-questions/questions.json` (copy the example above and change `id`, `order`, content, rubric, etc.).
2. **Validate** from repo root:

   ```bash
   python scripts/check_data_integrity.py
   ```

3. **Sync** the web app:

   ```bash
   cd web && npm run sync
   ```

4. **Practice** at `/practice/written/`.

### Catalog identity after sync

| Field | Example |
|-------|---------|
| `questionKey` | `written:wq-my-new-task` |
| `origin` | `written` |
| `questionType` | `written` |
| `sourceFile` | `data/written-questions/questions.json` |

---

## Integrity checks

`scripts/check_data_integrity.py` validates:

- Non-empty `questionText`, `explanation`, `expectedAnswer`
- `writtenRubric` version 1 with non-empty `checks`
- Valid `relatedTopics` (known lecture IDs, max 2)
- No `options` on written questions
- `examPlacement` fields when present

Unit tests for rubric logic: `web/src/lib/written-question-checks.test.ts`.

---

## App behaviour (reference)

| Area | Behaviour |
|------|-----------|
| Practice hub | `/practice/written/` — fixed session config (no shuffle / timer / exam mode toggles) |
| Grading | Rubric checks on submit (`written-question-judge.ts`) |
| Results | User HTML + explanation + model answer (`expectedAnswer`) |
| Written at end of shuffled exams | Written items are pinned last when shuffle is on |
