import { z } from 'zod';

/**
 * Runtime environment for Albo Formazione.
 * Validated lazily so that build-time (next build) does not require secrets.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1).default(''),
  AI_GATEWAY_URL: z.string().url().default('http://10.0.0.100:8000'),
  AI_GATEWAY_API_KEY: z.string().default(''),
  AI_GATEWAY_TENANT: z.string().default('alboformazione'),
  APP_BASE_URL: z.string().url().default('https://alboformazione.elitesoftwarehouse.com'),
  REDIS_URL: z.string().default('redis://alboformazione-valkey:6379'),
  UPLOAD_DIR: z.string().default('/app/data/uploads'),
  // Adapter mode: 'mock' for the POC, 'live' would wire real Zoom/Stripe/SSO.
  ADAPTER_MODE: z.enum(['mock', 'live']).default('mock'),
  // Email (authenticated SMTP, STARTTLS — ESH Google Workspace pattern).
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('Albo Formazione <a.prezioso@elitesoftwarehouse.com>'),
  MAIL_ENABLED: z.coerce.boolean().default(true),
  // Shared secret to authorize the reminders cron endpoint.
  REMINDER_TOKEN: z.string().default(''),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export type Env = z.infer<typeof schema>;

let _env: Env | undefined;

export function env(): Env {
  if (_env) return _env;
  _env = schema.parse(process.env);
  return _env;
}

/** Build info injected at build time (NEXT_PUBLIC_*). */
export const buildInfo = {
  sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? 'dev',
  date: process.env.NEXT_PUBLIC_BUILD_DATE ?? 'dev'
};
