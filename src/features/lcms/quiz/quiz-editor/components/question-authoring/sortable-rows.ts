import { KeyboardSensor, PointerSensor, useSensor, useSensors, type KeyboardCoordinateGetter, type Modifier } from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";

import { moveChoice } from "./move-choice";

/** Shared pieces of the vertical row lists (choices, sequence steps). */

// Rows have no sortable layout, so arrow keys step a fixed 56px vertically.
const verticalKeyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
  const step = event.code === "ArrowDown" ? 56 : event.code === "ArrowUp" ? -56 : 0;
  if (!step) return undefined;
  event.preventDefault();
  return { x: currentCoordinates.x, y: currentCoordinates.y + step };
};

export const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export function useRowSensors() {
  return useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: verticalKeyboardCoordinates }));
}

/** Moves row `id` one place up (-1) or down (1); unchanged at the edges. */
export function moveRowBy<T extends { id: string }>(list: T[], id: string, delta: -1 | 1): T[] {
  const target = list[list.findIndex((row) => row.id === id) + delta];
  return target ? moveChoice(list, id, target.id) : list;
}

let nextId = 0;
export const newRowId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextId++}`;

/** Reordering or deleting remounts or moves DOM nodes, which drops focus; put it back once the new order has rendered. */
export function usePendingFocus() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<{ selector: string } | null>(null);
  useEffect(() => {
    if (pending) rootRef.current?.querySelector<HTMLElement>(pending.selector)?.focus();
  }, [pending]);
  return { rootRef, focusLater: (selector: string) => setPending({ selector }) };
}
