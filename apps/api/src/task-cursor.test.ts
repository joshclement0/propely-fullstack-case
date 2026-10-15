import assert from 'node:assert/strict';
import test from 'node:test';
import { createTaskCursor, parseTaskCursor, TaskCursorValidationError } from './task-cursor.js';

const task = {
  id: 'task-001',
  pagination_key: 'public-page-key',
  title: 'Inspect roof',
  description: 'Annual inspection',
  category: 'Outdoor',
  status: 'Rejected',
  property_id: 'prop-001',
  property_name: 'Åkerveien 3',
  created_at: '2026-01-01',
  due_date: null,
  cost_nok: null,
} as const;

void test('round-trips an opaque cursor for the active query', () => {
  const query = { sortBy: 'title', sortDirection: 'asc', search: 'roof' } as const;
  const cursor = createTaskCursor(task, query);

  assert.deepEqual(parseTaskCursor(cursor, query), {
    sortBy: 'title',
    sortDirection: 'asc',
    value: 'Inspect roof',
    created_at: '2026-01-01',
    pagination_key: 'public-page-key',
  });
  assert.equal(cursor.includes('task-001'), false);
  const decodedCursor = Buffer.from(cursor, 'base64url').toString('utf8');
  assert.equal(decodedCursor.includes('sortBy'), false);
  assert.equal(decodedCursor.includes('sortDirection'), false);
});

void test('rejects malformed cursors and cursors from a different query', () => {
  assert.throws(() => parseTaskCursor('not-json', {}), TaskCursorValidationError);

  const cursor = createTaskCursor(task, { filter: { status: ['Rejected'] } });
  assert.throws(
    () => parseTaskCursor(cursor, { filter: { status: ['New'] } }),
    TaskCursorValidationError,
  );
});
