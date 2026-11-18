import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = fsSync.existsSync(path.join(__dirname, 'migrations'))
      ? path.join(__dirname, 'migrations')
      : path.join(__dirname, '..', 'src', 'db', 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    const { rows: appliedRows } = await client.query<{ name: string }>(
      'SELECT name FROM _migrations'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    for (const sqlFile of sqlFiles) {
      if (!appliedSet.has(sqlFile)) {
        console.log(`Applying migration: ${sqlFile}...`);
        const filePath = path.join(migrationsDir, sqlFile);
        const sql = await fs.readFile(filePath, 'utf-8');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [sqlFile]);
        console.log(`Applied: ${sqlFile}`);
      }
    }

    await client.query('COMMIT');
    console.log('All migrations executed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// If executed directly from CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
