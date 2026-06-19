-- Albo Formazione — initial schema
-- Idempotent: CREATE ... IF NOT EXISTS everywhere.

CREATE SCHEMA IF NOT EXISTS alboformazione;

-- ── Identity & profile ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alboformazione.users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL UNIQUE,
  display_name    text,
  sso_subject     text,
  is_super_admin  boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_login_at   timestamptz
);
CREATE INDEX IF NOT EXISTS users_email_idx ON alboformazione.users (email);

-- Membership state (associato / non_associato) + economic conditions.
CREATE TABLE IF NOT EXISTS alboformazione.memberships (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'non_associato',   -- associato | non_associato
  economic_tier text NOT NULL DEFAULT 'standard',        -- pricing tier slug
  valid_from    date,
  valid_to      date,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Roles: member, formatore, operatore, admin
CREATE TABLE IF NOT EXISTS alboformazione.roles (
  id    serial PRIMARY KEY,
  slug  text NOT NULL UNIQUE,
  label text NOT NULL
);

CREATE TABLE IF NOT EXISTS alboformazione.user_roles (
  user_id uuid NOT NULL REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  role_id integer NOT NULL REFERENCES alboformazione.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ── Catalog & content ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alboformazione.contents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text NOT NULL UNIQUE,
  title               text NOT NULL,
  summary             text,
  description         text,
  content_type        text NOT NULL DEFAULT 'ondemand',  -- live | ondemand | extra
  extra_kind          text,                              -- per extra: intervista|registrazione|divulgativo|live_esterno|social
  certifying          boolean NOT NULL DEFAULT false,
  credits_live        numeric(5,2) NOT NULL DEFAULT 0,
  credits_ondemand    numeric(5,2) NOT NULL DEFAULT 0,
  min_view_pct        integer NOT NULL DEFAULT 80,
  duration_min        integer,
  cover_url           text,
  video_key           text,                              -- storage key / external URL
  status              text NOT NULL DEFAULT 'draft',     -- draft | published | archived
  credits_active_from timestamptz,                       -- §3.2 no retroactivity
  author_id           uuid REFERENCES alboformazione.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contents_type_idx ON alboformazione.contents (content_type);
CREATE INDEX IF NOT EXISTS contents_status_idx ON alboformazione.contents (status);

CREATE TABLE IF NOT EXISTS alboformazione.content_materials (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES alboformazione.contents(id) ON DELETE CASCADE,
  title      text NOT NULL,
  file_key   text NOT NULL,
  kind       text NOT NULL DEFAULT 'document',           -- document | slide | link
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alboformazione.paths (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'draft',             -- draft | published | archived
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS alboformazione.path_items (
  path_id    uuid NOT NULL REFERENCES alboformazione.paths(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES alboformazione.contents(id) ON DELETE CASCADE,
  position   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (path_id, content_id)
);

-- ── Live events ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alboformazione.live_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id       uuid NOT NULL REFERENCES alboformazione.contents(id) ON DELETE CASCADE,
  zoom_meeting_id  text,
  join_url         text,
  start_at         timestamptz NOT NULL,
  end_at           timestamptz,
  status           text NOT NULL DEFAULT 'scheduled',    -- scheduled | live | ended
  recording_key    text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alboformazione.live_attendance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_event_id uuid NOT NULL REFERENCES alboformazione.live_events(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  joined_at     timestamptz,
  left_at       timestamptz,
  minutes       integer NOT NULL DEFAULT 0,
  credited      boolean NOT NULL DEFAULT false,
  UNIQUE (live_event_id, user_id)
);

-- ── On-demand viewing progress (§3.3) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alboformazione.view_progress (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  content_id        uuid NOT NULL REFERENCES alboformazione.contents(id) ON DELETE CASCADE,
  watched_pct       integer NOT NULL DEFAULT 0,
  last_position_sec integer NOT NULL DEFAULT 0,
  completed         boolean NOT NULL DEFAULT false,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

-- ── Unlock test (§3.4) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alboformazione.quizzes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES alboformazione.contents(id) ON DELETE CASCADE UNIQUE,
  pass_pct   integer NOT NULL DEFAULT 100,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS alboformazione.quiz_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       uuid NOT NULL REFERENCES alboformazione.quizzes(id) ON DELETE CASCADE,
  prompt        text NOT NULL,
  options       jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0,
  position      integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS alboformazione.quiz_attempts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id    uuid NOT NULL REFERENCES alboformazione.quizzes(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  score_pct  integer NOT NULL DEFAULT 0,
  passed     boolean NOT NULL DEFAULT false,
  answers    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Credits & certificates ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alboformazione.credit_ledger (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  content_id uuid REFERENCES alboformazione.contents(id) ON DELETE SET NULL,
  mode       text NOT NULL,                              -- live | ondemand
  credits    numeric(5,2) NOT NULL DEFAULT 0,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_ledger_user_idx ON alboformazione.credit_ledger (user_id);

CREATE TABLE IF NOT EXISTS alboformazione.certificates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES alboformazione.contents(id) ON DELETE CASCADE,
  credits    numeric(5,2) NOT NULL DEFAULT 0,
  serial     text NOT NULL UNIQUE,
  pdf_key    text,
  issued_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

-- ── E-commerce (§6) ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alboformazione.products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL UNIQUE,
  kind             text NOT NULL DEFAULT 'content',      -- content | path | package
  content_id       uuid REFERENCES alboformazione.contents(id) ON DELETE CASCADE,
  path_id          uuid REFERENCES alboformazione.paths(id) ON DELETE CASCADE,
  title            text NOT NULL,
  price_member     numeric(8,2) NOT NULL DEFAULT 0,
  price_non_member numeric(8,2) NOT NULL DEFAULT 0,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alboformazione.orders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'pending',            -- pending | paid | cancelled
  total      numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at    timestamptz
);
CREATE TABLE IF NOT EXISTS alboformazione.order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES alboformazione.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES alboformazione.products(id),
  unit_price numeric(8,2) NOT NULL DEFAULT 0,
  qty        integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS alboformazione.entitlements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  content_id uuid REFERENCES alboformazione.contents(id) ON DELETE CASCADE,
  path_id    uuid REFERENCES alboformazione.paths(id) ON DELETE CASCADE,
  source     text NOT NULL DEFAULT 'purchase',           -- purchase | grant | membership
  order_id   uuid REFERENCES alboformazione.orders(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS entitlements_user_idx ON alboformazione.entitlements (user_id);

-- ── Audit ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alboformazione.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email text,
  action      text NOT NULL,
  entity      text,
  entity_id   text,
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed roles (idempotent)
INSERT INTO alboformazione.roles (slug, label) VALUES
  ('member', 'Iscritto'),
  ('formatore', 'Formatore'),
  ('operatore', 'Operatore'),
  ('admin', 'Amministratore')
ON CONFLICT (slug) DO NOTHING;
