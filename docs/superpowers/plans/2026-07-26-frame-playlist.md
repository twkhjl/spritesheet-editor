# Frame Playlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users build and play a repeatable ordered list of spritesheet cells, with row-major, column-major, reverse, and custom ordering.

**Architecture:** Pure functions in `player-model.js` own sequence generation and immutable edits. The browser UI keeps a sequence cursor separate from source-cell indices, renders clickable cells over the full sheet, and drives the existing animation renderer from the selected source index.

**Tech Stack:** Node.js 22, browser ES modules, Node test runner, Express 5, Supertest.

## Global Constraints

- Cell numbers are one-based in the UI and zero-based in code.
- Duplicate cells are allowed.
- Empty sequences disable play and step controls.
- Grid changes rebuild the sequence with the active directional preset.
- Existing local-only image handling and playback controls remain.

---

### Task 1: Playlist model

**Files:**
- Modify: `public/player-model.js`
- Modify: `test/player-model.test.js`

**Interfaces:**
- Produces: `rowMajorSequence(columns, rows)`, `columnMajorSequence(columns, rows)`, `appendFrame(sequence, frameIndex)`, and `removeSequenceItem(sequence, sequenceIndex)`.

- [ ] **Step 1: Write failing tests**

```js
assert.deepEqual(rowMajorSequence(3, 2), [0, 1, 2, 3, 4, 5]);
assert.deepEqual(columnMajorSequence(3, 2), [0, 3, 1, 4, 2, 5]);
assert.deepEqual(appendFrame([0, 1, 2], 0), [0, 1, 2, 0]);
assert.deepEqual(removeSequenceItem([0, 1, 2, 0], 1), [0, 2, 0]);
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/player-model.test.js`

Expected: FAIL because the four exports do not exist.

- [ ] **Step 3: Implement immutable sequence helpers**

```js
export function rowMajorSequence(columns, rows) {
  return Array.from({ length: frameCount(columns, rows) }, (_, index) => index);
}

export function columnMajorSequence(columns, rows) {
  return Array.from({ length: frameCount(columns, rows) }, (_, index) => {
    const column = Math.floor(index / rows);
    const row = index % rows;
    return row * columns + column;
  });
}

export function appendFrame(sequence, frameIndex) {
  return [...sequence, frameIndex];
}

export function removeSequenceItem(sequence, sequenceIndex) {
  return sequence.filter((_, index) => index !== sequenceIndex);
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --test test/player-model.test.js`

Expected: all model tests pass.

```powershell
git add public/player-model.js test/player-model.test.js
git commit -m "feat: add frame playlist model"
```

### Task 2: Playlist editor and playback

**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/styles.css`
- Modify: `test/api.test.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: all four sequence helpers from Task 1.
- Produces: `#order-mode`, `#sequence-list`, `#clear-sequence`, `#use-all-frames`, and `#cell-picker`.

- [ ] **Step 1: Add failing shell assertions**

```js
assert.match(page.text, /id="order-mode"/);
assert.match(page.text, /id="sequence-list"/);
assert.match(page.text, /id="clear-sequence"/);
assert.match(page.text, /id="use-all-frames"/);
assert.match(page.text, /id="cell-picker"/);
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/api.test.js`

Expected: FAIL because playlist controls do not exist.

- [ ] **Step 3: Add playlist markup and styling**

Add an order select with values `row`, `column`, `reverse`, and `custom`; an ordered sequence strip with clear and use-all buttons; and an absolute CSS grid over the sheet. Each generated cell button has a one-based number and repeat-count badge.

- [ ] **Step 4: Drive playback from the sequence**

Initialize row-major sequence for the current grid. Render source cells with:

```js
const sourceFrame = state.sequence[state.sequencePosition];
const position = framePosition(sourceFrame, state.columns, state.rows);
```

Cell clicks append the source index and set custom mode. Sequence-item clicks remove only that position. Direction selections rebuild or reverse the sequence. Grid changes rebuild row-major or column-major sequence; custom falls back to row-major after the old grid becomes invalid.

- [ ] **Step 5: Verify automatic behavior**

Run:

```powershell
npm test
node --check public/app.js
git diff --check
```

Expected: all tests and checks pass.

- [ ] **Step 6: Verify in browser**

Load `example/autoSprite/spryte-walk.png`, clear the sequence, click cells 1, 2, 3, and 1, then verify the strip reads `1 → 2 → 3 → 1` and playback follows four sequence positions. Verify reverse, item removal, row-major, column-major, and empty-state control disabling.

- [ ] **Step 7: Commit**

```powershell
git add public/index.html public/app.js public/styles.css test/api.test.js README.md
git commit -m "feat: add frame playlist editor"
```
