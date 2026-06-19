# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# Albo Formazione — apps/web — Next.js 15 standalone image
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=22-alpine

# ── 1. deps ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/config/package.json packages/config/
COPY packages/ai/package.json packages/ai/
COPY packages/adapters/package.json packages/adapters/

RUN pnpm install --frozen-lockfile --filter @alboformazione/web...

# ── 2. builder ───────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ARG BUILD_SHA
ARG BUILD_DATE
ENV NEXT_PUBLIC_BUILD_SHA=${BUILD_SHA}
ENV NEXT_PUBLIC_BUILD_DATE=${BUILD_DATE}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @alboformazione/web build

# ── 3. runner ────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

RUN mkdir -p /app/data/uploads && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/healthz | grep -q '"status":"ok"' || exit 1

CMD ["node", "apps/web/server.js"]
