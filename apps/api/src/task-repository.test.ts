import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DB_PATH = ':memory:';

const { closeDatabase } = await import('./db/index.js');
const { seedDatabase } = await import('./db/seed.js');
const { listTasks } = await import('./task-repository.js');

const defaultQuery = {
  sortField: 'created_at',
  sortDirection: 'desc',
  limit: 25,
} as const;

void test('returns typed internal task records with resolved property names', (context) => {
  context.after(closeDatabase);

  seedDatabase({
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
    listTasks(defaultQuery).map((task) => task.title),
    ['Repair roof', 'Clean lobby', 'Inspect roof'],
  );

  const filteredTasks = listTasks({
    ...defaultQuery,
    filter: {
      status: ['Rejected'],
      category: ['Outdoor'],
      property_name: 'Åkerveien 3',
    },
    search: 'inspect',
  });
  const filteredTask = filteredTasks[0];
  assert.ok(filteredTask);
  assert.deepEqual(
    { ...filteredTask, pagination_key: '<public-key>' },
    {
      id: 'task-001',
      title: 'Inspect roof',
      description: 'Annual inspection',
      category: 'Outdoor',
      status: 'Rejected',
      pagination_key: '<public-key>',
      property_id: 'prop-001',
      property_name: 'Åkerveien 3',
      created_at: '2026-01-01',
      due_date: null,
      cost_nok: null,
    },
  );

  assert.deepEqual(
    listTasks({
      ...defaultQuery,
      filter: { status: ['New'] },
      sortField: 'title',
      sortDirection: 'asc',
    }).map((task) => task.title),
    ['Clean lobby', 'Repair roof'],
  );
  assert.deepEqual(
    listTasks({
      ...defaultQuery,
      filter: { status: ['New', 'Rejected'] },
      sortField: 'title',
      sortDirection: 'asc',
    }).map((task) => task.title),
    ['Clean lobby', 'Inspect roof', 'Repair roof'],
  );
  assert.deepEqual(listTasks({ ...defaultQuery, search: '%' }), []);

  const firstPage = listTasks({
    ...defaultQuery,
    sortField: 'title',
    sortDirection: 'asc',
    limit: 1,
  });
  assert.deepEqual(
    firstPage.map((task) => task.title),
    ['Clean lobby', 'Inspect roof'],
  );
  const firstTask = firstPage[0];
  assert.ok(firstTask);
  assert.deepEqual(
    listTasks({
      ...defaultQuery,
      sortField: 'title',
      sortDirection: 'asc',
      limit: 1,
      after: {
        sortField: 'title',
        sortDirection: 'asc',
        value: firstTask.title,
        createdAt: firstTask.created_at,
        paginationKey: firstTask.pagination_key,
      },
    }).map((task) => task.title),
    ['Inspect roof', 'Repair roof'],
  );

  const nullDatePage = listTasks({
    ...defaultQuery,
    sortField: 'due_date',
    sortDirection: 'asc',
    limit: 1,
  });
  const nullDateTask = nullDatePage[0];
  assert.ok(nullDateTask);
  assert.equal(nullDateTask.due_date, null);
  assert.deepEqual(
    listTasks({
      ...defaultQuery,
      sortField: 'due_date',
      sortDirection: 'asc',
      limit: 1,
      after: {
        sortField: 'due_date',
        sortDirection: 'asc',
        value: null,
        createdAt: nullDateTask.created_at,
        paginationKey: nullDateTask.pagination_key,
      },
    }).map((task) => task.title),
    ['Clean lobby', 'Repair roof'],
  );
});
