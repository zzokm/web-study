# GA4 events reference — Web Study

Authoritative guide for every custom event sent by the app. Use when reading **Reports → Realtime**, **DebugView**, or **Explore**.

**Setup (env, Docker rebuild, GA4 Admin dimensions):** [GA4_SETUP.md](./GA4_SETUP.md)

**Source of truth in code:** `web/src/lib/analytics-event-schemas.ts`

---

## Overview

- **Transport:** GA4 via direct `gtag.js` (`web/src/components/analytics/google-analytics.tsx`).
- **Gating:** Events fire only when `NEXT_PUBLIC_GOOGLE_TAG_ID` is set.
- **SPA navigation:** `page_view` is sent manually on route changes (GA4 `send_page_view: false` on init).
- **DebugView:** Set `NEXT_PUBLIC_GA_DEBUG=true` locally to enable `debug_mode` in gtag config.
- **Typed API:** `trackAnalyticsEvent(name, params)` in `web/src/lib/analytics.ts` — compile-time param checking via `AnalyticsEventMap`.
- **Auto-attached params:** Every custom event includes `page_path` and `page_title` from the current URL.

### Structured click tracking

High-value UI uses explicit events and `data-analytics-*` attributes instead of generic `ui_click`:

| Attribute | Purpose |
|-----------|---------|
| `data-analytics-skip` | Element tracked explicitly — excluded from `ui_click` fallback |
| `data-analytics-zone` | Zone label (`sidebar`, `header`, `practice_footer`, `hub`, `results`, …) |
| `data-analytics-id` | Stable control id (e.g. `nav_Practice_Practice`, `breakdown_sort`) |

---

## Key events (recommended conversions)

Mark these in **Admin → Data display → Events → Mark as key event**:

| Event | Why |
|-------|-----|
| `practice_finish` | Primary conversion — completed practice session |
| `practice_start` | Session intent |
| `practice_check_answer` | Engagement depth per question |
| `question_save` | Retention signal |
| `pdf_page_view` | Materials usage (lectures & exams) |
| `practice_results_view` | Post-session review |

---

## GA4 automatic events (not from our code)

| Event | Meaning |
|-------|---------|
| `page_view` | Also sent by our SPA tracker with rich `page_title` |
| `scroll` | GA4 Enhanced measurement (~90% scroll) |
| `session_start` | New session |
| `first_visit` | First visit to property |
| `user_engagement` | GA4 engagement timer |

Our code adds **`scroll_depth`** at finer milestones (25/50/75/90/100%).

---

## Event catalog

### Navigation & page

| Event | When |
|-------|------|
| `page_view` | Route change (SPA) |
| `scroll_depth` | Scroll milestone reached |
| `nav_click` | Sidebar nav link clicked |
| `breadcrumb_switch` | Exam/lecture breadcrumb dropdown selection |
| `sidebar_toggle` | Sidebar collapse/expand |
| `ui_click` | Fallback for uninstrumented link/button clicks |

### Practice session

| Event | When |
|-------|------|
| `practice_setup_view` | Setup screen shown before session |
| `practice_setup_start` | User starts, resumes, or starts fresh from setup |
| `practice_start` | Practice session loads (once) |
| `practice_question_view` | Question first shown in session |
| `practice_select_answer` | Answer option selected |
| `practice_check_answer` | Check answer clicked |
| `practice_next` / `practice_previous` | Navigate between questions |
| `practice_pause` / `practice_resume` | Timer paused/resumed |
| `practice_finish` | Session completed |
| `practice_reset_confirm` | Reset dialog confirmed |
| `practice_reset` | Progress cleared |
| `mock_exam_generate` | Mock exam generated and session started |
| `mock_exam_regenerate` | New seed drawn on mock exam setup or in-session |

### Practice results

| Event | When |
|-------|------|
| `practice_results_view` | Results page loads with valid result |
| `practice_results_filter` | Mistakes-only toggle |
| `practice_results_breakdown_sort` | Slowest-first toggle on breakdown table |
| `practice_results_methodology_toggle` | “How timing is measured” open/close |
| `practice_results_timing_view` | Expand review row with timing badge |

### Browse & questions

| Event | When |
|-------|------|
| `question_expand` / `question_collapse` | Accordion open/close |
| `question_save` / `question_unsave` | Bookmark toggle |

### PDF / materials

| Event | When |
|-------|------|
| `pdf_page_view` | PDF page visible (URL or in-viewer scroll) |
| `pdf_document_switch` | Switch to another PDF tab in viewer |

### Hub & outbound

| Event | When |
|-------|------|
| `hub_card_click` | Hub index card (practice, exams, lectures) |
| `outbound_click` | External link (GitHub, feedback form) |

### Analysis

| Event | When |
|-------|------|
| `analysis_filter_change` | Analysis dashboard filter/tab change |

---

## Per-event reference

### `page_view`

**When:** User opens a route or navigates client-side.

**Example `page_title` values:**

| Path | Example title |
|------|----------------|
| `/` | `Home · Web Study` |
| `/practice/exam/2024/` | `Practice · 2024 Final · Web Study` |
| `/practice/results/?id=…` | `Practice results · 2024 Final — Practice · Web Study` |
| `/lectures/ch11/?page=8` | `Lecture · Chapter 11: … (slide 8) · Web Study` |

---

### `scroll_depth`

| Parameter | Type | Meaning |
|-----------|------|---------|
| `scroll_percent` | number | `25`, `50`, `75`, `90`, or `100` |

Fires once per milestone per page load.

---

### `ui_click`

**When:** Click on `a`, `button`, or `[role="button"]` not covered by explicit tracking. Accordion triggers and `data-analytics-skip` elements are excluded.

| Parameter | Type | Meaning |
|-----------|------|---------|
| `element_tag` | string | `a`, `button`, etc. |
| `link_text` | string | Visible label or aria-label (truncated) |
| `link_url` | string? | Href for links |
| `click_zone` | string? | From `data-analytics-zone` on element or ancestor |
| `analytics_id` | string? | From `data-analytics-id` |

---

### `nav_click`

**When:** Sidebar navigation link clicked.

| Parameter | Type | Meaning |
|-----------|------|---------|
| `nav_section` | string | Sidebar group, e.g. `Practice`, `Materials` |
| `nav_label` | string | Link label, e.g. `By exam` |
| `nav_href` | string | Destination path |

---

### `breadcrumb_switch`

**When:** User selects a different exam or lecture from the breadcrumb dropdown.

| Parameter | Type | Meaning |
|-----------|------|---------|
| `switcher_type` | `exam` \| `lecture` | Which switcher |
| `from_value` | string | Current year or slug |
| `to_value` | string | Selected year or slug |

---

### `sidebar_toggle`

**When:** Sidebar trigger clicked.

| Parameter | Type | Meaning |
|-----------|------|---------|
| `sidebar_state` | `open` \| `closed` | State after toggle |

---

### `hub_card_click`

**When:** User clicks a card on a hub/index page.

| Parameter | Type | Meaning |
|-----------|------|---------|
| `hub_type` | string | `practice`, `exams`, `lectures`, `lectures_frontend`, `lectures_backend` |
| `target_href` | string | Card destination |
| `target_label` | string | Card title |

---

### `outbound_click`

**When:** External link clicked (feedback form, GitHub).

| Parameter | Type | Meaning |
|-----------|------|---------|
| `outbound_url` | string | Full URL |
| `outbound_label` | string | Link label |

---

### `analysis_filter_change`

**When:** User changes a filter on the exam analysis dashboard.

| Parameter | Type | Meaning |
|-----------|------|---------|
| `filter_type` | string | `answer_year`, `lecture_yield_mode` |
| `filter_value` | string | Selected value, e.g. `2024`, `unique` |

---

## Practice session events

All practice events include **`practice_mode`** when on a practice route:

| `practice_mode` | Route |
|-----------------|-------|
| `lecture` | `/practice/lecture/{slug}/` |
| `exam` | `/practice/exam/{year}/` |
| `repetitive` | `/practice/repetitive/` |
| `saved` | `/practice/saved/` |

Shared practice parameters:

| Parameter | Meaning |
|-----------|---------|
| `practice_mode` | See table above |
| `exam_year` | e.g. `2024` (exam mode) |
| `lecture_slug` | e.g. `fe-1`, `be-3` (lecture mode) |
| `session_title` | Display title |
| `question_index` | 1-based position in session |
| `interaction_source` | `keyboard` or `click` (navigation & answer actions) |

### `practice_setup_view`

| Parameter | Meaning |
|-----------|---------|
| `question_count` | Questions in the set |

### `practice_setup_start`

| Parameter | Meaning |
|-----------|---------|
| `question_count` | Questions in the set |
| `start_mode` | `start`, `resume`, or `fresh` |
| `shuffle_questions` | Question shuffle enabled |
| `shuffle_mcq_options` | MCQ answer shuffle enabled |
| `show_session_timer` | Session timer shown |
| `exam_simulation` | Exam simulation mode enabled |
| `frontend_share` | Mock exam: frontend allocation % (when applicable) |
| `mock_exam_seed` | Mock exam: PRNG seed (when applicable) |

### `mock_exam_generate` / `mock_exam_regenerate`

| Parameter | Meaning |
|-----------|---------|
| `practice_mode` | `mock_exam` |
| `question_count` | Generated question count |
| `frontend_share` | Frontend track allocation % |
| `mock_exam_seed` | Seed for reproducible generation |
| `previous_session_key` | Regenerate only — prior storage key |

### `practice_start`

| Parameter | Meaning |
|-----------|---------|
| `question_count` | Questions in the set |
| `shuffle_questions`, `shuffle_mcq_options`, `show_session_timer`, `exam_simulation` | Session options (when set from setup) |

**Sets user properties:** `last_practice_mode`, `last_exam_year`, `last_lecture_slug`.

### `practice_question_view`

**When:** Question first shown in the session (including revisits after reset).

### `practice_select_answer`

| Parameter | Meaning |
|-----------|---------|
| `selected_option_id` | Option id, e.g. `a`, `b` |

### `practice_check_answer`

| Parameter | Meaning |
|-----------|---------|
| `selected_option_id` | Chosen option |
| `correct` | `true` or `false` |
| `thinking_ms` | Ms from question shown → check answer |

### `practice_pause` / `practice_resume`

| Parameter | Meaning |
|-----------|---------|
| `elapsed_ms` | Session elapsed time at pause/resume |
| `pause_duration_ms` | Ms paused (resume only) |

### `practice_finish`

| Parameter | Meaning |
|-----------|---------|
| `score_percent` | Score as % of total |
| `correct`, `incorrect`, `skipped` | Counts |
| `question_count` | Total in session |
| `total_thinking_ms` | Sum of per-question thinking (if recorded) |
| `session_wall_ms` | Wall-clock session duration |

**Sets user properties:** `last_score_percent`, `last_finish_at` (ISO date).

### `practice_reset_confirm` / `practice_reset`

| Parameter | Meaning |
|-----------|---------|
| `saved_answers_count` | Answers cleared |

---

## Practice results events

### `practice_results_view`

| Parameter | Meaning |
|-----------|---------|
| `session_title` | Session display title |
| `score_percent`, `correct`, `incorrect`, `skipped` | Score breakdown |
| `question_count` | Questions in session |
| `total_thinking_ms` | Sum thinking time |
| `session_wall_ms` | Wall-clock duration |
| `average_thinking_ms` | Mean per-question thinking |
| `median_thinking_ms` | Median per-question thinking |
| `review_gap_ms` | Session wall minus active thinking |

### `practice_results_filter`

| Parameter | Meaning |
|-----------|---------|
| `mistakes_only` | `true` when showing mistakes only |

### `practice_results_breakdown_sort`

| Parameter | Meaning |
|-----------|---------|
| `sort_mode` | `order` or `slowest_first` |

### `practice_results_methodology_toggle`

| Parameter | Meaning |
|-----------|---------|
| `open` | `true` when section expanded |

### `practice_results_timing_view`

| Parameter | Meaning |
|-----------|---------|
| `thinking_ms` | Per-question thinking time |
| + question parameters | |

---

## Browse & question events

### `question_expand` / `question_collapse`

| Parameter | Meaning |
|-----------|---------|
| `browse_context` | Where the accordion lives |

**`browse_context` values:**

| Value | Page |
|-------|------|
| `by_lecture` | `/by-lecture/{slug}/` |
| `by_exam` | `/by-exam/{year}/` |
| `repetitive` | `/repetitive/` |
| `saved` | `/saved/` |
| `practice_results` | `/practice/results/` review accordion |

### `question_save` / `question_unsave`

**Sets user property:** `has_saved_questions` (`true`/`false`).

---

## PDF events

### `pdf_page_view`

**When:** PDF page becomes visible — from URL `?page=` or in-viewer scroll (debounced 300ms).

| Parameter | Meaning |
|-----------|---------|
| `viewer_type` | `lecture` or `exam` |
| `document_id` | Lecture/exam document id |
| `page_number` | 1-based page |
| `page_count` | Total pages |
| `topic` | Document topic |
| `source` | `url` or `viewer_scroll` |

### `pdf_document_switch`

**When:** User switches PDF tab in the embedded viewer.

| Parameter | Meaning |
|-----------|---------|
| `viewer_type` | `lecture` or `exam` |
| `from_document_id` | Previous document |
| `to_document_id` | New document |

---

## Question parameters

Included on question-tied events:

| Parameter | Example | Meaning |
|-----------|---------|---------|
| `question_key` | `2024:Q19` | Unique id across exams |
| `question_type` | `mcq`, `true_false` | Format |
| `topic` | Chapter label | Lecture/topic |
| `lecture_slug` | `fe-1`, `be-3` | Lecture slug |
| `origin` | `2024` | Source exam year |
| `source_question_id` | `Q19` | Id within exam |

Question text is **not** sent.

---

## User properties

| Property | When set | Meaning |
|----------|----------|---------|
| `last_practice_mode` | `practice_start` | Last practice type |
| `last_exam_year` | `practice_start` | Last exam year practiced |
| `last_lecture_slug` | `practice_start` | Last lecture slug practiced |
| `last_score_percent` | `practice_finish` | Most recent score % |
| `last_finish_at` | `practice_finish` | ISO timestamp of last finish |
| `has_saved_questions` | `question_save` / `question_unsave` | Whether user has bookmarks |

Register all in GA4 Admin — see [GA4_SETUP.md](./GA4_SETUP.md).

---

## Parameter dictionary (appendix)

| Parameter | Used on |
|-----------|---------|
| `page_path`, `page_title` | All custom events |
| `scroll_percent` | `scroll_depth` |
| `element_tag`, `link_text`, `link_url`, `click_zone`, `analytics_id` | `ui_click` |
| `nav_section`, `nav_label`, `nav_href` | `nav_click` |
| `switcher_type`, `from_value`, `to_value` | `breadcrumb_switch` |
| `sidebar_state` | `sidebar_toggle` |
| `hub_type`, `target_href`, `target_label` | `hub_card_click` |
| `outbound_url`, `outbound_label` | `outbound_click` |
| `filter_type`, `filter_value` | `analysis_filter_change` |
| `practice_mode`, `exam_year`, `lecture_slug`, `session_title`, `question_index`, `interaction_source` | Practice events |
| `question_count`, `score_percent`, `correct`, `incorrect`, `skipped` | Start/finish/results |
| `selected_option_id`, `correct`, `thinking_ms` | Answer events |
| `elapsed_ms`, `pause_duration_ms` | Pause/resume |
| `total_thinking_ms`, `session_wall_ms`, `average_thinking_ms`, `median_thinking_ms`, `review_gap_ms` | Finish/results |
| `saved_answers_count` | Reset events |
| `browse_context` | Question expand/collapse |
| `mistakes_only` | Results filter |
| `sort_mode` | Breakdown sort |
| `open` | Methodology toggle |
| `viewer_type`, `document_id`, `page_number`, `page_count`, `topic`, `source` | PDF page view |
| `from_document_id`, `to_document_id` | PDF document switch |

---

## Funnels to build in Explore

1. **Practice completion:** `practice_start` → `practice_check_answer` → `practice_finish` → `practice_results_view`
2. **Materials → practice:** `hub_card_click` (hub_type=`practice`) → `practice_start` → `practice_finish`
3. **PDF engagement:** `pdf_page_view` (source=`viewer_scroll`) → `pdf_document_switch`
4. **Results review depth:** `practice_results_view` → `practice_results_breakdown_sort` → `practice_results_timing_view`
5. **Keyboard power users:** Filter `practice_check_answer` where `interaction_source` = `keyboard`

---

## Removed / deferred events

These appeared in older docs but are **not implemented**:

- `slide_link_click`
- `slide_preview_open` / `slide_preview_close`

`lecture_slide_view` is deprecated — use `pdf_page_view` instead.

---

## Verification checklist

- [ ] `NEXT_PUBLIC_GOOGLE_TAG_ID` set; Docker image rebuilt for production
- [ ] Custom dimensions registered ([GA4_SETUP.md](./GA4_SETUP.md))
- [ ] Key events marked in GA4 Admin
- [ ] DebugView pass with `NEXT_PUBLIC_GA_DEBUG=true` on major flows: practice, results, PDF scroll, sidebar nav, hub cards
- [ ] Optional: campaign links with `?utm_source=…` for acquisition reporting

Allow 24–48 hours after Admin registration for dimensions to appear in standard reports.
