# Web Study

Static Next.js study app for Web Technology finals. Data is synced from the repo root `data/` folder (exams, lectures, analysis).

## Requirements

- Node.js 20+
- npm

## Setup

```bash
cd web
npm install
npm run sync
```

`npm run sync` copies JSON and PDFs from `../data/` into `public/` and regenerates `src/data/generated/catalog.json`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Sync content, then start dev server |
| `npm run build` | Audit (0 moderate+), sync, static export to `out/` |
| `npm run sync` | Refresh data from repo `data/` folder |
| `npm run audit:ci` | Fail if npm audit reports moderate+ vulnerabilities |

## PDF viewing

Lecture and exam pages use the EmbedPDF viewer (`@embedpdf/react-pdf-viewer`) with tabbed documents, in-viewer scroll tracking, and URL `?page=` sync.

PDF assets are copied on `postinstall` (`pdf.worker.min.mjs`, `pdfium.wasm`).

## Security

`package.json` uses an `overrides` entry for `postcss >= 8.5.10` so `npm audit` reports **0 vulnerabilities**. Do not remove without re-running audit.

## Deploy

After `npm run build`, deploy the `out/` directory to any static host, or use the root `docker-compose.yml`.

## VS Code

Open this repo and run tasks **dev** or **build** (they run from `web/` and sync first).
