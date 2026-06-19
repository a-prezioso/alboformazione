import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import * as schema from './schema';
import { pgliteDir, useEmbeddedDb } from './local';

// Cache the client/db on globalThis so Next.js dev HMR (which re-evaluates
// modules) reuses a single handle instead of leaking one per reload
// ("too many clients already" on Postgres; duplicate PGlite handles otherwise).
type AlboDb = ReturnType<typeof drizzlePg<typeof schema>>;
const g = globalThis as typeof globalThis & {
  __alboClient?: PGlite | ReturnType<typeof postgres>;
  __alboDb?: AlboDb;
};

let _db: AlboDb | undefined = g.__alboDb;

function init() {
  if (_db) return;

  if (useEmbeddedDb()) {
    // Embedded Postgres (PGlite): no external server, no Docker, no VPN.
    const client = (g.__alboClient as PGlite | undefined) ?? new PGlite(pgliteDir());
    _db = drizzlePglite(client, { schema }) as unknown as AlboDb;
    g.__alboClient = client;
    g.__alboDb = _db;
    return;
  }

  // Remote Postgres (production): bounded pool + idle timeout for safety.
  const url = process.env.DATABASE_URL as string;
  const client =
    (g.__alboClient as ReturnType<typeof postgres> | undefined) ??
    postgres(url, { prepare: false, max: 10, idle_timeout: 20, max_lifetime: 60 * 30 });
  _db = drizzlePg(client, { schema });
  g.__alboClient = client;
  g.__alboDb = _db;
}

export const db = new Proxy({} as AlboDb, {
  get(_, prop) {
    init();
    return (_db as never)[prop as keyof AlboDb];
  }
});

export { schema };
export * from './schema';
export type DB = AlboDb;
