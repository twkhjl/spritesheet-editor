import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

test('serves the player shell and model module', async () => {
  const app = createApp();
  const page = await request(app).get('/').expect(200);
  assert.match(page.text, /Spritesheet Player/);

  const model = await request(app).get('/player-model.js').expect(200);
  assert.match(model.text, /framePosition/);
});

test('does not expose the old generation API', async () => {
  await request(createApp()).post('/api/jobs').expect(404);
});
