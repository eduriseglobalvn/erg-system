import { PointerSensor, type PointerSensorOptions } from "@dnd-kit/core";
import type { PointerEvent } from "react";

/** Marks a grip (`touch-action: none`) that starts a touch drag at once instead of after TouchSensor's long press. */
export const DRAG_HANDLE_ATTR = "data-drag-handle";

/**
 * Mouse and pen drag at once; so does a finger on a drag handle. Any other touch is left to TouchSensor's long press,
 * so a swipe on a card still scrolls (a plain PointerSensor would claim the touch, then lose it to the scroll on iPad).
 */
export class NonTouchPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent: event }: PointerEvent, { onActivation }: PointerSensorOptions) => {
        if (!event.isPrimary || event.button !== 0) return false;
        if (event.pointerType === "touch" && !(event.target instanceof Element && event.target.closest(`[${DRAG_HANDLE_ATTR}]`))) return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}
