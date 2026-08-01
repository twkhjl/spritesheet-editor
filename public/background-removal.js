import { hexToRgb, removeColorFromImageData } from './color-removal-model.js';

const fileInput = document.querySelector('#file');
const enabledInput = document.querySelector('#removeBackground');
const colorInput = document.querySelector('#backgroundColor');
const toleranceInput = document.querySelector('#colorTolerance');
const featherInput = document.querySelector('#colorFeather');
const toleranceOutput = document.querySelector('#colorToleranceValue');
const featherOutput = document.querySelector('#colorFeatherValue');
const applyButton = document.querySelector('#applyBackgroundRemoval');
const status = document.querySelector('#backgroundRemovalStatus');

let originalFile = null;
let replacingFile = false;
let processingToken = 0;
let debounceTimer = null;

function setStatus(text, type = '') {
  status.textContent = text;
  status.dataset.type = type;
}

function replaceSelectedFile(file) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  replacingFile = true;
  fileInput.files = transfer.files;
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  replacingFile = false;
}

function loadFileImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('圖片無法讀取。'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('瀏覽器無法建立透明 PNG。'));
    }, 'image/png');
  });
}

async function processOriginalFile() {
  const token = ++processingToken;
  if (!originalFile) {
    setStatus('請先載入圖片。', 'warning');
    return;
  }

  if (!enabledInput.checked) {
    replaceSelectedFile(originalFile);
    setStatus('目前使用原始背景。');
    return;
  }

  applyButton.disabled = true;
  setStatus('正在移除背景顏色……');

  try {
    const image = await loadFileImage(originalFile);
    if (token !== processingToken) return;

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('瀏覽器無法建立圖片畫布。');

    context.drawImage(image, 0, 0);
    const input = context.getImageData(0, 0, canvas.width, canvas.height);
    const output = removeColorFromImageData(input, {
      target: hexToRgb(colorInput.value),
      tolerance: Number(toleranceInput.value),
      feather: Number(featherInput.value),
    });
    context.putImageData(output, 0, 0);

    const blob = await canvasToBlob(canvas);
    if (token !== processingToken) return;

    const baseName = originalFile.name.replace(/\.[^.]+$/, '');
    const processedFile = new File([blob], `${baseName}-transparent.png`, {
      type: 'image/png',
      lastModified: Date.now(),
    });
    replaceSelectedFile(processedFile);
    setStatus('顏色去背已套用，預覽與匯出都會使用透明結果。', 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '顏色去背失敗。', 'error');
  } finally {
    if (token === processingToken) applyButton.disabled = false;
  }
}

function scheduleProcessing() {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    if (enabledInput.checked && originalFile) processOriginalFile();
  }, 250);
}

fileInput.addEventListener('change', () => {
  if (replacingFile) return;
  const file = fileInput.files?.[0];
  if (!file) return;
  originalFile = file;
  processingToken += 1;
  setStatus(enabledInput.checked
    ? '圖片已載入，按「套用去背」開始處理。'
    : '目前保留原始背景。');
});

enabledInput.addEventListener('change', processOriginalFile);
applyButton.addEventListener('click', processOriginalFile);

for (const input of [colorInput, toleranceInput, featherInput]) {
  input.addEventListener('input', () => {
    toleranceOutput.value = toleranceInput.value;
    featherOutput.value = featherInput.value;
    scheduleProcessing();
  });
}

toleranceOutput.value = toleranceInput.value;
featherOutput.value = featherInput.value;
