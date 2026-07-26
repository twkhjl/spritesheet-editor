# Spritesheet Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the image-generation application with a browser-only configurable spritesheet player.

**Architecture:** Express serves static files only. A pure browser module validates playback settings and calculates frame coordinates, while the UI owns local object URLs and animation timing; selected images never leave the browser.

**Tech Stack:** Node.js 22, Express 5, browser ES modules, CSS, Node test runner, Supertest.

## Global Constraints

- Accept local PNG, JPEG, and WebP spritesheets.
- Default to 5 columns, 5 rows, 25 frames, and 12 FPS.
- Read frames left-to-right and top-to-bottom.
- Do not upload, generate, transform, store, or download spritesheets.
- Preserve `npm start` as the local launch command.
- Support mobile layout, keyboard focus, and reduced motion.

---

### Task 1: Pure playback model

**Files:**
- Create: `public/player-model.js`
- Create: `test/player-model.test.js`

**Interfaces:**
- Produces: `DEFAULT_SETTINGS`, `validateSettings(settings)`, `framePosition(index, columns, rows)`, and `frameSource(index, imageWidth, imageHeight, columns, rows)`.

- [ ] **Step 1: Write failing model tests**

```js
import {
  DEFAULT_SETTINGS,
  framePosition,
  frameSource,
  validateSettings,
} from '../public/player-model.js';

assert.deepEqual(DEFAULT_SETTINGS, { columns: 5, rows: 5, frames: 25, fps: 12 });
assert.deepEqual(validateSettings(DEFAULT_SETTINGS), { valid: true, errors: [] });
assert.deepEqual(framePosition(5, 5, 5), {
  column: 0, row: 1, xPercent: 0, yPercent: 25,
});
assert.deepEqual(frameSource(24, 2560, 2560, 5, 5), {
  x: 2048, y: 2048, width: 512, height: 512,
});
assert.equal(validateSettings({ columns: 2, rows: 2, frames: 5, fps: 12 }).valid, false);
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/player-model.test.js`

Expected: FAIL because `public/player-model.js` does not exist.

- [ ] **Step 3: Implement the pure model**

```js
export const DEFAULT_SETTINGS = Object.freeze({
  columns: 5,
  rows: 5,
  frames: 25,
  fps: 12,
});

export function validateSettings(settings) {
  const errors = [];
  for (const key of ['columns', 'rows', 'frames', 'fps']) {
    if (!Number.isInteger(settings[key]) || settings[key] < 1) errors.push(`${key} 必須是正整數`);
  }
  if (settings.frames > settings.columns * settings.rows) errors.push('總幀數不可超過格子容量');
  return { valid: errors.length === 0, errors };
}

export function framePosition(index, columns, rows) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    column,
    row,
    xPercent: columns === 1 ? 0 : column * 100 / (columns - 1),
    yPercent: rows === 1 ? 0 : row * 100 / (rows - 1),
  };
}

export function frameSource(index, imageWidth, imageHeight, columns, rows) {
  const { column, row } = framePosition(index, columns, rows);
  const width = imageWidth / columns;
  const height = imageHeight / rows;
  return { x: column * width, y: row * height, width, height };
}
```

- [ ] **Step 4: Verify GREEN**

Run: `node --test test/player-model.test.js`

Expected: all model tests pass.

- [ ] **Step 5: Commit**

```powershell
git add public/player-model.js test/player-model.test.js
git commit -m "feat: add spritesheet playback model"
```

### Task 2: Static-only server

**Files:**
- Modify: `src/app.js`
- Modify: `src/server.js`
- Replace: `test/api.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `createApp()` with static assets and no `/api/jobs` endpoint.
- Consumes: Express only.

- [ ] **Step 1: Replace API tests with failing static-server tests**

```js
test('serves the player shell and model module', async () => {
  await request(createApp()).get('/').expect(200).expect(/Spritesheet Player/);
  await request(createApp()).get('/player-model.js').expect(200).expect(/framePosition/);
});

test('does not expose the old generation API', async () => {
  await request(createApp()).post('/api/jobs').expect(404);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/api.test.js`

Expected: FAIL because `createApp` still requires a job service and the old API exists.

- [ ] **Step 3: Reduce Express to static serving**

```js
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.static(path.join(rootDirectory, 'public')));
  return app;
}
```

`src/server.js` creates `createApp()` directly and listens on `Number(process.env.PORT) || 3000`.

Remove `@huggingface/transformers`, `dotenv`, `multer`, and `sharp` from dependencies with:

```powershell
npm uninstall @huggingface/transformers dotenv multer sharp
```

- [ ] **Step 4: Verify GREEN**

Run: `node --test test/api.test.js`

Expected: both server tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/app.js src/server.js test/api.test.js package.json package-lock.json
git commit -m "refactor: reduce server to static player host"
```

### Task 3: Interactive player UI and cleanup

**Files:**
- Replace: `public/index.html`
- Replace: `public/app.js`
- Replace: `public/styles.css`
- Modify: `README.md`
- Delete: obsolete files under `src/config.js`, `src/image/`, `src/jobs/`, `src/pipeline/`, `src/providers/`, `src/video/`, and obsolete tests.

**Interfaces:**
- Consumes: the four exports from `public/player-model.js`.
- Produces: local file loading, setting validation, playback controls, frame and sheet views, zoom, and local-only status.

- [ ] **Step 1: Add failing shell assertions**

Extend `test/api.test.js` to assert that `/` contains:

```js
expect(response.text).toMatch(/id="spritesheet-input"/);
expect(response.text).toMatch(/id="play-button"/);
expect(response.text).toMatch(/id="columns"/);
expect(response.text).toMatch(/id="rows"/);
expect(response.text).toMatch(/id="frames"/);
expect(response.text).toMatch(/id="fps"/);
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/api.test.js`

Expected: FAIL because the old generation form does not contain the player controls.

- [ ] **Step 3: Build the local-only player**

Implement semantic controls in `public/index.html`. In `public/app.js`, use `URL.createObjectURL(file)`, decode dimensions with an `Image`, validate settings using `validateSettings`, and render each frame with:

```js
const position = framePosition(state.frame, state.columns, state.rows);
preview.style.backgroundImage = `url("${state.url}")`;
preview.style.backgroundSize = `${state.columns * 100}% ${state.rows * 100}%`;
preview.style.backgroundPosition = `${position.xPercent}% ${position.yPercent}%`;
```

Use a timeout derived from `1000 / state.fps`; stop at the last frame when looping is disabled. Reset and revoke the previous URL when the image changes.

Style the page as a responsive dark animation desk with a cyan frame cursor, coral transport controls, a checkerboard frame lightbox, visible keyboard focus, and a reduced-motion media query.

- [ ] **Step 4: Remove obsolete generator code and document the new workflow**

Delete only the generator-specific source and tests. Rewrite `README.md` with install, start, test, accepted image formats, playback configuration, and explicit local-only privacy behavior.

- [ ] **Step 5: Verify all behavior**

Run:

```powershell
npm test
npm start
```

Expected: all tests pass; the server logs `Spritesheet Player: http://127.0.0.1:3000`.

Open the page, load `example/autoSprite/spryte-walk.png`, and verify playback, pause, stepping, configurable FPS, sheet grid, zoom, and no `/api/jobs` network request.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: replace generator with spritesheet player"
```
