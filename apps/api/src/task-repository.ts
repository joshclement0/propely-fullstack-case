import { TASK_CATEGORIES, TASK_STATUSES } from '@propely-case/contracts';
import type Database from 'better-sqlite3';
import type { SeedData, TaskRow } from './types.js';

const sqlList = (values: readonly string[]): string =>
  values.map((value) => `'${value}'`).join(', ');

const CREATE_TABLES_SQL = `
  CREATE TABLE properties (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE tasks (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    category      TEXT NOT NULL CHECK (category IN (${sqlList(TASK_CATEGORIES)})),
    status        TEXT NOT NULL CHECK (status IN (${sqlList(TASK_STATUSES)})),
    property_id   TEXT NOT NULL REFERENCES properties(id),
    created_at    TEXT NOT NULL,
    due_date      TEXT,
    cost_nok      INTEGER
  );
`;

const INSERT_PROPERTY_SQL = `
  INSERT INTO properties (id, name) VALUES (@id, @name);
`;

const INSERT_TASK_SQL = `
  INSERT INTO tasks (
    id, title, description, category, status,
    property_id, created_at, due_date, cost_nok
  ) VALUES (
    @id, @title, @description, @category, @status,
    @property_id, @created_at, @due_date, @cost_nok
  );
`;

const SELECT_TASKS_SQL = `
  SELECT
    tasks.title,
    tasks.description,
    tasks.category,
    tasks.status,
    properties.name AS property_name,
    tasks.created_at,
    tasks.due_date,
    tasks.cost_nok
  FROM tasks
  INNER JOIN properties ON properties.id = tasks.property_id
  ORDER BY tasks.created_at DESC, tasks.id ASC
`;

export interface TaskRepository {
  initialize(seedData: SeedData): void;
  listTasks(): TaskRow[];
}

export function createTaskRepository(db: Database.Database): TaskRepository {
  return {
    initialize(seedData) {
      const initializeDatabase = db.transaction(() => {
        db.exec(CREATE_TABLES_SQL);

        const insertProperty = db.prepare(INSERT_PROPERTY_SQL);
        const insertTask = db.prepare(INSERT_TASK_SQL);

        for (const property of seedData.properties) insertProperty.run(property);
        for (const task of seedData.tasks) insertTask.run(task);
      });

      initializeDatabase();
    },

    listTasks() {
      return db.prepare<[], TaskRow>(SELECT_TASKS_SQL).all();
    },
  };
}
