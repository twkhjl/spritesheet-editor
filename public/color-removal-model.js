export function hexToRgb(hex) {
  const normalized = String(hex).trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    throw new TypeError('背景顏色必須是 6 位十六進位色碼。');
  }

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function colorDistance(red, green, blue, target) {
  return Math.hypot(
    red - target.red,
    green - target.green,
    blue - target.blue,
  );
}

export function adjustedAlpha(alpha, distance, tolerance, feather) {
  const safeAlpha = Math.max(0, Math.min(255, alpha));
  const inner = Math.max(0, tolerance);
  const edge = Math.max(0, feather);

  if (distance <= inner) return 0;
  if (edge === 0 || distance >= inner + edge) return safeAlpha;

  return Math.round(safeAlpha * ((distance - inner) / edge));
}

export function removeColorFromImageData(imageData, options) {
  const target = options.target;
  const tolerance = Number(options.tolerance) || 0;
  const feather = Number(options.feather) || 0;
  const output = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height,
  );

  for (let index = 0; index < output.data.length; index += 4) {
    const distance = colorDistance(
      output.data[index],
      output.data[index + 1],
      output.data[index + 2],
      target,
    );

    output.data[index + 3] = adjustedAlpha(
      output.data[index + 3],
      distance,
      tolerance,
      feather,
    );
  }

  return output;
}
