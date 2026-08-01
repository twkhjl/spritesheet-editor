import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistory, pushHistory, redoHistory, undoHistory } from '../public/history.js';

test('undo and redo frame values', () => {
  const pushed = pushHistory(createHistory(), [{ offsetX: 0 }], [{ offsetX: 2 }]);
  const undone = undoHistory(pushed);
  assert.deepEqual(undone.value, [{ offsetX: 0 }]);
  const redone = redoHistory(undone.history);
  assert.deepEqual(redone.value, [{ offsetX: 2 }]);
});
