import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';
import { createTaskRepository } from './task-repository.js';

void test('initializes storage and resolves property names without returning IDs', () => {
  const database = new Database(':memory:');
  database.pragma('foreign_keys = ON');
  const repository = createTaskRepository(database);

  repository.initialize({
    properties: [{ id: 'prop-001', name: 'Åkerveien 3' }],
    tasks: [
      {
        id: 'task-001',
        title: 'Inspect roof',
        description: 'Annual inspection',
        category: 'Outdoor',
        status: 'Rejected',
        property_id: 'prop-001',
        created_at: '2026-01-01',
        due_date: null,
        cost_nok: null,
      },
    ],
  });

  assert.deepEqual(repository.listTasks(), [
    {
      title: 'Inspect roof',
      description: 'Annual inspection',
      category: 'Outdoor',
      status: 'Rejected',
      property_name: 'Åkerveien 3',
      created_at: '2026-01-01',
      due_date: null,
      cost_nok: null,
    },
  ]);

  database.close();
});
