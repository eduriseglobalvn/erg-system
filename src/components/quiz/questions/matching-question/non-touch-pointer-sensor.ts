import { PointerSensor, type PointerSensorOptions } from "@dnd-kit/core";
import type { PointerEvent } from "react";

/** Mouse and pen drag at once; touch pointers are left to TouchSensor's long press, so a swipe on a piece still scrolls. */
export class NonTouchPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent: event }: PointerEvent, { onActivation }: PointerSensorOptions) => {
        if (event.pointerType === "touch" || !event.isPrimary || event.button !== 0) return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}
