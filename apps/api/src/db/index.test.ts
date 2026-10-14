import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const MIGRATIONS_PATH = join(import.meta.dirname, 'migrations');
const INITIAL_MIGRATION_TAG = '0000_initial_schema';
const PAGINATION_MIGRATION_TAG = '0001_add_pagination_key_and_indexes';
const INITIAL_MIGRATION_TIME = 1_792_010_628_535;

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'propely-migrations-'));
process.env.DB_PATH = join(temporaryDirectory, 'tasks.db');

const { closeDatabase, getDatabase } = await import('./index.js');

void test('runs Drizzle migrations for a fresh database exactly once', (context) => {
  context.after(() => {
    closeDatabase();
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  const database = getDatabase();
  getDatabase();

  const taskColumns = database
    .prepare<[], { name: string; notnull: number }>('PRAGMA table_info(tasks)')
    .all();
  const indexes = database
    .prepare<[], { name: string }>("SELECT name FROM sqlite_master WHERE type = 'index'")
    .all()
    .map((index) => index.name);
  const appliedMigrations = database
    .prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM __drizzle_migrations')
    .get();

  assert.equal(taskColumns.find((column) => column.name === 'pagination_key')?.notnull, 1);
  assert.ok(indexes.includes('tasks_created_cursor_idx'));
  assert.ok(indexes.includes('properties_name_idx'));
  assert.equal(appliedMigrations?.count, 2);
});

void test('backfills pagination keys when the second Drizzle migration is applied', () => {
  const migrationDirectory = mkdtempSync(join(tmpdir(), 'propely-staged-migrations-'));
  const metadataDirectory = join(migrationDirectory, 'meta');
  const database = new Database(':memory:');
  const orm = drizzle(database);

  try {
    mkdirSync(metadataDirectory);
    copyFileSync(
      join(MIGRATIONS_PATH, `${INITIAL_MIGRATION_TAG}.sql`),
      join(migrationDirectory, `${INITIAL_MIGRATION_TAG}.sql`),
    );
    writeFileSync(
      join(metadataDirectory, '_journal.json'),
      JSON.stringify({
        version: '7',
        dialect: 'sqlite',
        entries: [
          {
            idx: 0,
            version: '6',
            when: INITIAL_MIGRATION_TIME,
            tag: INITIAL_MIGRATION_TAG,
            breakpoints: true,
          },
        ],
      }),
    );

    migrate(orm, { migrationsFolder: migrationDirectory });
    database.exec(`
      INSERT INTO properties (id, name) VALUES ('prop-001', 'Åkerveien 3');
      INSERT INTO tasks (
        id, title, description, category, status, property_id, created_at, due_date, cost_nok
      ) VALUES (
        'task-001', 'Inspect roof', 'Annual inspection', 'Outdoor', 'Rejected',
        'prop-001', '2026-01-01', NULL, NULL
      );
    `);

    copyFileSync(
      join(MIGRATIONS_PATH, `${PAGINATION_MIGRATION_TAG}.sql`),
      join(migrationDirectory, `${PAGINATION_MIGRATION_TAG}.sql`),
    );
    copyFileSync(
      join(MIGRATIONS_PATH, 'meta', '_journal.json'),
      join(metadataDirectory, '_journal.json'),
    );
    migrate(orm, { migrationsFolder: migrationDirectory });

    const task = database
      .prepare<[], { pagination_key: string }>('SELECT pagination_key FROM tasks')
      .get();
    assert.match(task?.pagination_key ?? '', /^[0-9a-f]{32}$/);
  } finally {
    database.close();
    rmSync(migrationDirectory, { recursive: true, force: true });
  }
});

void test('adopts a pre-Drizzle database without losing seeded tasks', () => {
  const database = new Database(':memory:');
  const orm = drizzle(database);

  try {
    database.exec(`
      CREATE TABLE properties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        pagination_key TEXT NOT NULL UNIQUE,
        property_id TEXT NOT NULL REFERENCES properties(id),
        created_at TEXT NOT NULL,
        due_date TEXT,
        cost_nok INTEGER
      );
      CREATE INDEX properties_name_idx ON properties(name COLLATE NOCASE);
      INSERT INTO properties (id, name) VALUES ('prop-001', 'Åkerveien 3');
      INSERT INTO tasks (
        id, title, description, category, status, pagination_key,
        property_id, created_at, due_date, cost_nok
      ) VALUES (
        'task-001', 'Inspect roof', 'Annual inspection', 'Outdoor', 'Rejected', 'old-key',
        'prop-001', '2026-01-01', NULL, NULL
      );
    `);

    migrate(orm, { migrationsFolder: MIGRATIONS_PATH });

    const task = database
      .prepare<[], { pagination_key: string }>('SELECT pagination_key FROM tasks')
      .get();
    assert.match(task?.pagination_key ?? '', /^[0-9a-f]{32}$/);
    assert.notEqual(task?.pagination_key, 'old-key');
  } finally {
    database.close();
  }
});
