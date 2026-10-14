import assert from 'node:assert/strict';
import test from 'node:test';

import { createTasksPdf } from './pdf';

void test('creates a PDF from the visible task rows', () => {
  const document = createTasksPdf([
    {
      title: 'Kontroller røykvarsler',
      description: 'Test i Åkerveien',
      category: 'FireSafety',
      status: 'New',
      propertyName: 'Åkerveien 3',
      createdAt: '2026-10-14',
      dueDate: null,
      costNok: 1_500,
    },
  ]);

  const bytes = document.output('arraybuffer');

  assert.ok(bytes.byteLength > 1_000);
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), '%PDF');
});
