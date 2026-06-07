# Web Study (Next.js app)

Static Next.js study app for Web Technology finals. Data syncs from the repo root [`data/`](../data/) folder.

| | |
|---|---|
| **Live** | [webtech.yehia.dev](https://webtech.yehia.dev) |
| **Repo** | [github.com/zzokm/web-study](https://github.com/zzokm/web-study) |
| **Features** | [../docs/FEATURES.md](../docs/FEATURES.md) |

## Setup

```bash
npm install
npm run sync
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Sync + dev server |
| `npm run build` | Audit, sync, static export → `out/` |
| `npm run sync` | Copy `../data/` → `public/`, regenerate catalog |
| `npm run lint` | ESLint (`src/`) |
| `npm run audit:ci` | Fail on moderate+ npm audit findings |

## PDF viewing

Lecture and exam routes use EmbedPDF with tabbed documents, `?page=` URL sync, and in-viewer scroll tracking.

## Analytics

Optional GA4 — see [docs/GA4_SETUP.md](docs/GA4_SETUP.md) and [docs/GA4_EVENTS_GUIDE.md](docs/GA4_EVENTS_GUIDE.md).

## Deploy

`npm run build` then serve `out/`, or use root `docker compose up --build` (port 7821).
