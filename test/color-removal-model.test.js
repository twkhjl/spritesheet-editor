import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjustedAlpha,
  colorDistance,
  hexToRgb,
} from '../public/color-removal-model.js';

test('converts a six-digit hex color to RGB', () => {
  assert.deepEqual(hexToRgb('#12a0ff'), {
    red: 18,
    green: 160,
    blue: 255,
  });
});

test('rejects invalid background colors', () => {
  assert.throws(() => hexToRgb('#fff'), TypeError);
  assert.throws(() => hexToRgb('not-a-color'), TypeError);
});

test('calculates RGB distance', () => {
  assert.equal(colorDistance(255, 255, 255, {
    red: 255,
    green: 255,
    blue: 255,
  }), 0);

  assert.equal(colorDistance(3, 4, 0, {
    red: 0,
    green: 0,
    blue: 0,
  }), 5);
});

test('makes colors inside tolerance transparent', () => {
  assert.equal(adjustedAlpha(255, 10, 20, 0), 0);
});

test('preserves colors outside a hard tolerance', () => {
  assert.equal(adjustedAlpha(180, 21, 20, 0), 180);
});

test('softens alpha inside the feather range', () => {
  assert.equal(adjustedAlpha(200, 25, 20, 10), 100);
});
