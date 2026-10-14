import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DB_PATH = ':memory:';

const { closeDatabase } = await import('./db.js');
const { initializeTaskRepository, listTasks } = await import('./task-repository.js');

void test('returns typed internal task records with resolved property names', (context) => {
  context.after(closeDatabase);

  initializeTaskRepository({
    properties: [
      { id: 'prop-001', name: 'Åkerveien 3' },
      { id: 'prop-002', name: 'Bryggen 5' },
    ],
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
      {
        id: 'task-002',
        title: 'Repair roof',
        description: 'Replace broken tiles',
        category: 'Outdoor',
        status: 'New',
        property_id: 'prop-001',
        created_at: '2026-01-03',
        due_date: '2026-02-01',
        cost_nok: 20_000,
      },
      {
        id: 'task-003',
        title: 'Clean lobby',
        description: 'Weekly cleaning',
        category: 'Cleaning',
        status: 'New',
        property_id: 'prop-002',
        created_at: '2026-01-02',
        due_date: '2026-01-10',
        cost_nok: 1_000,
      },
    ],
  });

  assert.deepEqual(
    listTasks().map((task) => task.title),
    ['Repair roof', 'Clean lobby', 'Inspect roof'],
  );

  assert.deepEqual(
    listTasks({
      filter: {
        status: 'Rejected',
        category: 'Outdoor',
        property_name: 'Åkerveien 3',
      },
      search: 'inspect',
    }),
    [
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
    ],
  );

  assert.deepEqual(
    listTasks({
      filter: { status: 'New' },
      sortBy: 'title',
      sortDirection: 'asc',
    }).map((task) => task.title),
    ['Clean lobby', 'Repair roof'],
  );
  assert.deepEqual(listTasks({ search: '%' }), []);
});
