import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendFrame,
  columnMajorSequence,
  DEFAULT_SETTINGS,
  frameCount,
  framePosition,
  frameSource,
  removeSequenceItem,
  rowMajorSequence,
  validateSettings,
} from '../public/player-model.js';

test('provides valid 5 by 5 playback defaults', () => {
  assert.deepEqual(DEFAULT_SETTINGS, {
    columns: 5,
    rows: 5,
    fps: 12,
  });
  assert.deepEqual(validateSettings(DEFAULT_SETTINGS), {
    valid: true,
    errors: [],
  });
});

test('derives total frames from grid dimensions', () => {
  assert.equal(frameCount(5, 5), 25);
  assert.equal(frameCount(4, 3), 12);
});

test('builds row-major and column-major sequences', () => {
  assert.deepEqual(rowMajorSequence(3, 2), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(columnMajorSequence(3, 2), [0, 3, 1, 4, 2, 5]);
});

test('appends duplicate frames and removes one sequence item', () => {
  const repeated = appendFrame([0, 1, 2], 0);
  assert.deepEqual(repeated, [0, 1, 2, 0]);
  assert.deepEqual(removeSequenceItem(repeated, 1), [0, 2, 0]);
  assert.deepEqual(repeated, [0, 1, 2, 0]);
});

test('rejects non-positive and fractional settings', () => {
  const result = validateSettings({
    columns: 0,
    rows: 2.5,
    fps: -1,
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 3);
});

test('maps frames from left to right and top to bottom', () => {
  assert.deepEqual(framePosition(0, 5, 5), {
    column: 0,
    row: 0,
    xPercent: 0,
    yPercent: 0,
  });
  assert.deepEqual(framePosition(5, 5, 5), {
    column: 0,
    row: 1,
    xPercent: 0,
    yPercent: 25,
  });
  assert.deepEqual(framePosition(24, 5, 5), {
    column: 4,
    row: 4,
    xPercent: 100,
    yPercent: 100,
  });
});

test('calculates source pixels for a frame', () => {
  assert.deepEqual(frameSource(24, 2560, 2560, 5, 5), {
    x: 2048,
    y: 2048,
    width: 512,
    height: 512,
  });
});
