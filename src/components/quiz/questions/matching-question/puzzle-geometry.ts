export const PUZZLE = { gap: 48, knob: 18, maxWidth: 380, minHeight: 54, numberColumn: 26 } as const;

/** Widest a piece may be: the web cap, or on a phone half of what is left once the gap and the knob are taken out (never below 120). */
export const pieceMaxWidthFor = (containerWidth: number): number =>
  Math.min(PUZZLE.maxWidth, Math.max(120, Math.floor((containerWidth - PUZZLE.gap - PUZZLE.knob) / 2)));

/** Left piece: rounded box with the notch cut into the right edge, drawn at its real size so the notch never stretches. */
export function pathLeft(w: number, h: number): string {
  const R = w - 1;
  const B = h - 1;
  const c = Math.round(h / 2);
  return `M10 1H${R - 9}A9 9 0 0 1 ${R} 10V${c - 5}C${R - 6} ${c - 5} ${R - 3} ${c - 10} ${R - 9} ${c - 10}C${R - 15} ${c - 10} ${R - 18} ${c - 6} ${R - 18} ${c}C${R - 18} ${c + 6} ${R - 15} ${c + 10} ${R - 9} ${c + 10}C${R - 3} ${c + 10} ${R - 6} ${c + 5} ${R} ${c + 5}V${B - 9}A9 9 0 0 1 ${R - 9} ${B}H10A9 9 0 0 1 1 ${B - 9}V10A9 9 0 0 1 10 1Z`;
}

/** Right piece: rounded box with the knob sticking out of the left edge. */
export function pathRight(w: number, h: number): string {
  const R = w - 1;
  const B = h - 1;
  const c = Math.round(h / 2);
  return `M27 1H${R - 9}A9 9 0 0 1 ${R} 10V${B - 9}A9 9 0 0 1 ${R - 9} ${B}H27A9 9 0 0 1 18 ${B - 9}V${c + 5}C12 ${c + 5} 15 ${c + 10} 9 ${c + 10}C3 ${c + 10} 0 ${c + 6} 0 ${c}C0 ${c - 6} 3 ${c - 10} 9 ${c - 10}C15 ${c - 10} 12 ${c - 5} 18 ${c - 5}V10A9 9 0 0 1 27 1Z`;
}

export type Box = { left: number; right: number; top: number; bottom: number };

/** The row a dragged piece would land on: a little slack around the grid and each row, null outside. */
export function rowAtPoint(p: { x: number; y: number }, rows: { id: string; top: number; bottom: number }[], grid: Box): string | null {
  if (p.x < grid.left - 30 || p.x > grid.right + 30 || p.y < grid.top - 10 || p.y > grid.bottom + 10) return null;
  return rows.find((row) => row.top - 7 <= p.y && p.y <= row.bottom + 7)?.id ?? null;
}
