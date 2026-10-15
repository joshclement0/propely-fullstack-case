import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_TASK_VIEW_QUERY,
  parseTaskViewQuery,
  serializeTaskViewQuery,
  type TaskViewQuery,
} from './task-view-query';

void test('task view query round-trips through shareable URL parameters', () => {
  const query: TaskViewQuery = {
    search: 'takrenne',
    statuses: ['New', 'InProgress'],
    categories: ['Cleaning', 'Outdoor'],
    propertyName: 'Åkerveien 3',
    hiddenFields: ['category', 'costNok'],
    sortBy: 'dueDate',
    sortDirection: 'asc',
    pageSize: 50,
    cursor: 'opaque-cursor',
    page: 3,
  };

  assert.deepEqual(parseTaskViewQuery(serializeTaskViewQuery(query)), query);
});

void test('task view query ignores invalid values and applies defaults', () => {
  const searchParams = new URLSearchParams(
    'status=Archived&category=Roofing&sortBy=id&sortDirection=sideways&pageSize=999',
  );

  assert.deepEqual(parseTaskViewQuery(searchParams), DEFAULT_TASK_VIEW_QUERY);
});

void test('task view query keeps valid repeated filters and hidden fields in canonical order', () => {
  const parsed = parseTaskViewQuery(
    new URLSearchParams('status=Completed&status=New&status=Nope&hidden=costNok&hidden=id'),
  );

  assert.deepEqual(parsed.statuses, ['New', 'Completed']);
  assert.deepEqual(parsed.hiddenFields, ['costNok']);
});

void test('task view query always leaves at least one field visible', () => {
  const searchParams = new URLSearchParams();
  for (const field of [
    'title',
    'category',
    'status',
    'propertyName',
    'createdAt',
    'dueDate',
    'costNok',
  ]) {
    searchParams.append('hidden', field);
  }

  assert.deepEqual(parseTaskViewQuery(searchParams).hiddenFields, [
    'category',
    'status',
    'propertyName',
    'createdAt',
    'dueDate',
    'costNok',
  ]);
});

void test('page numbers are only retained with a pagination cursor', () => {
  assert.deepEqual(parseTaskViewQuery(new URLSearchParams('page=4')), {
    ...DEFAULT_TASK_VIEW_QUERY,
    page: 1,
  });
});
