import assert from 'node:assert/strict';
import test from 'node:test';

import { createTaskPageUrl } from './api';

void test('createTaskPageUrl serializes combined task query state', () => {
  const url = createTaskPageUrl({
    filter: {
      status: 'InProgress',
      category: 'Outdoor',
      property_name: 'Åkerveien 3',
    },
    search: 'takrenne',
    sortBy: 'dueDate',
    sortDirection: 'asc',
    cursor: 'opaque-cursor',
    pageSize: 50,
  });

  assert.equal(url.pathname, '/api/tasks');
  assert.equal(url.searchParams.get('filter[status]'), 'InProgress');
  assert.equal(url.searchParams.get('filter[category]'), 'Outdoor');
  assert.equal(url.searchParams.get('filter[property_name]'), 'Åkerveien 3');
  assert.equal(url.searchParams.get('search'), 'takrenne');
  assert.equal(url.searchParams.get('sortBy'), 'dueDate');
  assert.equal(url.searchParams.get('sortDirection'), 'asc');
  assert.equal(url.searchParams.get('cursor'), 'opaque-cursor');
  assert.equal(url.searchParams.get('pageSize'), '50');
});

void test('createTaskPageUrl omits unset optional parameters', () => {
  const url = createTaskPageUrl({});

  assert.equal(url.search, '');
});
