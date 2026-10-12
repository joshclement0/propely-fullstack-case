import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeedData } from './seed-contract.js';

const validTask = {
  id: 'task-001',
  title: 'Inspect roof',
  description: 'Annual inspection',
  category: 'Outdoor',
  status: 'Rejected',
  property_id: 'prop-001',
  created_at: '2026-01-01',
  due_date: null,
  cost_nok: null,
};

void test('creates a typed seed contract from unknown values', () => {
  const seedData = createSeedData([validTask], [{ id: 'prop-001', name: 'Åkerveien 3' }]);

  assert.equal(seedData.tasks[0]?.status, 'Rejected');
  assert.equal(seedData.tasks[0]?.due_date, null);
  assert.equal(seedData.properties[0]?.name, 'Åkerveien 3');
});

void test('rejects seed rows that disagree with the data contract', () => {
  assert.throws(
    () => createSeedData([{ ...validTask, status: 'Archived' }], []),
    /Invalid tasks seed/,
  );
});
