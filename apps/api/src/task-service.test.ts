import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DB_PATH = ':memory:';

const { closeDatabase } = await import('./db/index.js');
const { seedDatabase } = await import('./db/seed.js');
const { listTasks } = await import('./task-service.js');

void test('returns a paginated public response for a validated task query', (context) => {
  context.after(closeDatabase);

  seedDatabase({
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
      {
        id: 'task-002',
        title: 'Repair roof',
        description: 'Replace broken tiles',
        category: 'Outdoor',
        status: 'New',
        property_id: 'prop-001',
        created_at: '2026-01-02',
        due_date: '2026-02-01',
        cost_nok: 20_000,
      },
    ],
  });

  const firstPage = listTasks({ pageSize: 1 });
  assert.deepEqual(firstPage.items, [
    {
      title: 'Repair roof',
      description: 'Replace broken tiles',
      category: 'Outdoor',
      status: 'New',
      propertyName: 'Åkerveien 3',
      createdAt: '2026-01-02',
      dueDate: '2026-02-01',
      costNok: 20_000,
    },
  ]);
  assert.equal(typeof firstPage.nextCursor, 'string');

  const secondPage = listTasks({ pageSize: 1, cursor: firstPage.nextCursor ?? undefined });
  assert.deepEqual(secondPage, {
    items: [
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
    ],
    nextCursor: null,
  });
});
