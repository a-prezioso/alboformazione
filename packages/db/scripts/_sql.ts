/**
 * Tiny SQL client factory shared by migrate.ts and seed.ts.
 *
 * Returns either a real postgres.js client (when DATABASE_URL is a postgres://
 * URL — production) or a thin postgres.js-compatible shim backed by embedded
 * PGlite (local/offline default). The shim implements just the surface the
 * scripts use: tagged-template queries, the identifier helper `sql('name')`,
 * the object-insert helper `sql(row)`, `sql.unsafe(text)` and `sql.end()`.
 */
import { pgliteDir, useEmbeddedDb } from '../src/local';

export interface SqlClient {
  // tagged template -> rows[]; identifier helper -> marker; object helper -> marker
  <T extends readonly unknown[] = any[]>(strings: TemplateStringsArray, ...vals: unknown[]): Promise<T>;
  (value: string): Ident;
  (row: Record<string, unknown>): InsertObj;
  unsafe(text: string): Promise<unknown>;
  end(opts?: unknown): Promise<void>;
}

interface Ident {
  __albo: 'ident';
  name: string;
}
interface InsertObj {
  __albo: 'insert';
  row: Record<string, unknown>;
}

function quoteIdent(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

function makePgliteSql(client: import('@electric-sql/pglite').PGlite): SqlClient {
  function build(strings: TemplateStringsArray, vals: unknown[]) {
    let text = '';
    const params: unknown[] = [];
    strings.forEach((chunk, i) => {
      text += chunk;
      if (i >= vals.length) return;
      const v = vals[i] as unknown;
      if (v && typeof v === 'object' && (v as Ident).__albo === 'ident') {
        text += quoteIdent((v as Ident).name);
      } else if (v && typeof v === 'object' && (v as InsertObj).__albo === 'insert') {
        const row = (v as InsertObj).row;
        const keys = Object.keys(row);
        const cols = keys.map(quoteIdent).join(', ');
        const ph = keys
          .map((k) => {
            params.push(row[k]);
            return '$' + params.length;
          })
          .join(', ');
        text += `(${cols}) VALUES (${ph})`;
      } else {
        params.push(v);
        text += '$' + params.length;
      }
    });
    return { text, params };
  }

  const sql = ((first: unknown, ...rest: unknown[]) => {
    // tagged template
    if (Array.isArray(first) && Object.prototype.hasOwnProperty.call(first, 'raw')) {
      const { text, params } = build(first as unknown as TemplateStringsArray, rest);
      return client.query(text, params).then((r) => (r as { rows: any[] }).rows);
    }
    // identifier helper: sql('schema')
    if (typeof first === 'string') {
      return { __albo: 'ident', name: first } as Ident;
    }
    // object-insert helper: sql(row)
    return { __albo: 'insert', row: first as Record<string, unknown> } as InsertObj;
  }) as unknown as SqlClient;

  sql.unsafe = (text: string) => client.exec(text);
  sql.end = async () => {
    await client.close();
  };
  return sql;
}

/** Create the SQL client for the current environment. */
export async function getSql(): Promise<SqlClient> {
  if (useEmbeddedDb()) {
    const { PGlite } = await import('@electric-sql/pglite');
    const client = new PGlite(pgliteDir());
    await client.waitReady;
    return makePgliteSql(client);
  }
  const postgres = (await import('postgres')).default;
  const url = process.env.DATABASE_URL as string;
  return postgres(url, { prepare: false, max: 1 }) as unknown as SqlClient;
}
