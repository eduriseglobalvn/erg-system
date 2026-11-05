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

/**
 * Where the selected area's toolbar sits, as CSS. It is centred on the area and shifted back by the same share of its own width,
 * so it never leaves the image sideways; it goes under the area, else above it, else inside the area's bottom edge.
 */
// shortcut: room is judged in fractions of the image, not pixels, so a very short image can still clip the toolbar; measure it if that shows up.
export function areaToolbarPlacement(area: { x: number; y: number; width: number; height: number }): { left: string; top: string; transform: string } {
  const centre = (area.x + area.width / 2) * 100;
  const bottom = (area.y + area.height) * 100;
  const left = `${centre}%`;
  const shift = `translateX(-${centre}%)`;
  if (area.y + area.height <= 0.85) return { left, top: `calc(${bottom}% + 4px)`, transform: shift };
  if (area.y >= 0.15) return { left, top: `calc(${area.y * 100}% - 4px)`, transform: `${shift} translateY(-100%)` };
  return { left, top: `calc(${bottom}% - 4px)`, transform: `${shift} translateY(-100%)` };
}
