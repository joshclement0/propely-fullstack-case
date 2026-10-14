import {
  DEFAULT_TASK_PAGE_SIZE,
  type PublicTaskPage,
  type TaskListQuery,
  type TaskSortField,
} from '@propely-case/contracts';
import { createTaskCursor, parseTaskCursor, type TaskCursorPosition } from './task-cursor.js';
import {
  listTasks as listTaskRecords,
  type TaskRepositoryCursor,
  type TaskRepositoryQuery,
  type TaskRepositorySortField,
} from './task-repository.js';
import { toPublicTask } from './task-response.js';

const REPOSITORY_SORT_FIELDS = {
  title: 'title',
  category: 'category',
  status: 'status',
  propertyName: 'property_name',
  createdAt: 'created_at',
  dueDate: 'due_date',
  costNok: 'cost_nok',
} satisfies Record<TaskSortField, TaskRepositorySortField>;

function toRepositoryCursor(cursor: TaskCursorPosition): TaskRepositoryCursor {
  return {
    sortField: REPOSITORY_SORT_FIELDS[cursor.sortBy],
    sortDirection: cursor.sortDirection,
    value: cursor.value,
    createdAt: cursor.created_at,
    paginationKey: cursor.pagination_key,
  };
}

function toRepositoryQuery(query: TaskListQuery, pageSize: number): TaskRepositoryQuery {
  const cursor = query.cursor ? parseTaskCursor(query.cursor, query) : undefined;

  return {
    filter: query.filter
      ? {
          status: query.filter.status,
          category: query.filter.category,
          property_name: query.filter.property_name,
        }
      : undefined,
    search: query.search,
    sortField: REPOSITORY_SORT_FIELDS[query.sortBy ?? 'createdAt'],
    sortDirection: query.sortDirection ?? 'desc',
    limit: pageSize,
    after: cursor ? toRepositoryCursor(cursor) : undefined,
  };
}

export function listTasks(query: TaskListQuery = {}): PublicTaskPage {
  const pageSize = query.pageSize ?? DEFAULT_TASK_PAGE_SIZE;
  const tasks = listTaskRecords(toRepositoryQuery(query, pageSize));
  const pageTasks = tasks.slice(0, pageSize);
  const lastTask = pageTasks.at(-1);

  return {
    items: pageTasks.map(toPublicTask),
    nextCursor: tasks.length > pageSize && lastTask ? createTaskCursor(lastTask, query) : null,
  };
}
