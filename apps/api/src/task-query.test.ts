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
      cursor: 'next-page-token',
      pageSize: '10',
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
      cursor: 'next-page-token',
      pageSize: 10,
    },
  );
});

void test('applies deterministic default sorting', () => {
  assert.deepEqual(parseTaskListQuery({}), {
    sortBy: 'createdAt',
    sortDirection: 'desc',
    pageSize: 25,
  });
});

void test('accepts missing and partially populated filter objects', () => {
  assert.deepEqual(parseTaskListQuery({ filter: {} }), {
    filter: {},
    sortBy: 'createdAt',
    sortDirection: 'desc',
    pageSize: 25,
  });
  assert.deepEqual(parseTaskListQuery({ filter: { status: 'Completed' } }), {
    filter: { status: 'Completed' },
    sortBy: 'createdAt',
    sortDirection: 'desc',
    pageSize: 25,
  });
});

void test('strips unsupported query parameters at every object boundary', () => {
  assert.deepEqual(
    parseTaskListQuery({
      filter: {
        status: 'New',
        property_id: 'prop-001',
      },
      unknown: 'value',
    }),
    {
      filter: { status: 'New' },
      sortBy: 'createdAt',
      sortDirection: 'desc',
      pageSize: 25,
    },
  );
});

void test('rejects malformed values for supported query parameters', () => {
  for (const query of [
    { filter: { status: 'Archived' } },
    { sortBy: 'id' },
    { sortDirection: 'sideways' },
    { cursor: '' },
    { cursor: ['one', 'two'] },
    { pageSize: 0 },
    { pageSize: 101 },
    { filter: { status: ['New', 'Completed'] } },
  ]) {
    assert.throws(() => parseTaskListQuery(query), TaskListQueryValidationError);
  }
});
