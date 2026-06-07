# Answered pools (source of truth for reviewed chapters)

When you finish auditing a lecture’s questions against the **textbook** and **slides**, put the full chapter JSON here, then apply it everywhere.

## File naming

`data/answered/chapter-{N}-{topic-slug}.json` — same `slug` as `data/pools/`.

## Required shape (per question)

Match the Chapter 3 / Chapter 21 pattern:

| Field | Description |
|-------|-------------|
| `sourceRefs` | e.g. `["ch21,p506", "ch21:s8"]` — **slides** `chN:s…`, **textbook** `chN,p…` |
| `reference` | Human-readable quote + page/slide note |
| `explanation` | Student-facing rationale |
| `correctAnswerId` | Only change if the audit fixes a wrong key |

Optional: omit `sourceRefsParsed` — `scripts/apply_from_answered_pool.py` regenerates it.

If you only add textbook quotes (`Textbook Page 182: …`) without `sourceRefs`, the apply script will infer `chN,p…` from the reference text and merge existing `slideRef` values from the current pool file as `chN:s…`.

## Textbook page numbers

`ch21,p506` in `sourceRefs` is the **cited page number** shown to students (e.g. “Textbook Page 506”). Internally the app adds **+21** to locate the page in the split PDF (`bookPageRange` in `data/manifests/book.json`); users only see the cited number.

Chapter ranges (global, inclusive): 1 → 23–46, 2 → 47–70, 3 → 71–100, 7 → 179–200, 8 → 201–222, 11 → 269–292, 13 → 315–338, 15 → 365–388, 18 → 445–470, 21 → 521–546.

## Apply to the repo

```bash
python scripts/apply_from_answered_pool.py data/answered/chapter-21-controlling-fundamentals.json
cd web && npm run sync
```

This updates:

- `data/pools/<slug>.json`
- `data/exams/*.json` (matching `sourceFile` + question `id`)
- `data/repetitive-questions.json` (when applicable)
- `web/public/data/*` and `web/src/data/generated/catalog.json` (via sync)

## Do not edit only the web copy

Synced files under `web/public/data/` are **generated**. Edit `data/answered/`, `data/exams/`, or `data/pools/`, then run sync.
