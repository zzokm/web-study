# Google Analytics 4 setup

**Event dictionary (what each event name means in reports):** [GA4_EVENTS_GUIDE.md](./GA4_EVENTS_GUIDE.md)

## Environment

Set in `web/.env.local` (development) or Docker `.env` (production build):

```env
GOOGLE_TAG_ID=G-XXXXXXXXXX
```

Docker Compose passes this as `NEXT_PUBLIC_GOOGLE_TAG_ID` at **build** time. Rebuild after changing:

```bash
docker compose build --no-cache
docker compose up -d
```

## What the app tracks

See **[GA4_EVENTS_GUIDE.md](./GA4_EVENTS_GUIDE.md)** for full descriptions, parameters, and how to read each event in Realtime and Explore.

Summary: `page_view`, `scroll_depth`, `ui_click`, practice events (`practice_start` … `practice_reset`), browse events (`question_expand` … `slide_preview_close`), and `practice_results_view`, `practice_results_filter`, `lecture_slide_view`.

## GA4 Admin — register custom dimensions

After events appear in **Admin → Data display → Events** (can take 24h), register **event-scoped** custom dimensions:

- `practice_mode`
- `exam_year`
- `lecture_slug`
- `question_key`
- `question_type`
- `topic`
- `browse_context`
- `correct`
- `score_percent`
- `scroll_percent`
- `link_text`
- `session_title`

**User properties** (Admin → Custom definitions → User properties):

- `last_practice_mode`
- `last_lecture_slug`
- `last_exam_year`

Optional **Key events** (conversions): `practice_finish`, `practice_check_answer`.

## Realtime verification

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger) or use **Admin → DebugView**.
2. Open the site locally with `NEXT_PUBLIC_GOOGLE_TAG_ID` set.
3. In **Reports → Realtime**, confirm:
   - Multiple **Page titles** (not only “Management Study”)
   - Events: `practice_start`, `question_expand`, `scroll_depth`, `ui_click`
4. **User property** card fills after starting a practice session.

## First user source

Shows data when traffic arrives with a referrer or UTM parameters (e.g. `?utm_source=whatsapp`). Direct visits often appear as “(direct)” until campaigns are used.

## Geography

Egypt and other countries appear under **Reports → User → Demographics → Country** (may require enabling Google signals in GA4 property settings).
