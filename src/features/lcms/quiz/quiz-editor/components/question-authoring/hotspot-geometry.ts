/** Hotspot areas are fractions of the image box itself, so they hold at any display size. */
export const MIN_AREA = 0.02;

export type Fraction = { x: number; y: number };

// NaN (a box of zero size) lands on 0.
const clamp01 = (value: number) => (value > 1 ? 1 : value > 0 ? value : 0);

export function toFraction(clientX: number, clientY: number, box: { left: number; top: number; width: number; height: number }): Fraction {
  return { x: clamp01((clientX - box.left) / box.width), y: clamp01((clientY - box.top) / box.height) };
}

/** The box between the two ends of a drag, or null when it is too thin to be an area. */
export function areaFromDrag(a: Fraction, b: Fraction): { x: number; y: number; width: number; height: number } | null {
  const width = Math.abs(a.x - b.x);
  const height = Math.abs(a.y - b.y);
  if (width < MIN_AREA || height < MIN_AREA) return null;
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width, height };
}
