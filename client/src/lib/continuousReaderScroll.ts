export type ContinuousPageChange = -1 | 0 | 1;

export function consumeContinuousScroll(accumulated: number, deltaY: number, threshold = 72): { change: ContinuousPageChange; accumulated: number } {
  const next = accumulated + deltaY;
  if (next >= threshold) return { change: 1, accumulated: 0 };
  if (next <= -threshold) return { change: -1, accumulated: 0 };
  return { change: 0, accumulated: next };
}

export function touchPageChange(startY: number, endY: number, threshold = 36): ContinuousPageChange {
  const distance = startY - endY;
  if (distance >= threshold) return 1;
  if (distance <= -threshold) return -1;
  return 0;
}
