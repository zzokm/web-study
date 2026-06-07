# Google Analytics 4 setup — Web Study

**Event dictionary:** [GA4_EVENTS_GUIDE.md](./GA4_EVENTS_GUIDE.md)

**Code source of truth:** `web/src/lib/analytics-event-schemas.ts`

---

## Environment variables

Set in `web/.env.local` (development) or Docker `.env` (production build):

```env
NEXT_PUBLIC_GOOGLE_TAG_ID=G-XXXXXXXXXX
```

Optional — enable DebugView locally:

```env
NEXT_PUBLIC_GA_DEBUG=true
```

Docker Compose passes `NEXT_PUBLIC_GOOGLE_TAG_ID` at **build** time. Rebuild after changing:

```bash
docker compose build --no-cache
docker compose up -d
```

See `web/.env.example` for all optional vars.

---

## What the app tracks

Summary of custom events (full param docs in the events guide):

| Domain | Events |
|--------|--------|
| Navigation | `page_view`, `scroll_depth`, `nav_click`, `breadcrumb_switch`, `sidebar_toggle`, `ui_click` |
| Practice | `practice_setup_view`, `practice_setup_start`, `practice_start`, `practice_question_view`, `practice_select_answer`, `practice_check_answer`, `practice_next`, `practice_previous`, `practice_pause`, `practice_resume`, `practice_finish`, `practice_reset_confirm`, `practice_reset` |
| Results | `practice_results_view`, `practice_results_filter`, `practice_results_breakdown_sort`, `practice_results_methodology_toggle`, `practice_results_timing_view` |
| Browse | `question_expand`, `question_collapse`, `question_save`, `question_unsave` |
| PDF | `pdf_page_view`, `pdf_document_switch` |
| Hub / outbound | `hub_card_click`, `outbound_click` |
| Analysis | `analysis_filter_change` |

---

## GA4 Admin — event-scoped custom dimensions

Register in **Admin → Data display → Custom definitions → Create custom dimension** (scope: **Event**).

After events appear in **Admin → Data display → Events** (can take 24h), register:

### Practice & session

| Dimension | Parameter | Events |
|-----------|-----------|--------|
| Practice mode | `practice_mode` | `practice_*` |
| Exam year | `exam_year` | `practice_*`, hub |
| Lecture slug | `lecture_slug` | `practice_*`, questions |
| Session title | `session_title` | `practice_start`, `practice_finish`, `practice_results_view` |
| Question index | `question_index` | `practice_*` |
| Interaction source | `interaction_source` | `practice_select_answer`, `practice_check_answer`, `practice_next`, `practice_previous`, `question_save`, `question_unsave` |
| Question count | `question_count` | `practice_setup_*`, `practice_start`, `practice_finish`, `practice_results_view` |
| Start mode | `start_mode` | `practice_setup_start` |
| Shuffle questions | `shuffle_questions` | `practice_setup_start`, `practice_start`, `practice_finish` |
| Shuffle MCQ options | `shuffle_mcq_options` | `practice_setup_start`, `practice_start`, `practice_finish` |
| Show session timer | `show_session_timer` | `practice_setup_start`, `practice_start`, `practice_finish` |
| Exam simulation | `exam_simulation` | `practice_setup_start`, `practice_start`, `practice_finish` |
| Score percent | `score_percent` | `practice_finish`, `practice_results_view` |
| Correct | `correct` | `practice_check_answer`, `practice_finish`, `practice_results_view` |
| Selected option | `selected_option_id` | `practice_select_answer`, `practice_check_answer` |
| Thinking ms | `thinking_ms` | `practice_check_answer`, `practice_results_timing_view` |
| Elapsed ms | `elapsed_ms` | `practice_pause`, `practice_resume` |
| Pause duration ms | `pause_duration_ms` | `practice_resume` |
| Total thinking ms | `total_thinking_ms` | `practice_finish`, `practice_results_view` |
| Session wall ms | `session_wall_ms` | `practice_finish`, `practice_results_view` |
| Average thinking ms | `average_thinking_ms` | `practice_results_view` |
| Median thinking ms | `median_thinking_ms` | `practice_results_view` |
| Review gap ms | `review_gap_ms` | `practice_results_view` |
| Saved answers count | `saved_answers_count` | `practice_reset`, `practice_reset_confirm` |

### Questions & browse

| Dimension | Parameter | Events |
|-----------|-----------|--------|
| Question key | `question_key` | Question-tied events |
| Question type | `question_type` | Question-tied events |
| Topic | `topic` | Question-tied, PDF events |
| Origin | `origin` | Question-tied events |
| Source question id | `source_question_id` | Question-tied events |
| Browse context | `browse_context` | `question_expand`, `question_collapse` |

### Navigation & engagement

| Dimension | Parameter | Events |
|-----------|-----------|--------|
| Scroll percent | `scroll_percent` | `scroll_depth` |
| Element tag | `element_tag` | `ui_click` |
| Link text | `link_text` | `ui_click` |
| Link url | `link_url` | `ui_click` |
| Click zone | `click_zone` | `ui_click` |
| Analytics id | `analytics_id` | `ui_click` |
| Nav section | `nav_section` | `nav_click` |
| Nav label | `nav_label` | `nav_click` |
| Nav href | `nav_href` | `nav_click` |
| Switcher type | `switcher_type` | `breadcrumb_switch` |
| From value | `from_value` | `breadcrumb_switch` |
| To value | `to_value` | `breadcrumb_switch` |
| Sidebar state | `sidebar_state` | `sidebar_toggle` |

### PDF & materials

| Dimension | Parameter | Events |
|-----------|-----------|--------|
| Viewer type | `viewer_type` | `pdf_page_view`, `pdf_document_switch` |
| Document id | `document_id` | `pdf_page_view` |
| Page number | `page_number` | `pdf_page_view` |
| Page count | `page_count` | `pdf_page_view` |
| PDF source | `source` | `pdf_page_view` (`url` / `viewer_scroll`) |
| From document id | `from_document_id` | `pdf_document_switch` |
| To document id | `to_document_id` | `pdf_document_switch` |

### Hub, outbound, analysis, results UI

| Dimension | Parameter | Events |
|-----------|-----------|--------|
| Hub type | `hub_type` | `hub_card_click` |
| Target href | `target_href` | `hub_card_click` |
| Target label | `target_label` | `hub_card_click` |
| Outbound url | `outbound_url` | `outbound_click` |
| Outbound label | `outbound_label` | `outbound_click` |
| Filter type | `filter_type` | `analysis_filter_change` |
| Filter value | `filter_value` | `analysis_filter_change` |
| Mistakes only | `mistakes_only` | `practice_results_filter` |
| Sort mode | `sort_mode` | `practice_results_breakdown_sort` |
| Open | `open` | `practice_results_methodology_toggle` |

---

## GA4 Admin — user properties

Register in **Admin → Data display → Custom definitions → Create custom dimension** (scope: **User**):

| Property | Set when | Meaning |
|----------|----------|---------|
| `last_practice_mode` | `practice_start` | Last practice type |
| `last_exam_year` | `practice_start` | Last exam year |
| `last_lecture_slug` | `practice_start` | Last lecture slug |
| `last_score_percent` | `practice_finish` | Most recent score % |
| `last_finish_at` | `practice_finish` | ISO date of last finish |
| `has_saved_questions` | `question_save` / `question_unsave` | Bookmark state |

---

## Recommended key events

Mark in **Admin → Data display → Events → Mark as key event**:

| Event | Rationale |
|-------|-----------|
| `practice_finish` | Primary conversion |
| `practice_start` | Session intent |
| `practice_check_answer` | Per-question engagement |
| `question_save` | Retention |
| `pdf_page_view` | Materials usage |
| `practice_results_view` | Post-session review |

---

## DebugView verification

1. Set `NEXT_PUBLIC_GA_DEBUG=true` in `web/.env.local`.
2. Set `NEXT_PUBLIC_GOOGLE_TAG_ID` to your property ID.
3. Run `npm run dev` in `web/`.
4. Open **Admin → DebugView** in GA4 (or install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger) extension).
5. Walk through major flows and confirm events + params:

| Flow | Events to confirm |
|------|-------------------|
| Sidebar | `nav_click`, `sidebar_toggle` |
| Breadcrumb switcher | `breadcrumb_switch` |
| Practice setup | `practice_setup_view`, `practice_setup_start` (toggle flags + `start_mode`) |
| Practice session | `practice_start`, `practice_question_view`, `practice_check_answer` (with `thinking_ms`, `interaction_source`), `practice_pause`, `practice_resume`, `practice_finish` |
| Results | `practice_results_view`, `practice_results_breakdown_sort`, `practice_results_methodology_toggle` |
| PDF viewer | `pdf_page_view` (`source=viewer_scroll`), `pdf_document_switch` |
| Hub pages | `hub_card_click` |
| Footer links | `outbound_click` |
| Analysis | `analysis_filter_change` |

6. In **Reports → Realtime**, confirm multiple **Page titles** (not a single generic title).

---

## First user source & geography

- **First user source** populates when traffic has a referrer or UTM (e.g. `?utm_source=whatsapp`). Direct visits often show “(direct)”.
- **Geography** appears under **Reports → User → Demographics → Country** (may require Google signals).

---

## Production deployment notes

- Env vars are baked in at Docker **build** time — always rebuild after changing `NEXT_PUBLIC_*` values.
- Allow 24–48 hours after registering custom dimensions for them to appear in standard reports.
- `lecture_slide_view` is deprecated; new PDF tracking uses `pdf_page_view`.
