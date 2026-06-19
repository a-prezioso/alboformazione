import { resolve } from 'node:path';

/**
 * Whether the app should use the embedded local database (PGlite) instead of a
 * remote Postgres server. True when DATABASE_URL is not a postgres:// URL,
 * which is the default for local/offline development.
 */
export function useEmbeddedDb(): boolean {
  const url = process.env.DATABASE_URL ?? '';
  return !/^postgres(ql)?:\/\//i.test(url);
}

/**
 * Absolute directory for the embedded PGlite data files.
 *
 * Resolved relative to the current working directory, which — for every entry
 * point that touches the DB — is a package folder two levels below the repo
 * root (apps/web, packages/db), so they all converge on `<root>/.localdb`.
 * Override with PGLITE_DIR if you run from a different location.
 */
export function pgliteDir(): string {
  if (process.env.PGLITE_DIR) return resolve(process.env.PGLITE_DIR);
  return resolve(process.cwd(), '../../.localdb');
}
