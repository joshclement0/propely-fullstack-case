/** SQLite connection lifecycle and migration entrypoint. */

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join } from 'node:path';
import * as schema from './schema.js';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const MIGRATIONS_PATH = join(import.meta.dirname, 'migrations');
export const DB_PATH = process.env.DB_PATH ?? join(REPO_ROOT, 'apps', 'api', 'tasks.db');
let database: Database.Database | undefined;
let orm: BetterSQLite3Database<typeof schema> | undefined;

export function getDatabase(): Database.Database {
  if (!database) {
    database = new Database(DB_PATH);
    database.pragma('foreign_keys = ON');
    orm = drizzle(database, { schema });
    migrate(orm, { migrationsFolder: MIGRATIONS_PATH });
  }

  return database;
}

interface RowCount {
  count: number;
}

export function databaseNeedsSeed(): boolean {
  const currentDatabase = getDatabase();
  const propertyCount = currentDatabase
    .prepare<[], RowCount>('SELECT COUNT(*) AS count FROM properties')
    .get()?.count;
  const taskCount = currentDatabase
    .prepare<[], RowCount>('SELECT COUNT(*) AS count FROM tasks')
    .get()?.count;

  if (propertyCount === 0 && taskCount === 0) {
    return true;
  }

  if (!propertyCount || !taskCount) {
    throw new Error('Database contains incomplete seed data.');
  }

  return false;
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
