import assert from 'node:assert/strict';
import test from 'node:test';
import { htmlTagsToNewlines } from './text';

void test('replaces HTML tags with safe new lines', () => {
  assert.equal(
    htmlTagsToNewlines('First<p>Second</p><script>alert("unsafe")</script>Third'),
    'First\nSecond\nalert("unsafe")\nThird',
  );
});
