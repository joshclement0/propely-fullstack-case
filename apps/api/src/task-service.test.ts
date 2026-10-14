import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DB_PATH = ':memory:';

const { closeDatabase } = await import('./db.js');
const { initializeTasks, listTasks } = await import('./task-service.js');

void test('lists internal tasks for the HTTP boundary', (context) => {
  context.after(closeDatabase);

  initializeTasks({
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

  assert.deepEqual(listTasks(), [
    {
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
    },
  ]);
});
