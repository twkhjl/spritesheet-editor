import {
  DEFAULT_SETTINGS,
  framePosition,
  validateSettings,
} from './player-model.js';

const elements = {
  input: document.querySelector('#spritesheet-input'),
  dropzone: document.querySelector('#dropzone'),
  fileName: document.querySelector('#file-name'),
  columns: document.querySelector('#columns'),
  rows: document.querySelector('#rows'),
  frames: document.querySelector('#frames'),
  fps: document.querySelector('#fps'),
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
  frameCursor: document.querySelector('#frame-cursor'),
  frameCounter: document.querySelector('#frame-counter'),
  previousButton: document.querySelector('#previous-button'),
  playButton: document.querySelector('#play-button'),
  playIcon: document.querySelector('.play-icon'),
  playLabel: document.querySelector('.play-label'),
  nextButton: document.querySelector('#next-button'),
  zoom: document.querySelector('#zoom'),
  zoomValue: document.querySelector('#zoom-value'),
  viewButtons: document.querySelectorAll('[data-view]'),
};

const state = {
  url: '',
  width: 0,
  height: 0,
  frame: 0,
  playing: false,
  timer: null,
  ...DEFAULT_SETTINGS,
};

function readSettings() {
  return {
    columns: Number(elements.columns.value),
    rows: Number(elements.rows.value),
    frames: Number(elements.frames.value),
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

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function updateMetadata() {
  const capacity = state.columns * state.rows;
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

function renderFrame() {
  const position = framePosition(state.frame, state.columns, state.rows);
  elements.animationPreview.style.backgroundImage = `url("${state.url}")`;
  elements.animationPreview.style.backgroundSize = `${state.columns * 100}% ${state.rows * 100}%`;
  elements.animationPreview.style.backgroundPosition = `${position.xPercent}% ${position.yPercent}%`;
  elements.frameCounter.textContent = `${String(state.frame + 1).padStart(2, '0')} / ${String(state.frames).padStart(2, '0')}`;

  elements.gridOverlay.style.backgroundSize = `${100 / state.columns}% ${100 / state.rows}%`;
  elements.frameCursor.style.width = `${100 / state.columns}%`;
  elements.frameCursor.style.height = `${100 / state.rows}%`;
  elements.frameCursor.style.left = `${position.column * 100 / state.columns}%`;
  elements.frameCursor.style.top = `${position.row * 100 / state.rows}%`;

  if (state.width && state.height) {
    elements.animationViewport.style.aspectRatio = `${state.width / state.columns} / ${state.height / state.rows}`;
  }
}

function applySettings() {
  const settings = readSettings();
  const result = validateSettings(settings);
  if (!result.valid) {
    stopPlayback();
    setMessage(result.errors.join(' '), 'error');
    return false;
  }

  Object.assign(state, settings);
  state.frame = Math.min(state.frame, state.frames - 1);
  updateMetadata();
  renderFrame();
  if (state.url && !elements.message.classList.contains('warning')) {
    setMessage('設定已更新。');
  }
  return true;
}

function advanceFrame(direction = 1) {
  const next = state.frame + direction;
  if (next >= state.frames) {
    if (!elements.loop.checked) {
      state.frame = state.frames - 1;
      stopPlayback();
      renderFrame();
      return false;
    }
    state.frame = 0;
  } else if (next < 0) {
    state.frame = state.frames - 1;
  } else {
    state.frame = next;
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
  if (!state.url || !applySettings()) return;
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
    state.frame = 0;

    elements.fileName.textContent = file.name;
    elements.dropzone.classList.add('has-file');
    elements.sheetPreview.src = state.url;
    elements.emptyState.hidden = true;
    elements.previewArea.hidden = false;
    elements.playButton.disabled = false;
    elements.previousButton.disabled = false;
    elements.nextButton.disabled = false;
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

for (const input of [elements.columns, elements.rows, elements.frames, elements.fps]) {
  input.addEventListener('input', () => {
    const wasPlaying = state.playing;
    if (applySettings() && wasPlaying) {
      state.playing = true;
      scheduleNextFrame();
    }
  });
}

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
  if (!state.url || ['INPUT', 'BUTTON'].includes(event.target.tagName)) return;
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
