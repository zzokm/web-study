# GA4 events reference — Management Study

Use this guide when reading **Reports → Realtime**, **DebugView**, or **Explore**. Every custom event also includes `page_path` and `page_title` automatically (see [Common parameters](#common-parameters-on-every-custom-event)).

Setup (env, Docker rebuild, GA4 Admin custom dimensions): [GA4_SETUP.md](./GA4_SETUP.md).

---

## Quick lookup: Realtime cards

| What you see in Realtime | What to look at |
|--------------------------|-----------------|
| **Views by Page title** | Descriptive titles like `Practice · Chapter 1: Introduction · Management Study` — not a single “Management Study” for everything |
| **Event count by Event name** | Mix of `page_view`, `practice_*`, `question_*`, `scroll_depth`, `ui_click`, etc. |
| **Active users by User property** | `last_practice_mode`, `last_lecture_slug`, `last_exam_year` (after you register them in GA4 Admin) |
| **First user source** | Only fills when traffic has a referrer or UTM (e.g. `?utm_source=whatsapp`). Direct visits often show “No data” |
| **Key events** | Empty until you mark events as conversions in Admin (e.g. `practice_finish`) |

---

## GA4 automatic events (not from our code)

These come from GA4 itself or Enhanced measurement. You may already see them:

| Event name | Meaning |
|------------|---------|
| `page_view` | Page load or SPA navigation (we send this manually with a rich `page_title`) |
| `scroll` | GA4 Enhanced measurement — user scrolled ~90% down the page |
| `session_start` | New session began |
| `first_visit` | User’s first visit to the property |
| `user_engagement` | GA4 engagement timer fired |

Our code adds **`scroll_depth`** (finer milestones) in addition to GA4’s `scroll`.

---

## Navigation & engagement

### `page_view`

**When:** User opens a route or navigates client-side to a new path.

**What it tells you:** Which screens are visited. Check **page_title** and **page_path**.

**Example page titles:**

| Path | Example `page_title` |
|------|----------------------|
| `/` | `Home · Management Study` |
| `/by-lecture/chapter-1-introduction/` | `Browse · Chapter 1: Introduction · Management Study` |
| `/by-exam/2024/` | `Browse · 2024 Final · Management Study` |
| `/practice/lecture/chapter-11-fundamentals-of-organizing/` | `Practice · Chapter 11: Fundamentals of Organizing · Management Study` |
| `/practice/results/?id=…` | `Practice results · 2024 Final — Practice · Management Study` (if result title known) |
| `/lectures/ch11/?page=8` | `Lecture · Chapter 11: … (slide 8) · Management Study` |

---

### `scroll_depth`

**When:** User scrolls to 25%, 50%, 75%, 90%, or 100% of the page (once per milestone per page).

| Parameter | Meaning |
|-----------|---------|
| `scroll_percent` | `25`, `50`, `75`, `90`, or `100` |

**What it tells you:** How far users read on long pages (browse lists, results, analysis).

---

### `ui_click`

**When:** User clicks a link, button, or `[role="button"]`. Accordion expand/collapse triggers are **excluded** (those use `question_expand` / `question_collapse`).

| Parameter | Meaning |
|-----------|---------|
| `element_tag` | `a`, `button`, etc. |
| `link_text` | Visible label or aria-label (truncated) |
| `link_url` | Href for links (truncated) |

**What it tells you:** Which UI elements get clicks (Practice buttons, sidebar links, “Open slide N”, etc.).

---

## Practice mode

All practice events include **`practice_mode`** when applicable:

| Value | Route |
|-------|--------|
| `lecture` | `/practice/lecture/{slug}/` |
| `exam` | `/practice/exam/{year}/` |
| `repetitive` | `/practice/repetitive/` |
| `saved` | `/practice/saved/` |

### `practice_start`

**When:** A practice session page loads (once per session).

| Parameter | Meaning |
|-----------|---------|
| `practice_mode` | `lecture`, `exam`, `repetitive`, or `saved` |
| `question_count` | Number of questions in the set |
| `exam_year` | e.g. `2024` (exam mode only) |
| `lecture_slug` | e.g. `chapter-1-introduction` (lecture mode only) |
| `session_title` | Display title, e.g. `2024 Final — Practice` |

**Also sets user properties:** `last_practice_mode`, `last_exam_year`, `last_lecture_slug`.

---

### `practice_select_answer`

**When:** User taps/clicks an answer option (before Check).

| Parameter | Meaning |
|-----------|---------|
| `selected_option_id` | Option id, e.g. `a`, `b`, `2` |
| `question_index` | 1-based position in the session |
| + [question parameters](#question-parameters) | |

---

### `practice_check_answer`

**When:** User clicks **Check** after selecting an answer.

| Parameter | Meaning |
|-----------|---------|
| `correct` | `true` or `false` |
| `selected_option_id` | What they chose |
| `question_index` | 1-based position |
| + question parameters | |

**What it tells you:** Accuracy per question; filter `correct == false` for hard questions.

---

### `practice_next` / `practice_previous`

**When:** User moves to next/previous question (after answer revealed for next).

| Parameter | Meaning |
|-----------|---------|
| `question_index` | Question they were on when they navigated |
| + question parameters | |

---

### `practice_finish`

**When:** User completes the session (Finish on last question).

| Parameter | Meaning |
|-----------|---------|
| `score_percent` | Score as % of total questions |
| `correct` | Number correct |
| `incorrect` | Number wrong (among answered) |
| `skipped` | Unanswered count |
| `question_count` | Total in session |
| `session_title`, `practice_mode`, `exam_year`, `lecture_slug` | Context |

**Good candidate for a Key event (conversion)** in GA4 Admin.

---

### `practice_reset`

**When:** User confirms **Reset progress** on a practice session.

| Parameter | Meaning |
|-----------|---------|
| `saved_answers_count` | How many saved answers were cleared |
| `practice_mode` | Current practice type |

---

## Browse & question review (accordion)

### `question_expand` / `question_collapse`

**When:** User opens or closes a question row on browse or results pages.

| Parameter | Meaning |
|-----------|---------|
| `browse_context` | Where they are (see below) |
| + question parameters | |

**`browse_context` values:**

| Value | Page |
|-------|------|
| `by_lecture` | `/by-lecture/{slug}/` |
| `by_exam` | `/by-exam/{year}/` |
| `repetitive` | `/repetitive/` |
| `saved` | `/saved/` |
| `practice_results` | `/practice/results/` review accordion |

**What it tells you:** Which questions people open to read answers/explanations (use `question_key`, `topic`).

---

### `question_save` / `question_unsave`

**When:** User bookmarks or removes a bookmark (practice or saved browse).

| Parameter | Meaning |
|-----------|---------|
| + question parameters | Identifies the question |

---

### `slide_link_click`

**When:** User clicks **Open slide N** or **Open full lecture** in the Reference section.

| Parameter | Meaning |
|-----------|---------|
| `lecture_id` | e.g. `ch11` |
| `slide_page` | Slide number (slide links only) |
| `link_type` | `slide` or `full_lecture` |
| + question parameters | |

---

### `slide_preview_open` / `slide_preview_close`

**When:** User toggles **Show referenced slides** (inline PDF) on a question.

| Parameter | Meaning |
|-----------|---------|
| `lecture_id` | From `slideRef` |
| + question parameters | |

---

## Results & lectures

### `practice_results_view`

**When:** Practice results page loads with a valid saved result.

| Parameter | Meaning |
|-----------|---------|
| `session_title` | e.g. `2024 Final — Practice` |
| `score_percent`, `correct`, `incorrect`, `skipped` | Final score breakdown |
| `question_count` | Questions in that session |

---

### `practice_results_filter`

**When:** User toggles **Show mistakes only** / **Show all questions**.

| Parameter | Meaning |
|-----------|---------|
| `mistakes_only` | `true` when showing mistakes only |

---

### `lecture_slide_view`

**When:** Lecture PDF viewer loads or URL `?page=` changes.

| Parameter | Meaning |
|-----------|---------|
| `lecture_id` | e.g. `ch1` |
| `slide_page` | Slide number |
| `page_count` | Total slides in deck |
| `topic` | Chapter topic string |

---

## Question parameters

Included on any event tied to a specific question (`question_expand`, `practice_check_answer`, etc.):

| Parameter | Example | Meaning |
|-----------|---------|---------|
| `question_key` | `2024:Q19` | Unique id across exams |
| `question_type` | `mcq`, `true_false` | Question format |
| `topic` | `Chapter 21: Controlling Fundamentals` | Lecture/topic label |
| `lecture_slug` | `chapter-21-controlling-fundamentals` | Pool slug |
| `origin` | `2024` | Source exam year |
| `source_question_id` | `Q19` | Id within that exam |

We do **not** send question text (privacy + size).

---

## Common parameters on every custom event

| Parameter | Meaning |
|-----------|---------|
| `page_path` | URL path, e.g. `/practice/exam/2024/` |
| `page_title` | Human-readable title sent to GA4 |

---

## User properties (not events)

Set on **`practice_start`**; visible under **Realtime → Active users by User property** after Admin registration:

| Property | Example | Meaning |
|----------|---------|---------|
| `last_practice_mode` | `exam` | Last practice type used |
| `last_exam_year` | `2024` | Last exam practice year |
| `last_lecture_slug` | `chapter-1-introduction` | Last lecture practice slug |

---

## Suggested GA4 reports

1. **Realtime** — confirm titles and events while testing.
2. **Explore → Free form** — Rows: `question_key`, Values: Event count, Filter: `practice_check_answer`, Breakdown: `correct`.
3. **Explore** — Rows: `page_title`, Values: Views, during launch week.
4. **Explore** — Rows: `browse_context`, Values: `question_expand` count — which browse modes drive deep reads.

---

## Nothing else required in code

Implementation is complete when:

- [x] `GOOGLE_TAG_ID` set and Docker image rebuilt for production
- [ ] Custom dimensions registered in GA4 Admin ([GA4_SETUP.md](./GA4_SETUP.md))
- [ ] Optional: mark `practice_finish` / `practice_check_answer` as Key events
- [ ] Optional: share links with `?utm_source=…` so **First user source** populates

After Admin registration, allow up to 24–48 hours for all dimensions to appear in standard reports.
