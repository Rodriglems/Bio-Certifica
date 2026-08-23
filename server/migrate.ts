import 'dotenv/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pool } from './db';

type MigrationRow = { filename: string };

async function ensureMigrationsTable() {
  await pool.query(
    `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
    `.trim(),
  );
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<MigrationRow>('SELECT filename FROM schema_migrations');
  return new Set(result.rows.map((r) => r.filename));
}

async function listMigrationFiles(migrationsDir: string): Promise<string[]> {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.sql'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function applyMigration(filename: string, sql: string) {
  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [filename]);
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  // Os scripts npm são executados a partir da raiz do projeto. Usar o diretório
  // atual mantém este arquivo compatível tanto com CommonJS quanto com ESM.
  const migrationsDir = path.join(process.cwd(), 'server', 'migrations');

  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = await listMigrationFiles(migrationsDir);

  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log('[db] nenhuma migração pendente');
    return;
  }

  for (const filename of pending) {
    const fullPath = path.join(migrationsDir, filename);
    const sql = await fs.readFile(fullPath, 'utf8');
    console.log(`[db] aplicando ${filename}`);
    await applyMigration(filename, sql);
  }

  console.log(`[db] ok (${pending.length} migração(ões))`);
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[db] erro:', message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
