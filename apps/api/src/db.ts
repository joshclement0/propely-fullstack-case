/**
 * SQLite setup.
 *
 * The database file is gitignored. On startup, if it does not exist, it is built
 * from the committed seed/tasks.json, which is the single source of truth for the
 * dataset. Data is never generated at runtime.
 */

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { createSeedData } from './seed-contract.js';
import * as schema from './schema.js';
import type { SeedData } from './types.js';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..');
export const DB_PATH = process.env.DB_PATH ?? join(REPO_ROOT, 'apps', 'api', 'tasks.db');
const TASKS_SEED_PATH = join(REPO_ROOT, 'seed', 'tasks.json');
const PROPERTIES_SEED_PATH = join(REPO_ROOT, 'seed', 'properties.json');
let database: Database.Database | undefined;
let orm: BetterSQLite3Database<typeof schema> | undefined;

interface TableColumn {
  name: string;
}

interface TaskId {
  id: string;
}

function migratePaginationKey(db: Database.Database): void {
  const columns = db.prepare<[], TableColumn>('PRAGMA table_info(tasks)').all();
  if (columns.length === 0) {
    return;
  }

  if (!columns.some((column) => column.name === 'pagination_key')) {
    db.transaction(() => {
      db.exec('ALTER TABLE tasks ADD COLUMN pagination_key TEXT');

      const taskIds = db.prepare<[], TaskId>('SELECT id FROM tasks').all();
      const setPaginationKey = db.prepare<[string, string]>(
        'UPDATE tasks SET pagination_key = ? WHERE id = ?',
      );
      for (const task of taskIds) {
        setPaginationKey.run(randomUUID(), task.id);
      }
    })();
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS tasks_pagination_key_idx
      ON tasks(pagination_key);
    CREATE INDEX IF NOT EXISTS tasks_created_cursor_idx
      ON tasks(created_at DESC, pagination_key ASC);
    CREATE INDEX IF NOT EXISTS tasks_status_created_cursor_idx
      ON tasks(status, created_at DESC, pagination_key ASC);
    CREATE INDEX IF NOT EXISTS tasks_category_created_cursor_idx
      ON tasks(category, created_at DESC, pagination_key ASC);
    CREATE INDEX IF NOT EXISTS tasks_property_created_cursor_idx
      ON tasks(property_id, created_at DESC, pagination_key ASC);
    CREATE INDEX IF NOT EXISTS properties_name_idx
      ON properties(name COLLATE NOCASE);
  `);
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadSeedData(): SeedData {
  for (const path of [TASKS_SEED_PATH, PROPERTIES_SEED_PATH]) {
    if (!existsSync(path)) {
      throw new Error(`Seed file not found at ${path}`);
    }
  }

  return createSeedData(readJsonFile(TASKS_SEED_PATH), readJsonFile(PROPERTIES_SEED_PATH));
}

export function databaseNeedsSeed(): boolean {
  return !existsSync(DB_PATH);
}

export function getDatabase(): Database.Database {
  if (!database) {
    database = new Database(DB_PATH);
    database.pragma('foreign_keys = ON');
    migratePaginationKey(database);
  }

  return database;
}

export function getOrm(): BetterSQLite3Database<typeof schema> {
  orm ??= drizzle(getDatabase(), { schema });
  return orm;
}

export function closeDatabase(): void {
  database?.close();
  database = undefined;
  orm = undefined;
}
