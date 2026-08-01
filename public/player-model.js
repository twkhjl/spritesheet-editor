export const DEFAULT_SETTINGS = Object.freeze({ columns: 5, rows: 5, fps: 12 });
export const PROJECT_FORMAT = 'spritesheet-editor-project';
export const PROJECT_VERSION = 1;

export function frameCount(columns, rows) { return columns * rows; }
export function rowMajorSequence(columns, rows) { return Array.from({ length: frameCount(columns, rows) }, (_, i) => i); }
export function columnMajorSequence(columns, rows) { return Array.from({ length: frameCount(columns, rows) }, (_, i) => (i % rows) * columns + Math.floor(i / rows)); }
export function appendFrame(sequence, frameIndex) { return [...sequence, frameIndex]; }
export function removeSequenceItem(sequence, sequenceIndex) { return sequence.filter((_, i) => i !== sequenceIndex); }
export function framePosition(index, columns) { return { column: index % columns, row: Math.floor(index / columns) }; }
export function frameSource(index, imageWidth, imageHeight, columns, rows) {
  const { column, row } = framePosition(index, columns);
  const width = imageWidth / columns;
  const height = imageHeight / rows;
  return { x: column * width, y: row * height, width, height };
}
export function createFrameTransforms(columns, rows) {
  return Array.from({ length: frameCount(columns, rows) }, () => ({ offsetX: 0, offsetY: 0 }));
}
export function resizeFrameTransforms(frames, nextCount) {
  return Array.from({ length: nextCount }, (_, i) => frames[i] ? { ...frames[i] } : { offsetX: 0, offsetY: 0 });
}
export function setFrameTransform(frames, frameIndex, offsetX, offsetY) {
  if (!frames[frameIndex]) return frames;
  return frames.map((frame, i) => i === frameIndex ? { offsetX: Math.round(offsetX), offsetY: Math.round(offsetY) } : { ...frame });
}
export function moveFrameTransform(frames, frameIndex, deltaX, deltaY) {
  const current = frames[frameIndex];
  return current ? setFrameTransform(frames, frameIndex, current.offsetX + deltaX, current.offsetY + deltaY) : frames;
}
export function copyFrameTransform(frames, sourceIndex, targetIndex) {
  const source = frames[sourceIndex];
  if (!source || !frames[targetIndex]) return frames;
  return setFrameTransform(frames, targetIndex, source.offsetX, source.offsetY);
}
export function applyFrameTransformToAll(frames, sourceIndex) {
  const source = frames[sourceIndex];
  return source ? frames.map(() => ({ ...source })) : frames;
}
export function validateSettings(settings) {
  const errors = [];
  for (const [key, label] of Object.entries({ columns: '欄數', rows: '列數', fps: 'FPS' })) {
    if (!Number.isInteger(settings[key]) || settings[key] < 1) errors.push(`${label}必須是正整數。`);
  }
  if (settings.fps > 60) errors.push('FPS 不可超過 60。');
  return { valid: errors.length === 0, errors };
}
export function validateProject(project) {
  const errors = [];
  if (!project || typeof project !== 'object') return { valid: false, errors: ['專案內容必須是物件。'] };
  if (project.format !== PROJECT_FORMAT) errors.push('format 不正確。');
  if (project.version !== PROJECT_VERSION) errors.push('version 不支援。');
  const columns = project.grid?.columns;
  const rows = project.grid?.rows;
  if (!Number.isInteger(columns) || columns < 1) errors.push('columns 必須是正整數。');
  if (!Number.isInteger(rows) || rows < 1) errors.push('rows 必須是正整數。');
  const count = Number.isInteger(columns) && Number.isInteger(rows) ? columns * rows : -1;
  if (!Array.isArray(project.frames) || project.frames.length !== count) errors.push('frames 長度不正確。');
  else project.frames.forEach((frame, i) => {
    if (!Number.isFinite(frame?.offsetX) || !Number.isFinite(frame?.offsetY)) errors.push(`frames[${i}] 位移不正確。`);
  });
  if (!Array.isArray(project.playback?.sequence) || project.playback.sequence.some(i => !Number.isInteger(i) || i < 0 || i >= count)) errors.push('sequence 包含無效影格。');
  return { valid: errors.length === 0, errors };
}
