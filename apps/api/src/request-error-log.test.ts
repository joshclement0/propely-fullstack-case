import assert from 'node:assert/strict';
import test from 'node:test';

import { writeRequestErrorLog } from './request-error-log.js';

void test('writes structured request errors without a stack for client failures', () => {
  const entries: string[] = [];

  writeRequestErrorLog(
    {
      error: new Error('Invalid task filter.'),
      method: 'GET',
      path: '/api/tasks',
      statusCode: 400,
    },
    { log: (entry) => entries.push(entry) },
  );

  assert.deepEqual(entries, [
    JSON.stringify({
      event: 'http_request_error',
      method: 'GET',
      path: '/api/tasks',
      statusCode: 400,
      errorName: 'Error',
      message: 'Invalid task filter.',
    }),
  ]);
});

void test('includes a stack for unexpected server failures', () => {
  const entries: string[] = [];

  writeRequestErrorLog(
    {
      error: new Error('Database failed.'),
      method: 'GET',
      path: '/api/tasks',
      statusCode: 500,
    },
    { log: (entry) => entries.push(entry) },
  );

  const entry: unknown = JSON.parse(entries[0] ?? 'null');
  assert.ok(typeof entry === 'object' && entry !== null && 'stack' in entry);
});
