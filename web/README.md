# Management Study Site

Static Next.js study app for management final exams. Data is synced from the parent `mgmt/` folder (exams, pools, lectures, analysis).

## Requirements

- Node.js 20+
- npm

## Setup

```bash
cd web
npm install
npm run sync
```

`npm run sync` copies JSON and PDFs from `../` into `public/` and regenerates `src/data/generated/catalog.json`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Sync content, then start dev server |
| `npm run build` | Audit (0 moderate+), sync, static export to `out/` |
| `npm run sync` | Refresh data from parent mgmt folder |
| `npm run audit:ci` | Fail if npm audit reports moderate+ vulnerabilities |

## PDF viewing

- **Lecture pages** (`/lectures/[id]`): `react-pdf` viewer with prev/next, go-to-slide, and zoom.
- **Practice references** (`SlidePanel`): lightweight per-slide renders via `react-pdf`.

Both use `pdfjs-dist@4.10.38` and `public/pdf.worker.min.mjs` (copied on `postinstall`). Worker and API versions must stay aligned.

## Security

`package.json` uses an `overrides` entry for `postcss >= 8.5.10` so `npm audit` reports **0 vulnerabilities**. Do not remove without re-running audit.

## Deploy

After `npm run build`, deploy the `out/` directory to any static host (GitHub Pages, Netlify, etc.).

## VS Code

Open the `mgmt` workspace and run tasks **dev** or **build** (they run from `web/` and sync first).
