export const DEFAULT_SETTINGS = Object.freeze({
  columns: 5,
  rows: 5,
  fps: 12,
});

export function frameCount(columns, rows) {
  return columns * rows;
}

export function validateSettings(settings) {
  const errors = [];
  const labels = {
    columns: '欄數',
    rows: '列數',
    fps: 'FPS',
  };

  for (const key of Object.keys(labels)) {
    if (!Number.isInteger(settings[key]) || settings[key] < 1) {
      errors.push(`${labels[key]}必須是正整數。`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function framePosition(index, columns, rows) {
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    column,
    row,
    xPercent: columns === 1 ? 0 : (column * 100) / (columns - 1),
    yPercent: rows === 1 ? 0 : (row * 100) / (rows - 1),
  };
}

export function frameSource(index, imageWidth, imageHeight, columns, rows) {
  const { column, row } = framePosition(index, columns, rows);
  const width = imageWidth / columns;
  const height = imageHeight / rows;

  return {
    x: column * width,
    y: row * height,
    width,
    height,
  };
}
