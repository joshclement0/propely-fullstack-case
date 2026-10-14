import { isPublicTaskPage, type PublicTaskPage, type TaskListQuery } from '@propely-case/contracts';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

export function createTaskPageUrl(query: TaskListQuery): URL {
  const url = new URL(`${API_BASE_URL}/api/tasks`);

  if (query.filter?.status) url.searchParams.set('filter[status]', query.filter.status);
  if (query.filter?.category) url.searchParams.set('filter[category]', query.filter.category);
  if (query.filter?.property_name) {
    url.searchParams.set('filter[property_name]', query.filter.property_name);
  }
  if (query.search) url.searchParams.set('search', query.search);
  if (query.sortBy) url.searchParams.set('sortBy', query.sortBy);
  if (query.sortDirection) url.searchParams.set('sortDirection', query.sortDirection);
  if (query.cursor) url.searchParams.set('cursor', query.cursor);
  if (query.pageSize) url.searchParams.set('pageSize', String(query.pageSize));

  return url;
}

export async function fetchTaskPage(
  query: TaskListQuery,
  signal?: AbortSignal,
): Promise<PublicTaskPage> {
  const response = await fetch(createTaskPageUrl(query), { signal });
  if (!response.ok) {
    throw new Error(`Task request failed with status ${response.status}.`);
  }

  const result: unknown = await response.json();
  if (!isPublicTaskPage(result)) {
    throw new Error('Task response did not match the public contract.');
  }

  return result;
}
