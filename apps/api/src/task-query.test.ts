import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTaskListQuery, TaskListQueryValidationError } from './task-query.js';

void test('parses composable task filters and sorting', () => {
  assert.deepEqual(
    parseTaskListQuery({
      filter: {
        status: 'New',
        category: 'Outdoor',
        property_name: ' Åkerveien 3 ',
      },
      search: ' roof ',
      sortBy: 'title',
      sortDirection: 'asc',
    }),
    {
      filter: {
        status: 'New',
        category: 'Outdoor',
        property_name: 'Åkerveien 3',
      },
      search: 'roof',
      sortBy: 'title',
      sortDirection: 'asc',
    },
  );
});

void test('applies deterministic default sorting', () => {
  assert.deepEqual(parseTaskListQuery({}), {
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
});

void test('accepts missing and partially populated filter objects', () => {
  assert.deepEqual(parseTaskListQuery({ filter: {} }), {
    filter: {},
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
  assert.deepEqual(parseTaskListQuery({ filter: { status: 'Completed' } }), {
    filter: { status: 'Completed' },
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
});

void test('rejects unsupported or malformed query parameters', () => {
  for (const query of [
    { filter: { status: 'Archived' } },
    { filter: { property_id: 'prop-001' } },
    { sortBy: 'id' },
    { sortDirection: 'sideways' },
    { filter: { status: ['New', 'Completed'] } },
    { unknown: 'value' },
  ]) {
    assert.throws(() => parseTaskListQuery(query), TaskListQueryValidationError);
  }
});
