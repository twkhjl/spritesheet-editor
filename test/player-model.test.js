import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECT_FORMAT,
  PROJECT_VERSION,
  applyFrameTransformToAll,
  createFrameTransforms,
  moveFrameTransform,
  resizeFrameTransforms,
  validateProject,
} from '../public/player-model.js';

test('creates independent frame transforms', () => {
  const frames = createFrameTransforms(4, 3);
  assert.equal(frames.length, 12);
  assert.deepEqual(frames[0], { offsetX: 0, offsetY: 0 });
  assert.notEqual(frames[0], frames[1]);
});

test('moves one frame immutably', () => {
  const original = createFrameTransforms(2, 2);
  const moved = moveFrameTransform(original, 1, 3, -2);
  assert.deepEqual(moved[1], { offsetX: 3, offsetY: -2 });
  assert.deepEqual(original[1], { offsetX: 0, offsetY: 0 });
});

test('resizes and preserves transforms', () => {
  const frames = moveFrameTransform(createFrameTransforms(2, 2), 2, 4, 5);
  const bigger = resizeFrameTransforms(frames, 6);
  assert.deepEqual(bigger[2], { offsetX: 4, offsetY: 5 });
  assert.deepEqual(bigger[5], { offsetX: 0, offsetY: 0 });
  assert.equal(resizeFrameTransforms(bigger, 3).length, 3);
});

test('apply all does not share object references', () => {
  const frames = moveFrameTransform(createFrameTransforms(2, 1), 0, 4, -3);
  const all = applyFrameTransformToAll(frames, 0);
  assert.deepEqual(all[1], { offsetX: 4, offsetY: -3 });
  assert.notEqual(all[0], all[1]);
});

test('validates project', () => {
  const project = {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    grid: { columns: 2, rows: 1 },
    playback: { sequence: [0, 1] },
    frames: [{ offsetX: 0, offsetY: 0 }, { offsetX: 1, offsetY: -1 }],
  };
  assert.equal(validateProject(project).valid, true);
  project.playback.sequence = [3];
  assert.equal(validateProject(project).valid, false);
});
