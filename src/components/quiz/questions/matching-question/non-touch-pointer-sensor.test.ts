import type { PointerEvent } from "react";
import { describe, expect, test, vi } from "vitest";

import { NonTouchPointerSensor } from "./non-touch-pointer-sensor";

const press = (init: { pointerType: string; isPrimary?: boolean; button?: number }) => {
  const onActivation = vi.fn();
  const nativeEvent = { isPrimary: true, button: 0, ...init };
  const started = NonTouchPointerSensor.activators[0].handler({ nativeEvent } as unknown as PointerEvent, { onActivation });
  return { started, onActivation };
};

describe("NonTouchPointerSensor", () => {
  test("a mouse or pen press starts the sensor", () => {
    for (const pointerType of ["mouse", "pen"]) {
      const { started, onActivation } = press({ pointerType });
      expect(started).toBe(true);
      expect(onActivation).toHaveBeenCalledTimes(1);
    }
  });

  test("a touch press is left to TouchSensor, so the page can still scroll", () => {
    const { started, onActivation } = press({ pointerType: "touch" });
    expect(started).toBe(false);
    expect(onActivation).not.toHaveBeenCalled();
  });

  test("secondary buttons and non-primary pointers are ignored", () => {
    expect(press({ pointerType: "mouse", button: 2 }).started).toBe(false);
    expect(press({ pointerType: "pen", isPrimary: false }).started).toBe(false);
  });
});
