export const MAX_READER_RENDER_PIXELS = 12_000_000;

export function clampReaderProgress(value: number | undefined) {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

export function renderPixelRatio(viewportWidth: number, viewportHeight: number, devicePixelRatio = 1) {
  const naturalRatio = Math.max(1, Math.min(devicePixelRatio, 3));
  const pixelBudgetRatio = Math.sqrt(MAX_READER_RENDER_PIXELS / Math.max(1, viewportWidth * viewportHeight));
  return Math.max(1, Math.min(naturalRatio, pixelBudgetRatio));
}
