import {
  TASK_CATEGORIES,
  TASK_SORT_DIRECTIONS,
  TASK_SORT_FIELDS,
  TASK_STATUSES,
  type TaskCategory,
  type TaskSortDirection,
  type TaskSortField,
  type TaskStatus,
} from '@propely-case/contracts';
import { TASK_FIELDS, type TaskField } from './task-fields';

export const PAGE_SIZES = [20, 50, 100] as const;

export interface TaskViewQuery {
  search: string;
  statuses: TaskStatus[];
  categories: TaskCategory[];
  propertyName: string;
  hiddenFields: TaskField[];
  sortBy: TaskSortField;
  sortDirection: TaskSortDirection;
  pageSize: (typeof PAGE_SIZES)[number];
  cursor: string;
  page: number;
}

export const DEFAULT_TASK_VIEW_QUERY: TaskViewQuery = {
  search: '',
  statuses: [],
  categories: [],
  propertyName: '',
  hiddenFields: [],
  sortBy: 'createdAt',
  sortDirection: 'desc',
  pageSize: 20,
  cursor: '',
  page: 1,
};

const parseStatuses = (values: string[]): TaskStatus[] =>
  TASK_STATUSES.filter((status) => values.includes(status));

const parseCategories = (values: string[]): TaskCategory[] =>
  TASK_CATEGORIES.filter((category) => values.includes(category));

const parseHiddenFields = (values: string[]): TaskField[] => {
  const hiddenFields = TASK_FIELDS.filter((field) => values.includes(field));
  return hiddenFields.length === TASK_FIELDS.length
    ? hiddenFields.filter((field) => field !== 'title')
    : hiddenFields;
};

export const parsePageSize = (value: string): TaskViewQuery['pageSize'] => {
  const pageSize = Number(value);
  return PAGE_SIZES.find((size) => size === pageSize) ?? DEFAULT_TASK_VIEW_QUERY.pageSize;
};

const parseSortField = (value: string | null): TaskSortField =>
  TASK_SORT_FIELDS.find((field) => field === value) ?? DEFAULT_TASK_VIEW_QUERY.sortBy;

const parseSortDirection = (value: string | null): TaskSortDirection =>
  TASK_SORT_DIRECTIONS.find((direction) => direction === value) ??
  DEFAULT_TASK_VIEW_QUERY.sortDirection;

const parsePage = (value: string | null, hasCursor: boolean): number => {
  if (!hasCursor) return 1;

  const page = Number(value);
  return Number.isSafeInteger(page) && page > 1 ? page : 1;
};

export function parseTaskViewQuery(searchParams: URLSearchParams): TaskViewQuery {
  const cursor = searchParams.get('cursor') ?? '';

  return {
    search: searchParams.get('search') ?? '',
    statuses: parseStatuses(searchParams.getAll('status')),
    categories: parseCategories(searchParams.getAll('category')),
    propertyName: searchParams.get('property') ?? '',
    hiddenFields: parseHiddenFields(searchParams.getAll('hidden')),
    sortBy: parseSortField(searchParams.get('sortBy')),
    sortDirection: parseSortDirection(searchParams.get('sortDirection')),
    pageSize: parsePageSize(searchParams.get('pageSize') ?? ''),
    cursor,
    page: parsePage(searchParams.get('page'), Boolean(cursor)),
  };
}

export function serializeTaskViewQuery(query: TaskViewQuery): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (query.search) searchParams.set('search', query.search);
  query.statuses.forEach((status) => searchParams.append('status', status));
  query.categories.forEach((category) => searchParams.append('category', category));
  if (query.propertyName) searchParams.set('property', query.propertyName);
  query.hiddenFields.forEach((field) => searchParams.append('hidden', field));
  searchParams.set('sortBy', query.sortBy);
  searchParams.set('sortDirection', query.sortDirection);
  searchParams.set('pageSize', String(query.pageSize));
  if (query.cursor) {
    searchParams.set('cursor', query.cursor);
    searchParams.set('page', String(query.page));
  }

  return searchParams;
}
