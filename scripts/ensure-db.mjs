/**
 * Prepare the embedded local database before `pnpm dev`.
 *
 * On the first run it creates the PGlite data dir, applies migrations and loads
 * the demo seed. On later runs it detects the existing data dir and skips, so
 * dev start stays fast. No-op when DATABASE_URL points to a real Postgres
 * server (production-style setup) — there migrate/seed are run explicitly.
 */
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const url = process.env.DATABASE_URL ?? '';
if (/^postgres(ql)?:\/\//i.test(url)) {
  console.log('[ensure-db] DATABASE_URL is a Postgres server — skipping embedded setup.');
  process.exit(0);
}

const dir = process.env.PGLITE_DIR ? resolve(process.env.PGLITE_DIR) : resolve(process.cwd(), '.localdb');
const ready = existsSync(dir) && readdirSync(dir).length > 0;

if (ready) {
  console.log(`[ensure-db] local database present at ${dir} — skipping setup.`);
  process.exit(0);
}

console.log('[ensure-db] first run: creating local database (migrate + seed)…');
const env = { ...process.env, PGLITE_DIR: dir };
const run = (args) => {
  const r = spawnSync('pnpm', args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(`[ensure-db] step failed: pnpm ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
};
run(['--filter', '@alboformazione/db', 'db:migrate']);
run(['--filter', '@alboformazione/db', 'db:seed']);
console.log('[ensure-db] local database ready.');
