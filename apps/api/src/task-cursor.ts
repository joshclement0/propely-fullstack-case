import {
  TASK_SORT_DIRECTIONS,
  TASK_SORT_FIELDS,
  type TaskListQuery,
  type TaskSortDirection,
  type TaskSortField,
} from '@propely-case/contracts';
import { createHash } from 'node:crypto';
import type { TaskRecord } from './schema.js';

export interface TaskCursorPosition {
  sortBy: TaskSortField;
  sortDirection: TaskSortDirection;
  value: string | number | null;
  created_at: string;
  pagination_key: string;
}

interface TaskCursorPayload extends TaskCursorPosition {
  version: 1;
  queryFingerprint: string;
}

export class TaskCursorValidationError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSortField = (value: unknown): value is TaskSortField =>
  typeof value === 'string' && TASK_SORT_FIELDS.some((field) => field === value);

const isSortDirection = (value: unknown): value is TaskSortDirection =>
  typeof value === 'string' && TASK_SORT_DIRECTIONS.some((direction) => direction === value);

function isCursorValue(sortBy: TaskSortField, value: unknown): value is string | number | null {
  if (sortBy === 'costNok') {
    return (typeof value === 'number' && Number.isFinite(value)) || value === null;
  }

  if (sortBy === 'dueDate') {
    return typeof value === 'string' || value === null;
  }

  return typeof value === 'string';
}

function queryFingerprint(query: TaskListQuery): string {
  const normalizedQuery = {
    status: query.filter?.status ?? null,
    category: query.filter?.category ?? null,
    property_name: query.filter?.property_name ?? null,
    search: query.search ?? null,
    sortBy: query.sortBy ?? 'createdAt',
    sortDirection: query.sortDirection ?? 'desc',
  };

  return createHash('sha256').update(JSON.stringify(normalizedQuery)).digest('base64url');
}

function getSortValue(task: TaskRecord, sortBy: TaskSortField): string | number | null {
  const values: Record<TaskSortField, string | number | null> = {
    title: task.title,
    category: task.category,
    status: task.status,
    propertyName: task.property_name,
    createdAt: task.created_at,
    dueDate: task.due_date,
    costNok: task.cost_nok,
  };

  return values[sortBy];
}

export function createTaskCursor(task: TaskRecord, query: TaskListQuery): string {
  const sortBy = query.sortBy ?? 'createdAt';
  const payload: TaskCursorPayload = {
    version: 1,
    queryFingerprint: queryFingerprint(query),
    sortBy,
    sortDirection: query.sortDirection ?? 'desc',
    value: getSortValue(task, sortBy),
    created_at: task.created_at,
    pagination_key: task.pagination_key,
  };

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function parseTaskCursor(cursor: string, query: TaskListQuery): TaskCursorPosition {
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new TaskCursorValidationError('Invalid task cursor.');
  }

  if (
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.queryFingerprint !== 'string' ||
    !isSortField(value.sortBy) ||
    !isSortDirection(value.sortDirection) ||
    !isCursorValue(value.sortBy, value.value) ||
    typeof value.created_at !== 'string' ||
    typeof value.pagination_key !== 'string'
  ) {
    throw new TaskCursorValidationError('Invalid task cursor.');
  }

  if (
    value.queryFingerprint !== queryFingerprint(query) ||
    value.sortBy !== (query.sortBy ?? 'createdAt') ||
    value.sortDirection !== (query.sortDirection ?? 'desc')
  ) {
    throw new TaskCursorValidationError('Task cursor does not match the active query.');
  }

  return {
    sortBy: value.sortBy,
    sortDirection: value.sortDirection,
    value: value.value,
    created_at: value.created_at,
    pagination_key: value.pagination_key,
  };
}
