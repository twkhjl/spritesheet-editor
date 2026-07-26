import {
  appendFrame,
  columnMajorSequence,
  DEFAULT_SETTINGS,
  frameCount,
  framePosition,
  removeSequenceItem,
  rowMajorSequence,
  validateSettings,
} from './player-model.js';

const elements = {
  input: document.querySelector('#spritesheet-input'),
  dropzone: document.querySelector('#dropzone'),
  fileName: document.querySelector('#file-name'),
  columns: document.querySelector('#columns'),
  rows: document.querySelector('#rows'),
  fps: document.querySelector('#fps'),
  orderMode: document.querySelector('#order-mode'),
  loop: document.querySelector('#loop'),
  capacity: document.querySelector('#capacity'),
  fileMeta: document.querySelector('#file-meta'),
  message: document.querySelector('#message'),
  emptyState: document.querySelector('#empty-state'),
  previewArea: document.querySelector('#preview-area'),
  animationViewport: document.querySelector('#animation-viewport'),
  animationPreview: document.querySelector('#animation-preview'),
  sheetViewport: document.querySelector('#sheet-viewport'),
  sheetPreview: document.querySelector('#sheet-preview'),
  gridOverlay: document.querySelector('#grid-overlay'),
  cellPicker: document.querySelector('#cell-picker'),
  frameCursor: document.querySelector('#frame-cursor'),
  currentCell: document.querySelector('#current-cell'),
  frameCounter: document.querySelector('#frame-counter'),
  sequenceList: document.querySelector('#sequence-list'),
  clearSequence: document.querySelector('#clear-sequence'),
  useAllFrames: document.querySelector('#use-all-frames'),
  previousButton: document.querySelector('#previous-button'),
  playButton: document.querySelector('#play-button'),
  playIcon: document.querySelector('.play-icon'),
  playLabel: document.querySelector('.play-label'),
  nextButton: document.querySelector('#next-button'),
  zoom: document.querySelector('#zoom'),
  zoomValue: document.querySelector('#zoom-value'),
  viewButtons: document.querySelectorAll('[data-view]'),
};

const initialSequence = rowMajorSequence(DEFAULT_SETTINGS.columns, DEFAULT_SETTINGS.rows);
const state = {
  url: '',
  width: 0,
  height: 0,
  sequence: initialSequence,
  sequencePosition: 0,
  playing: false,
  timer: null,
  ...DEFAULT_SETTINGS,
};

function readSettings() {
  return {
    columns: Number(elements.columns.value),
    rows: Number(elements.rows.value),
    fps: Number(elements.fps.value),
  };
}

function setMessage(text, type = '') {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`.trim();
}

function stopPlayback() {
  window.clearTimeout(state.timer);
  state.timer = null;
  state.playing = false;
  elements.playIcon.textContent = '▶';
  elements.playLabel.textContent = '播放';
  elements.playButton.setAttribute('aria-pressed', 'false');
}

function syncControlState() {
  const disabled = !state.url || state.sequence.length === 0;
  elements.playButton.disabled = disabled;
  elements.previousButton.disabled = disabled;
  elements.nextButton.disabled = disabled;
  elements.clearSequence.disabled = state.sequence.length === 0;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function updateMetadata() {
  const capacity = frameCount(state.columns, state.rows);
  elements.capacity.textContent = `${capacity} 格容量`;
  if (!state.width || !state.height) {
    elements.fileMeta.innerHTML = '<span>圖片尺寸 <b>—</b></span><span>單格尺寸 <b>—</b></span>';
    return;
  }

  const cellWidth = state.width / state.columns;
  const cellHeight = state.height / state.rows;
  elements.fileMeta.innerHTML = `
    <span>圖片尺寸 <b>${state.width} × ${state.height}</b></span>
    <span>單格尺寸 <b>${formatNumber(cellWidth)} × ${formatNumber(cellHeight)}</b></span>
  `;

  if (!Number.isInteger(cellWidth) || !Number.isInteger(cellHeight)) {
    setMessage('圖片尺寸無法被格線整除，邊界可能出現小數像素。', 'warning');
  }
}

function sequenceForMode(mode) {
  if (mode === 'column') return columnMajorSequence(state.columns, state.rows);
  return rowMajorSequence(state.columns, state.rows);
}

function frameCounts() {
  const counts = new Map();
  for (const frameIndex of state.sequence) {
    counts.set(frameIndex, (counts.get(frameIndex) || 0) + 1);
  }
  return counts;
}

function renderCellPicker() {
  const counts = frameCounts();
  elements.cellPicker.replaceChildren();
  elements.cellPicker.style.gridTemplateColumns = `repeat(${state.columns}, 1fr)`;
  elements.cellPicker.style.gridTemplateRows = `repeat(${state.rows}, 1fr)`;

  for (let frameIndex = 0; frameIndex < frameCount(state.columns, state.rows); frameIndex += 1) {
    const button = document.createElement('button');
    const count = counts.get(frameIndex) || 0;
    button.type = 'button';
    button.dataset.frameIndex = String(frameIndex);
    button.setAttribute('aria-label', `將格子 ${frameIndex + 1} 加到播放清單`);
    button.innerHTML = `<span>${frameIndex + 1}</span>${count ? `<b>${count}</b>` : ''}`;
    elements.cellPicker.append(button);
  }
}

function renderSequence() {
  elements.sequenceList.replaceChildren();

  if (state.sequence.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'sequence-empty';
    empty.textContent = '請先從完整圖表選取要播放的格子';
    elements.sequenceList.append(empty);
  } else {
    state.sequence.forEach((frameIndex, sequenceIndex) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.sequenceIndex = String(sequenceIndex);
      button.setAttribute('aria-label', `移除序列第 ${sequenceIndex + 1} 項，格子 ${frameIndex + 1}`);
      button.textContent = String(frameIndex + 1);
      if (sequenceIndex === state.sequencePosition) button.classList.add('active');
      item.append(button);
      elements.sequenceList.append(item);
    });
  }

  renderCellPicker();
  syncControlState();
}

function renderFrame() {
  const sequenceLength = state.sequence.length;
  if (sequenceLength === 0) {
    elements.currentCell.textContent = '尚未選格';
    elements.frameCounter.textContent = '00 / 00';
    elements.frameCursor.hidden = true;
    renderSequence();
    return;
  }

  state.sequencePosition = Math.min(state.sequencePosition, sequenceLength - 1);
  const sourceFrame = state.sequence[state.sequencePosition];
  const position = framePosition(sourceFrame, state.columns, state.rows);
  elements.animationPreview.style.backgroundImage = `url("${state.url}")`;
  elements.animationPreview.style.backgroundSize = `${state.columns * 100}% ${state.rows * 100}%`;
  elements.animationPreview.style.backgroundPosition = `${position.xPercent}% ${position.yPercent}%`;
  elements.currentCell.textContent = `格子 ${sourceFrame + 1}`;
  elements.frameCounter.textContent = `${String(state.sequencePosition + 1).padStart(2, '0')} / ${String(sequenceLength).padStart(2, '0')}`;

  elements.gridOverlay.style.backgroundSize = `${100 / state.columns}% ${100 / state.rows}%`;
  elements.frameCursor.hidden = false;
  elements.frameCursor.style.width = `${100 / state.columns}%`;
  elements.frameCursor.style.height = `${100 / state.rows}%`;
  elements.frameCursor.style.left = `${position.column * 100 / state.columns}%`;
  elements.frameCursor.style.top = `${position.row * 100 / state.rows}%`;

  if (state.width && state.height) {
    elements.animationViewport.style.aspectRatio = `${state.width / state.columns} / ${state.height / state.rows}`;
  }
  renderSequence();
}

function rebuildSequence(mode = elements.orderMode.value) {
  const safeMode = mode === 'column' ? 'column' : 'row';
  state.sequence = sequenceForMode(safeMode);
  state.sequencePosition = 0;
  elements.orderMode.value = safeMode;
}

function applySettings({ rebuild = false } = {}) {
  const settings = readSettings();
  const result = validateSettings(settings);
  if (!result.valid) {
    stopPlayback();
    setMessage(result.errors.join(' '), 'error');
    return false;
  }

  const gridChanged = settings.columns !== state.columns || settings.rows !== state.rows;
  Object.assign(state, settings);
  if (rebuild || gridChanged) {
    stopPlayback();
    rebuildSequence(elements.orderMode.value);
  }

  updateMetadata();
  renderFrame();
  if (!state.url) {
    setMessage('載入圖片後即可播放。');
  } else if (!elements.message.classList.contains('warning')) {
    setMessage('設定已更新。');
  }
  return true;
}

function advanceFrame(direction = 1) {
  const length = state.sequence.length;
  if (length === 0) return false;

  const next = state.sequencePosition + direction;
  if (next >= length) {
    if (!elements.loop.checked) {
      state.sequencePosition = length - 1;
      stopPlayback();
      renderFrame();
      return false;
    }
    state.sequencePosition = 0;
  } else if (next < 0) {
    state.sequencePosition = length - 1;
  } else {
    state.sequencePosition = next;
  }
  renderFrame();
  return true;
}

function scheduleNextFrame() {
  window.clearTimeout(state.timer);
  if (!state.playing) return;
  state.timer = window.setTimeout(() => {
    if (advanceFrame()) scheduleNextFrame();
  }, 1000 / state.fps);
}

function togglePlayback() {
  if (!state.url || state.sequence.length === 0 || !applySettings()) return;
  state.playing = !state.playing;
  elements.playIcon.textContent = state.playing ? 'Ⅱ' : '▶';
  elements.playLabel.textContent = state.playing ? '暫停' : '播放';
  elements.playButton.setAttribute('aria-pressed', String(state.playing));
  if (state.playing) scheduleNextFrame();
  else window.clearTimeout(state.timer);
}

function showImage(file) {
  const acceptedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
  if (!acceptedTypes.has(file.type)) {
    setMessage('請選擇 PNG、JPEG 或 WebP 圖片。', 'error');
    return;
  }

  stopPlayback();
  const nextUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    if (state.url) URL.revokeObjectURL(state.url);
    state.url = nextUrl;
    state.width = image.naturalWidth;
    state.height = image.naturalHeight;
    state.sequencePosition = 0;

    elements.fileName.textContent = file.name;
    elements.dropzone.classList.add('has-file');
    elements.sheetPreview.src = state.url;
    elements.emptyState.hidden = true;
    elements.previewArea.hidden = false;
    setMessage('圖片已載入，可以開始播放。', 'success');
    applySettings();
  };
  image.onerror = () => {
    URL.revokeObjectURL(nextUrl);
    setMessage('瀏覽器無法讀取這張圖片，請確認檔案沒有損壞。', 'error');
  };
  image.src = nextUrl;
}

elements.input.addEventListener('change', () => {
  const [file] = elements.input.files;
  if (file) showImage(file);
});

for (const eventName of ['dragenter', 'dragover']) {
  elements.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropzone.classList.add('dragging');
  });
}

for (const eventName of ['dragleave', 'drop']) {
  elements.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropzone.classList.remove('dragging');
  });
}

elements.dropzone.addEventListener('drop', (event) => {
  const [file] = event.dataTransfer.files;
  if (file) showImage(file);
});

for (const input of [elements.columns, elements.rows]) {
  input.addEventListener('input', () => applySettings({ rebuild: true }));
}
elements.fps.addEventListener('input', () => {
  const wasPlaying = state.playing;
  if (applySettings() && wasPlaying) {
    state.playing = true;
    scheduleNextFrame();
  }
});

elements.orderMode.addEventListener('change', () => {
  stopPlayback();
  if (elements.orderMode.value === 'reverse') {
    state.sequence = [...state.sequence].reverse();
    state.sequencePosition = 0;
    elements.orderMode.value = 'custom';
  } else if (elements.orderMode.value !== 'custom') {
    rebuildSequence(elements.orderMode.value);
  }
  renderFrame();
});

elements.cellPicker.addEventListener('click', (event) => {
  const button = event.target.closest('[data-frame-index]');
  if (!button) return;
  stopPlayback();
  state.sequence = appendFrame(state.sequence, Number(button.dataset.frameIndex));
  if (state.sequence.length === 1) state.sequencePosition = 0;
  elements.orderMode.value = 'custom';
  setMessage(`格子 ${Number(button.dataset.frameIndex) + 1} 已加入播放清單。`, 'success');
  renderFrame();
});

elements.sequenceList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-sequence-index]');
  if (!button) return;
  stopPlayback();
  state.sequence = removeSequenceItem(state.sequence, Number(button.dataset.sequenceIndex));
  state.sequencePosition = Math.min(state.sequencePosition, Math.max(0, state.sequence.length - 1));
  elements.orderMode.value = 'custom';
  if (state.sequence.length === 0) setMessage('請先選取要播放的格子。', 'warning');
  renderFrame();
});

elements.clearSequence.addEventListener('click', () => {
  stopPlayback();
  state.sequence = [];
  state.sequencePosition = 0;
  elements.orderMode.value = 'custom';
  setMessage('請先選取要播放的格子。', 'warning');
  renderFrame();
});

elements.useAllFrames.addEventListener('click', () => {
  stopPlayback();
  rebuildSequence(elements.orderMode.value === 'column' ? 'column' : 'row');
  setMessage('已加入全部格子。', 'success');
  renderFrame();
});

elements.playButton.addEventListener('click', togglePlayback);
elements.previousButton.addEventListener('click', () => {
  stopPlayback();
  advanceFrame(-1);
});
elements.nextButton.addEventListener('click', () => {
  stopPlayback();
  advanceFrame(1);
});

elements.zoom.addEventListener('input', () => {
  const scale = Number(elements.zoom.value) / 100;
  elements.animationPreview.style.transform = `scale(${scale})`;
  elements.zoomValue.value = `${elements.zoom.value}%`;
});

for (const button of elements.viewButtons) {
  button.addEventListener('click', () => {
    elements.viewButtons.forEach((item) => item.classList.toggle('active', item === button));
    const showAnimation = button.dataset.view === 'animation';
    elements.animationViewport.hidden = !showAnimation;
    elements.sheetViewport.hidden = showAnimation;
  });
}

document.addEventListener('keydown', (event) => {
  if (!state.url || ['INPUT', 'BUTTON', 'SELECT'].includes(event.target.tagName)) return;
  if (event.code === 'Space') {
    event.preventDefault();
    togglePlayback();
  } else if (event.code === 'ArrowLeft') {
    stopPlayback();
    advanceFrame(-1);
  } else if (event.code === 'ArrowRight') {
    stopPlayback();
    advanceFrame(1);
  }
});

window.addEventListener('beforeunload', () => {
  stopPlayback();
  if (state.url) URL.revokeObjectURL(state.url);
});

applySettings();
