import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSql } from './_sql';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');

async function main() {
  const sql = await getSql();

  await sql`CREATE SCHEMA IF NOT EXISTS alboformazione`;
  await sql`
    CREATE TABLE IF NOT EXISTS alboformazione._migrations (
      name        text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `;

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const existing = await sql<{ name: string }[]>`
      SELECT name FROM alboformazione._migrations WHERE name = ${file}
    `;
    if (existing.length > 0) {
      console.log(`[skip] ${file}`);
      continue;
    }
    const body = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`[apply] ${file}`);
    await sql.unsafe(body);
    await sql`INSERT INTO alboformazione._migrations (name) VALUES (${file})`;
  }

  await sql.end({ timeout: 5 });
  console.log('migrations done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
