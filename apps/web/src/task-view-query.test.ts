import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_TASK_VIEW_QUERY,
  parseTaskViewQuery,
  serializeTaskViewQuery,
} from './task-view-query';

void test('task view query round-trips through shareable URL parameters', () => {
  const query = {
    search: 'takrenne',
    status: 'InProgress',
    category: 'Outdoor',
    propertyName: 'Åkerveien 3',
    sortBy: 'dueDate',
    sortDirection: 'asc',
    pageSize: 50,
    cursor: 'opaque-cursor',
    page: 3,
  } as const;

  assert.deepEqual(parseTaskViewQuery(serializeTaskViewQuery(query)), query);
});

void test('task view query ignores invalid values and applies defaults', () => {
  const searchParams = new URLSearchParams(
    'status=Archived&category=Roofing&sortBy=id&sortDirection=sideways&pageSize=999',
  );

  assert.deepEqual(parseTaskViewQuery(searchParams), DEFAULT_TASK_VIEW_QUERY);
});

void test('page numbers are only retained with a pagination cursor', () => {
  assert.deepEqual(parseTaskViewQuery(new URLSearchParams('page=4')), {
    ...DEFAULT_TASK_VIEW_QUERY,
    page: 1,
  });
});
