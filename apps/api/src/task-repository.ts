import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  type TaskFilters,
  type TaskListQuery,
  type TaskSortField,
} from '@propely-case/contracts';
import { and, asc, desc, eq, sql, type AnyColumn, type SQL, type SQLWrapper } from 'drizzle-orm';
import { getOrm } from './db.js';
import { properties, tasks, type TaskRecord } from './schema.js';
import type { SeedData } from './types.js';

const sqlList = (values: readonly string[]): string =>
  values.map((value) => `'${value}'`).join(', ');

const CREATE_PROPERTIES_SQL = `
  CREATE TABLE properties (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
  )
`;

const CREATE_TASKS_SQL = `
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
  )
`;

const TASK_SELECTION = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
  category: tasks.category,
  status: tasks.status,
  property_id: tasks.property_id,
  property_name: properties.name,
  created_at: tasks.created_at,
  due_date: tasks.due_date,
  cost_nok: tasks.cost_nok,
};

const SORT_COLUMNS = {
  title: sql`${tasks.title} COLLATE NOCASE`,
  category: tasks.category,
  status: tasks.status,
  propertyName: sql`${properties.name} COLLATE NOCASE`,
  createdAt: tasks.created_at,
  dueDate: tasks.due_date,
  costNok: tasks.cost_nok,
} satisfies Record<TaskSortField, SQLWrapper>;

const FILTER_COLUMNS = {
  status: tasks.status,
  category: tasks.category,
  property_name: properties.name,
} satisfies Record<keyof TaskFilters, AnyColumn>;

function isTaskFilterName(value: string): value is keyof TaskFilters {
  return Object.hasOwn(FILTER_COLUMNS, value);
}

function escapeLikePattern(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

export function initializeTaskRepository(seedData: SeedData): void {
  getOrm().transaction((transaction) => {
    transaction.run(sql.raw(CREATE_PROPERTIES_SQL));
    transaction.run(sql.raw(CREATE_TASKS_SQL));

    if (seedData.properties.length > 0) {
      transaction.insert(properties).values(seedData.properties).run();
    }
    if (seedData.tasks.length > 0) {
      transaction.insert(tasks).values(seedData.tasks).run();
    }
  });
}

export function listTasks(query: TaskListQuery = {}): TaskRecord[] {
  const conditions: SQL[] = [];

  if (query.filter) {
    for (const filterName in query.filter) {
      if (isTaskFilterName(filterName)) {
        const value = query.filter[filterName];
        if (value !== undefined) {
          conditions.push(eq(FILTER_COLUMNS[filterName], value));
        }
      }
    }
  }

  if (query.search) {
    const pattern = `%${escapeLikePattern(query.search)}%`;
    conditions.push(
      sql`(${tasks.title} LIKE ${pattern} ESCAPE '\\' COLLATE NOCASE OR ${properties.name} LIKE ${pattern} ESCAPE '\\' COLLATE NOCASE)`,
    );
  }

  const sortBy = query.sortBy ?? 'createdAt';
  const sort = query.sortDirection === 'asc' ? asc : desc;

  return getOrm()
    .select(TASK_SELECTION)
    .from(tasks)
    .innerJoin(properties, eq(properties.id, tasks.property_id))
    .where(and(...conditions))
    .orderBy(sort(SORT_COLUMNS[sortBy]), desc(tasks.created_at), asc(tasks.id))
    .all();
}
