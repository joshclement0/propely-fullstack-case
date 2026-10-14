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
  database ??= new Database(DB_PATH);
  database.pragma('foreign_keys = ON');
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
