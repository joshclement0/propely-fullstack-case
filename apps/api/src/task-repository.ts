import {
  and,
  asc,
  desc,
  eq,
  inArray,
  sql,
  type AnyColumn,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm';
import { getOrm } from './db/index.js';
import { properties, tasks, type TaskRecord } from './db/schema.js';

export type TaskRepositorySortField =
  'title' | 'category' | 'status' | 'property_name' | 'created_at' | 'due_date' | 'cost_nok';

export type TaskRepositorySortDirection = 'asc' | 'desc';

export interface TaskRepositoryFilters {
  status?: TaskRecord['status'][];
  category?: TaskRecord['category'][];
  property_name?: TaskRecord['property_name'];
}

export interface TaskRepositoryCursor {
  sortField: TaskRepositorySortField;
  sortDirection: TaskRepositorySortDirection;
  value: string | number | null;
  createdAt: TaskRecord['created_at'];
  paginationKey: TaskRecord['pagination_key'];
}

export interface TaskRepositoryQuery {
  filter?: TaskRepositoryFilters;
  search?: string;
  sortField: TaskRepositorySortField;
  sortDirection: TaskRepositorySortDirection;
  limit: number;
  after?: TaskRepositoryCursor;
}

const TASK_SELECTION = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
  category: tasks.category,
  status: tasks.status,
  pagination_key: tasks.pagination_key,
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
  property_name: sql`${properties.name} COLLATE NOCASE`,
  created_at: tasks.created_at,
  due_date: tasks.due_date,
  cost_nok: tasks.cost_nok,
} satisfies Record<TaskRepositorySortField, SQLWrapper>;

const FILTER_COLUMNS = {
  status: tasks.status,
  category: tasks.category,
  property_name: properties.name,
} satisfies Record<keyof TaskRepositoryFilters, AnyColumn>;

function isTaskFilterName(value: string): value is keyof TaskRepositoryFilters {
  return Object.hasOwn(FILTER_COLUMNS, value);
}

function escapeLikePattern(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

function cursorCondition(cursor: TaskRepositoryCursor): SQL {
  const column = SORT_COLUMNS[cursor.sortField];
  const tieBreak = sql`(
    ${tasks.created_at} < ${cursor.createdAt}
    OR (${tasks.created_at} = ${cursor.createdAt} AND ${tasks.pagination_key} > ${cursor.paginationKey})
  )`;

  if (cursor.value === null) {
    return cursor.sortDirection === 'asc'
      ? sql`(${column} IS NOT NULL OR (${column} IS NULL AND ${tieBreak}))`
      : sql`(${column} IS NULL AND ${tieBreak})`;
  }

  return cursor.sortDirection === 'asc'
    ? sql`(${column} > ${cursor.value} OR (${column} = ${cursor.value} AND ${tieBreak}))`
    : sql`(${column} < ${cursor.value} OR ${column} IS NULL OR (${column} = ${cursor.value} AND ${tieBreak}))`;
}

export function listTasks(query: TaskRepositoryQuery): TaskRecord[] {
  const conditions: SQL[] = [];

  if (query.filter) {
    for (const filterName in query.filter) {
      if (isTaskFilterName(filterName)) {
        const value = query.filter[filterName];
        if (value !== undefined) {
          conditions.push(
            Array.isArray(value)
              ? inArray(FILTER_COLUMNS[filterName], value)
              : eq(FILTER_COLUMNS[filterName], value),
          );
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

  if (query.after) {
    conditions.push(cursorCondition(query.after));
  }

  const sort = query.sortDirection === 'asc' ? asc : desc;

  return getOrm()
    .select(TASK_SELECTION)
    .from(tasks)
    .innerJoin(properties, eq(properties.id, tasks.property_id))
    .where(and(...conditions))
    .orderBy(sort(SORT_COLUMNS[query.sortField]), desc(tasks.created_at), asc(tasks.pagination_key))
    .limit(query.limit + 1)
    .all();
}
