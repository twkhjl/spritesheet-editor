import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

test('serves the player shell and model module', async () => {
  const app = createApp();
  const page = await request(app).get('/').expect(200);
  assert.match(page.text, /Spritesheet Player/);
  assert.match(page.text, /id="spritesheet-input"/);
  assert.match(page.text, /id="play-button"/);
  assert.match(page.text, /id="columns"/);
  assert.match(page.text, /id="rows"/);
  assert.doesNotMatch(page.text, /id="frames"/);
  assert.match(page.text, /id="fps"/);
  assert.match(page.text, /id="order-mode"/);
  assert.match(page.text, /id="sequence-list"/);
  assert.match(page.text, /id="clear-sequence"/);
  assert.match(page.text, /id="use-all-frames"/);
  assert.match(page.text, /id="cell-picker"/);

  const model = await request(app).get('/player-model.js').expect(200);
  assert.match(model.text, /framePosition/);
});

test('does not expose the old generation API', async () => {
  await request(createApp()).post('/api/jobs').expect(404);
});

test('updates settings while number fields are being edited', async () => {
  const script = await request(createApp()).get('/app.js').expect(200);
  assert.match(script.text, /input\.addEventListener\('input'/);
  assert.match(script.text, /setMessage\('載入圖片後即可播放。'\)/);
});
