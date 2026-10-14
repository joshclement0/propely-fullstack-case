import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'propely-pagination-'));
const databasePath = join(temporaryDirectory, 'tasks.db');

const legacyDatabase = new Database(databasePath);
legacyDatabase.exec(`
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
    property_id TEXT NOT NULL REFERENCES properties(id),
    created_at TEXT NOT NULL,
    due_date TEXT,
    cost_nok INTEGER
  );
  INSERT INTO properties (id, name) VALUES ('prop-001', 'Åkerveien 3');
  INSERT INTO tasks (
    id, title, description, category, status, property_id, created_at, due_date, cost_nok
  ) VALUES (
    'task-001', 'Inspect roof', 'Annual inspection', 'Outdoor', 'Rejected',
    'prop-001', '2026-01-01', NULL, NULL
  );
`);
legacyDatabase.close();

process.env.DB_PATH = databasePath;

const { closeDatabase, getDatabase } = await import('./db.js');

void test('adds public pagination keys to an existing database', (context) => {
  context.after(() => {
    closeDatabase();
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  const database = getDatabase();
  const task = database
    .prepare<[string], { pagination_key: string }>('SELECT pagination_key FROM tasks WHERE id = ?')
    .get('task-001');

  assert.ok(task?.pagination_key);
  assert.notEqual(task.pagination_key, 'task-001');
});
