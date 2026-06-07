# syntax=docker/dockerfile:1

# --- Dependencies (web app) ---
FROM node:22-bookworm-slim AS deps
WORKDIR /app/web
COPY web/package.json web/package-lock.json web/.npmrc ./
# postinstall runs copy-pdf-worker; script must exist before npm ci
COPY web/scripts/copy-pdf-worker.mjs ./scripts/
RUN npm ci

# --- Build static export (sync + next build) ---
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Course data consumed by web/scripts/sync-content.mjs
COPY data ./data
COPY assets/lectures ./assets/lectures
COPY assets/book ./assets/book

COPY --from=deps /app/web/node_modules ./web/node_modules
COPY web ./web

WORKDIR /app/web
ARG NEXT_PUBLIC_GOOGLE_TAG_ID
ARG NEXT_PUBLIC_SITE_URL=https://mgmt.yehia.dev
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GOOGLE_TAG_ID=$NEXT_PUBLIC_GOOGLE_TAG_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run copy-pdf-worker && npm run build

# --- Serve static site on port 3000 ---
FROM nginx:1.27-alpine AS runner
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/web/out /usr/share/nginx/html

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
