-- Email send log (observability for the mail path). Additive + idempotent.
CREATE TABLE IF NOT EXISTS alboformazione.email_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient  text NOT NULL,
  subject    text,
  status     text NOT NULL DEFAULT 'sent',   -- sent | failed | skipped
  error      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_log_created_idx ON alboformazione.email_log (created_at DESC);
