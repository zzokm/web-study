# Web Study

Practice app for **Web Technology** finals — question-by-question practice, lecture slides, exam PDFs, and analytics.

| | |
|---|---|
| **Live site** | [webtech.yehia.dev](https://webtech.yehia.dev) |
| **Repository** | [github.com/zzokm/web-study](https://github.com/zzokm/web-study) |
| **Feature guide** | [docs/FEATURES.md](docs/FEATURES.md) |

Covers finals from **2021, 2024, and 2025** with explanations, frontend/backend lecture PDFs, and cross-exam repetition insights.

## Quick start

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `predev` syncs `data/` into `web/public/` automatically.

### Docker

```bash
docker compose up --build
```

Static site on port **7821**.

## Repository layout

| Path | Purpose |
|------|---------|
| [`data/`](data/) | Exam JSON, lecture PDFs, manifests, allocations, analysis markdown |
| [`docs/FEATURES.md`](docs/FEATURES.md) | Full feature reference for the app |
| [`scripts/`](scripts/) | Python tooling (`apply_topic_allocations.py`) |
| [`web/`](web/) | Next.js app (see [`web/README.md`](web/README.md)) |

## Data workflow

```bash
# Optional: tag questions with lecture topics
python scripts/apply_topic_allocations.py

# Sync into the web app (also runs before dev/build)
cd web && npm run sync
```

Do not edit `web/public/data/` by hand — it is regenerated on sync.

## Documentation

- [Feature reference](docs/FEATURES.md) — every route and capability
- [GA4 events](web/docs/GA4_EVENTS_GUIDE.md) — analytics event catalog
- [GA4 setup](web/docs/GA4_SETUP.md) — env vars and Admin dimensions
- [Third-party content](NOTICE.md) — lecture slides and exam questions

## License

Application source code is [MIT](LICENSE). Course materials are not — see [NOTICE.md](NOTICE.md).

## Contributing

Issues and pull requests welcome at [github.com/zzokm/web-study](https://github.com/zzokm/web-study). Run `cd web && npm run build` before UI changes.
