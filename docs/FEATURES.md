# Web Study — feature reference

Technical overview of every user-facing capability in the app.  
**Live site:** [webtech.yehia.dev](https://webtech.yehia.dev) · **Source:** [github.com/zzokm/web-study](https://github.com/zzokm/web-study)

---

## App shell

| Feature | Route / location | What it does |
|---------|------------------|--------------|
| Sidebar navigation | All pages | Persistent nav grouped into Home, Materials, Practice, and Analysis. Highlights the active section. |
| Exam countdown | Sidebar (top) | Counts down to the final exam window (Cairo time). Switches to “Exam ongoing” during the window, then “Exam finished” after. |
| Feedback pill | Sidebar (below countdown) | Black pill link to the Google feedback form. |
| Report issue | Header (top right) | Subtle red pill on every page. Opens a modal to describe bugs, wrong answers, or broken links; submits via a prefilled Google Form with page, question, and device context attached. |
| GitHub footer | Sidebar (bottom) | Links to the project repo and author profile. |
| Breadcrumbs | Header | Shows where you are; exam and lecture routes include dropdown switchers to jump between years or lectures without returning to an index. |
| Practice timer | Practice session (floating, top-left) | Pill anchored below the header at the content edge (beside the sidebar). Shows elapsed time with pause/resume. Pausing blurs the question area. |
| Keyboard hints | Header (practice routes) | Desktop badges and mobile tooltip for practice shortcuts (arrows, Enter, S). |
| Post-exam banner | Main content (after exam) | Confetti + links to feedback, repo, and GitHub profile when the exam window has ended. |

---

## Home (`/`)

| Feature | What it does |
|---------|--------------|
| Stats cards | Total questions, lectures, exams, and topic count from synced catalog data. |
| Practice CTA | Jump to `/practice/`. |
| Saved CTA | Jump to `/saved/`. |
| Browse shortcuts | Quick links to by-lecture, each exam year, exam PDFs, lecture tracks, and analysis. |
| Feedback promo | Card on the home page encouraging feedback via Google Form so needs and improvements can be prioritized. |

---

## Materials

### Exam files (`/exams/`, `/exams/[year]/`)

| Feature | What it does |
|---------|--------------|
| Exam index | Cards for each final year (2021, 2024, 2025) with page counts. |
| PDF viewer | Full EmbedPDF viewer for the original exam paper. |
| URL page sync | `?page=N` opens a specific page; in-viewer scroll also updates tracking. |
| Document tabs | Switch between exam PDFs in the viewer where multiple documents are loaded. |
| Breadcrumb switcher | Jump between exam years from the header. |

### Lecture slides (`/lectures/`, `/lectures/frontend/`, `/lectures/backend/`, `/lectures/[lectureId]/`)

| Feature | What it does |
|---------|--------------|
| Track index | Frontend (HTML/CSS/JS) and backend (Python/Django/HTTP) lecture lists. |
| Lecture cards | Title, blurb, and slide count per deck. |
| PDF viewer | Tabbed EmbedPDF viewer for lecture PDFs. |
| URL page sync | `?page=N` deep-links to a slide; scroll position tracked in analytics. |
| Breadcrumb switcher | Jump between lecture decks from the header. |

---

## Browse (read-only Q&A)

### By lecture (`/by-lecture/`, `/by-lecture/[slug]/`)

| Feature | What it does |
|---------|--------------|
| Lecture index | All lectures grouped by track with question counts. |
| Question accordion | Expand a row to read the stem, options, correct answer, and explanation. |
| Save button | Bookmark a question from expanded content (where shown). |
| Report issue | Flag button in expanded content opens the report modal with question context pre-filled. |

### By exam (`/by-exam/`, `/by-exam/[year]/`)

| Feature | What it does |
|---------|--------------|
| Year index | Cards linking to each exam’s question list. |
| Question accordion | Same accordion UX as by-lecture, filtered to one exam year. |

### Repetitive (`/repetitive/`)

| Feature | What it does |
|---------|--------------|
| Cross-exam stems | Questions that appear in more than one final, deduplicated by stem. |
| Accordion browse | Expand to compare wording and see which exams repeated the item. |

### Saved (`/saved/`)

| Feature | What it does |
|---------|--------------|
| Bookmark list | Questions saved via the save control during practice or browse. |
| Live updates | List refreshes when bookmarks change in another tab (custom event). |
| Accordion review | Expand saved items with full explanation. |

---

## Practice (`/practice/`)

### Practice hub (`/practice/`)

| Feature | What it does |
|---------|--------------|
| By exam year | Start a full timed-style flow for 2021, 2024, or 2025. |
| By lecture | Pick a lecture slug and practice its allocated questions. |
| Repetitive only | Practice cross-exam repeated stems. |
| Saved practice | Practice only bookmarked questions (`/practice/saved/`). |

### Practice setup (before session starts)

All practice entry points (exam, lecture, repetitive, saved) show a **setup screen** first:

| Option | What it does |
|--------|--------------|
| Shuffle question order | Randomize question sequence for the session. |
| Shuffle MCQ answers | Randomize A/B/C/D for multiple choice only; true/false unchanged. |
| Show session timer | Floating elapsed timer with pause (default on). Per-question thinking time is always recorded. |
| Exam simulation | Minimal UI: stem + options + Prev/Next only; no check, meta, save, or report until submit; **Submit exam** reveals all on results. |
| Resume / Start fresh | If in-progress progress exists for the same set + options, resume or clear and restart. |

### Practice session (all practice routes)

| Feature | What it does |
|---------|--------------|
| One question at a time | Card UI with progress bar and question index. |
| Select answer | Tap/click an option or press A–E / 1–N keyboard keys. |
| Check answer | Reveals correct/incorrect and explanation. |
| Next / Previous | Navigate after reveal; going back without checking clears partial timing. |
| Session timer | Count-up elapsed time in header; pausable. |
| Per-question timing | Records thinking time from “question shown” to “check answer”. |
| Pause overlay | Blurs question content while paused; timer stops for thinking measurement. |
| Save for later | Bookmark the current question. |
| Report issue | Flag button on the question card opens the report modal with the current question attached. |
| Progress persistence | Answers and progress saved in `localStorage` per session key. |
| Reset progress | Clears saved answers for the current session (with confirmation). |
| Keyboard shortcuts | ←/→ navigate, Enter/Space check, S save. |
| Finish | On the last question, saves results and opens the results page. |

### Practice results (`/practice/results/?id=…`)

| Feature | What it does |
|---------|--------------|
| Score summary | Correct/incorrect/skipped and percentage. |
| Timing summary | Session wall time, total thinking time, review gap, per-question stats. |
| Methodology section | Collapsible explanation of how thinking time is measured. |
| Question breakdown table | Per-question result, answer, and thinking time; sortable slowest-first. |
| Review accordion | Expand each question; filter to mistakes only. Report issue per question from expanded rows. |
| Timing on expand | Shows thinking duration when opening a timed question in review. |

---

## Analysis (`/analysis/`)

| Feature | What it does |
|---------|--------------|
| Overview stats | Unique questions, exam instances, lectures, repeated stems. |
| Exams at a glance | Per-year question counts with browse/practice links. |
| Question formats | MCQ vs true/false mix with progress bars. |
| Correct answer distribution | Tabbed by year (all / 2025 / 2024 / 2021) for T/F and MCQ option bias. |
| Lecture yield | Ranked lectures by exam question count; toggle unique vs all appearances. |
| Cross-exam repetition | Table of stems appearing in multiple finals with links to repetitive browse. |
| Per-year allocation | Which lectures contributed questions to each exam. |
| Study priorities | Thematic guidance for JavaScript, Python, Django, and HTTP. |

---

## Data & persistence (browser)

| Key | Storage | What it stores |
|-----|---------|----------------|
| `webstudy:practice-v1:*` | `localStorage` | In-progress practice selections and reveal state per session. |
| `webstudy:practice-result-v1:*` | `localStorage` | Finished practice result snapshots (score, timing, progress). |
| `webstudy:saved-v1` | `localStorage` | Bookmarked question keys and display snapshots. |

Data is **per browser** — clearing site data removes progress and saves.

---

## Analytics (GA4)

Optional Google Analytics when `NEXT_PUBLIC_GOOGLE_TAG_ID` is set.

| Area | Events (examples) |
|------|-------------------|
| Navigation | `page_view`, `nav_click`, `breadcrumb_switch`, `sidebar_toggle` |
| Practice | `practice_setup_view`, `practice_setup_start`, `practice_start`, `practice_check_answer`, `practice_pause`, `practice_finish`, … |
| Results | `practice_results_view`, `practice_results_breakdown_sort`, … |
| PDF | `pdf_page_view`, `pdf_document_switch` |
| Engagement | `scroll_depth`, `ui_click`, `hub_card_click`, `outbound_click` |

Full catalog: [`web/docs/GA4_EVENTS_GUIDE.md`](../web/docs/GA4_EVENTS_GUIDE.md).

---

## Content pipeline (maintainers)

| Step | Command / path | What it does |
|------|----------------|--------------|
| Source data | `data/exams/`, `data/manifests/`, `data/lectures/` | Exam JSON, lecture manifest, PDF assets. |
| Topic allocation | `python scripts/apply_topic_allocations.py` | Tags questions with `fe-*` / `be-*` lecture IDs from allocation maps. |
| Sync to app | `cd web && npm run sync` | Copies data into `web/public/` and regenerates `catalog.json`. |
| Build | `cd web && npm run build` | Static export to `web/out/` for deploy. |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, static export) |
| UI | React 19, Tailwind CSS, shadcn/ui (Base UI primitives) |
| PDF | EmbedPDF (`@embedpdf/react-pdf-viewer`) + pdf.js worker |
| Charts | Recharts (analysis dashboard) |
| Analytics | GA4 via `gtag.js` |
| Deploy | Docker (port 7821) or any static host for `out/` |
