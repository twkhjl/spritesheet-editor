export const DEFAULT_SETTINGS = Object.freeze({
  columns: 5,
  rows: 5,
  frames: 25,
  fps: 12,
});

export function validateSettings(settings) {
  const errors = [];
  const labels = {
    columns: '欄數',
    rows: '列數',
    frames: '總幀數',
    fps: 'FPS',
  };

  for (const key of Object.keys(labels)) {
    if (!Number.isInteger(settings[key]) || settings[key] < 1) {
      errors.push(`${labels[key]}必須是正整數。`);
    }
  }

  if (
    Number.isInteger(settings.frames)
    && Number.isInteger(settings.columns)
    && Number.isInteger(settings.rows)
    && settings.frames > settings.columns * settings.rows
  ) {
    errors.push('總幀數不可超過欄數 × 列數。');
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
