# Automatic Frame Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the total-frame input and always play every cell in the configured spritesheet grid.

**Architecture:** The pure player model computes frame count from columns and rows. The browser UI reads only columns, rows, and FPS, then stores the computed count for playback and display.

**Tech Stack:** Node.js 22, browser ES modules, Node test runner, Express 5, Supertest.

## Global Constraints

- Total frames always equal columns multiplied by rows.
- Columns, rows, and FPS remain positive integers.
- Existing playback, loop, step, grid, and zoom behavior remains unchanged.
- The total-frame field and partial-grid behavior are removed.

---

### Task 1: Derive frame count from grid dimensions

**Files:**
- Modify: `public/player-model.js`
- Modify: `public/app.js`
- Modify: `public/index.html`
- Modify: `test/player-model.test.js`
- Modify: `test/api.test.js`
- Modify: `README.md`

**Interfaces:**
- Produces: `frameCount(columns, rows): number`.
- Changes: `DEFAULT_SETTINGS` becomes `{ columns, rows, fps }`.
- Changes: `validateSettings(settings)` validates only columns, rows, and FPS.

- [ ] **Step 1: Write failing model and shell tests**

```js
assert.deepEqual(DEFAULT_SETTINGS, { columns: 5, rows: 5, fps: 12 });
assert.equal(frameCount(5, 5), 25);
assert.equal(frameCount(4, 3), 12);
assert.deepEqual(validateSettings(DEFAULT_SETTINGS), { valid: true, errors: [] });
assert.doesNotMatch(page.text, /id="frames"/);
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --test test/player-model.test.js test/api.test.js
```

Expected: FAIL because `frameCount` is missing, defaults still contain `frames`, and the page still contains the field.

- [ ] **Step 3: Implement automatic frame count**

In `public/player-model.js`:

```js
export const DEFAULT_SETTINGS = Object.freeze({ columns: 5, rows: 5, fps: 12 });

export function frameCount(columns, rows) {
  return columns * rows;
}
```

Remove `frames` validation. In `public/app.js`, remove the frames element and input parsing, then assign:

```js
const settings = readSettings();
const frames = frameCount(settings.columns, settings.rows);
Object.assign(state, settings, { frames });
```

Remove the total-frame label and input from `public/index.html`. Update README wording so every grid cell is always used.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm test
node --check public/app.js
```

Expected: all tests and syntax checks pass.

- [ ] **Step 5: Verify in the browser**

Reload `http://127.0.0.1:3000/`. Confirm the total-frame field is absent, then set columns to 4 and rows to 3. Capacity and frame readout must show 12.

- [ ] **Step 6: Commit**

```powershell
git add public/player-model.js public/app.js public/index.html test/player-model.test.js test/api.test.js README.md
git commit -m "feat: derive frame count from grid"
```
