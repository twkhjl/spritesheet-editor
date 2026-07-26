import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  framePosition,
  frameSource,
  validateSettings,
} from '../public/player-model.js';

test('provides valid 5 by 5 playback defaults', () => {
  assert.deepEqual(DEFAULT_SETTINGS, {
    columns: 5,
    rows: 5,
    frames: 25,
    fps: 12,
  });
  assert.deepEqual(validateSettings(DEFAULT_SETTINGS), {
    valid: true,
    errors: [],
  });
});

test('rejects frame counts larger than the grid capacity', () => {
  const result = validateSettings({
    columns: 2,
    rows: 2,
    frames: 5,
    fps: 12,
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /總幀數/);
});

test('rejects non-positive and fractional settings', () => {
  const result = validateSettings({
    columns: 0,
    rows: 2.5,
    frames: 1,
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
