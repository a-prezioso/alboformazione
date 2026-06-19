# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# Albo Formazione — migrator image
# Runs @alboformazione/db migrate (and seed when SEED=1) against the target DB
# (DATABASE_URL passed as runtime env). Idempotent: tracks applied migrations
# in alboformazione._migrations.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:22-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/config/package.json packages/config/
COPY packages/ai/package.json packages/ai/
COPY packages/adapters/package.json packages/adapters/

# Install only @alboformazione/db deps (incl. tsx for the migrate/seed scripts)
RUN pnpm install --filter @alboformazione/db... --frozen-lockfile

# Copy db sources + migrations
COPY packages/db packages/db/

# Run migrations, then seed if SEED=1
CMD sh -c "pnpm --filter @alboformazione/db db:migrate && if [ \"$SEED\" = \"1\" ]; then pnpm --filter @alboformazione/db db:seed; fi"
