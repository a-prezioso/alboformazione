-- Albo Formazione — expansion (M8–M11). Additive + idempotent.

-- Catalog: categories & level
ALTER TABLE alboformazione.contents ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE alboformazione.contents ADD COLUMN IF NOT EXISTS level text;   -- base | intermedio | avanzato
CREATE INDEX IF NOT EXISTS contents_category_idx ON alboformazione.contents (category);

-- CFP obligation rules (annual + triennium) — typical of professional orders
CREATE TABLE IF NOT EXISTS alboformazione.cfp_rules (
  year               integer PRIMARY KEY,
  required_annual    numeric(6,2) NOT NULL DEFAULT 0,
  triennio_label     text,
  required_triennio  numeric(6,2)
);

-- Member anagraphic details
CREATE TABLE IF NOT EXISTS alboformazione.member_details (
  user_id             uuid PRIMARY KEY REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  fiscal_code         text,
  profession          text,
  registration_number text,
  phone               text,
  city                text,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Notifications (in-app inbox + email mock)
CREATE TABLE IF NOT EXISTS alboformazione.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES alboformazione.users(id) ON DELETE CASCADE,
  type       text NOT NULL DEFAULT 'info',
  title      text NOT NULL,
  body       text,
  link       text,
  read       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON alboformazione.notifications (user_id, read);

-- Seed CFP rules (idempotent)
INSERT INTO alboformazione.cfp_rules (year, required_annual, triennio_label, required_triennio) VALUES
  (2024, 30, '2024-2026', 90),
  (2025, 30, '2024-2026', 90),
  (2026, 30, '2024-2026', 90)
ON CONFLICT (year) DO NOTHING;
