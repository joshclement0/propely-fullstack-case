import assert from 'node:assert/strict';
import test from 'node:test';

import express from 'express';

import { createRequestTimingMiddleware, type RequestTimingEntry } from './request-timing.js';

void test('records method, path, status and elapsed time for a completed request', async () => {
  const entries: RequestTimingEntry[] = [];
  const times = [100, 112.5];
  const app = express();

  app.use(
    createRequestTimingMiddleware({
      log: (entry) => entries.push(entry),
      now: () => times.shift() ?? 0,
    }),
  );
  app.get('/timed', (_req, res) => res.status(201).json({ ok: true }));

  const server = app.listen(0, '127.0.0.1');

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a TCP address.');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/timed?ignored=secret`);
    await response.json();

    assert.deepEqual(entries, [
      {
        event: 'http_request',
        method: 'GET',
        path: '/timed',
        statusCode: 201,
        durationMs: 12.5,
        aborted: false,
      },
    ]);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
