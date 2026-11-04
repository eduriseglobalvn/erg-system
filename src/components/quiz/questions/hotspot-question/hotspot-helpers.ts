export const resizeHandles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
export type ResizeHandle = (typeof resizeHandles)[number];

export function createRuntimeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export function getTouchDistance(
  first: { clientX: number; clientY: number },
  second: { clientX: number; clientY: number },
) {
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
