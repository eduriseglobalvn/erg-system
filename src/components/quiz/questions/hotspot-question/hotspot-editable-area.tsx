import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

import type { HotspotArea } from "@/domain/quiz/types";

import { clamp, resizeHandles, type ResizeHandle } from "./hotspot-helpers";

export function HotspotEditableArea({
  area,
  active,
  index,
  stageRef,
  onSelect,
  onChange,
}: {
  area: HotspotArea;
  active: boolean;
  index: number;
  stageRef: RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onChange: (patch: Partial<HotspotArea>) => void;
}) {
  function getPointerPosition(event: PointerEvent | ReactPointerEvent<HTMLElement>) {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  }

  function handleMovePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    onSelect();
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = getPointerPosition(event);
    if (!start) return;
    const startPoint = start;
    const startArea = { ...area };

    function handlePointerMove(moveEvent: PointerEvent) {
      const next = getPointerPosition(moveEvent);
      if (!next) return;
      const dx = next.x - startPoint.x;
      const dy = next.y - startPoint.y;
      onChange({
        x: clamp(startArea.x + dx, 0, 1 - startArea.width),
        y: clamp(startArea.y + dy, 0, 1 - startArea.height),
      });
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  function handleResizePointerDown(handle: ResizeHandle, event: ReactPointerEvent<HTMLSpanElement>) {
    event.preventDefault();
    event.stopPropagation();
    onSelect();
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = getPointerPosition(event);
    if (!start) return;
    const startPoint = start;
    const startArea = { ...area };

    function handlePointerMove(moveEvent: PointerEvent) {
      const next = getPointerPosition(moveEvent);
      if (!next) return;
      const dx = next.x - startPoint.x;
      const dy = next.y - startPoint.y;
      const leftResize = handle.includes("w");
      const rightResize = handle.includes("e");
      const topResize = handle.includes("n");
      const bottomResize = handle.includes("s");
      let x = startArea.x;
      let y = startArea.y;
      let width = startArea.width;
      let height = startArea.height;

      if (leftResize) {
        x = clamp(startArea.x + dx, 0, startArea.x + startArea.width - 0.04);
        width = clamp(startArea.width - (x - startArea.x), 0.04, 1 - x);
      }
      if (rightResize) {
        width = clamp(startArea.width + dx, 0.04, 1 - startArea.x);
      }
      if (topResize) {
        y = clamp(startArea.y + dy, 0, startArea.y + startArea.height - 0.04);
        height = clamp(startArea.height - (y - startArea.y), 0.04, 1 - y);
      }
      if (bottomResize) {
        height = clamp(startArea.height + dy, 0.04, 1 - startArea.y);
      }

      onChange({ x, y, width, height });
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`hotspot-authoring-area ${active ? "is-active" : ""} ${area.visible === false ? "is-hidden" : ""}`}
      style={{
        left: `${area.x * 100}%`,
        top: `${area.y * 100}%`,
        width: `${area.width * 100}%`,
        height: `${area.height * 100}%`,
        borderRadius: area.shape === "ellipse" ? "9999px" : "2px",
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerDown={handleMovePointerDown}
      aria-label={`Hotspot area ${index + 1}`}
    >
      <span className="hotspot-authoring-area-label">
        {index + 1}
      </span>
      {active ? resizeHandles.map((handle) => (
        <span
          key={handle}
          className={`hotspot-authoring-handle is-${handle}`}
          onPointerDown={(event) => handleResizePointerDown(handle, event)}
        />
      )) : null}
    </div>
  );
}
