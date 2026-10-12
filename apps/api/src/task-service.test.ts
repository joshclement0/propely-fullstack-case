import assert from 'node:assert/strict';
import test from 'node:test';
import { createTaskService } from './task-service.js';
import type { TaskRepository } from './task-repository.js';

void test('maps repository rows to the public contract without internal IDs', () => {
  const repository: TaskRepository = {
    initialize: () => undefined,
    listTasks: () => [
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
    ],
  };

  assert.deepEqual(createTaskService(repository).listTasks(), [
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
  ]);
});
