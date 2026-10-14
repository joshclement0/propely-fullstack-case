import assert from 'node:assert/strict';
import test from 'node:test';
import { toPublicTask } from './task-response.js';

void test('formats an internal task record without exposing storage identifiers', () => {
  assert.deepEqual(
    toPublicTask({
      id: 'task-001',
      title: 'Inspect roof',
      description: 'Annual inspection',
      category: 'Outdoor',
      status: 'Rejected',
      property_id: 'prop-001',
      property_name: 'Åkerveien 3',
      created_at: '2026-01-01',
      due_date: null,
      cost_nok: null,
    }),
    {
      title: 'Inspect roof',
      description: 'Annual inspection',
      category: 'Outdoor',
      status: 'Rejected',
      propertyName: 'Åkerveien 3',
      createdAt: '2026-01-01',
      dueDate: null,
      costNok: null,
    },
  );
});
