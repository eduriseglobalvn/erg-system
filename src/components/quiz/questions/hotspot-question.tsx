import { Circle, Eye, EyeOff, Minus, MousePointer2, Plus, Pointer, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject, type TouchEvent as ReactTouchEvent } from "react";

import { useI18n } from "@/platform/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import type { HotspotArea } from "@/lib/types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DEFAULT_MOBILE_ZOOM = 1;

export function HotspotQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  editable = false,
  onQuestionChange,
}: QuestionComponentProps) {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const paceStateUpdate = usePacedStateBatch();
  const imageRef = useRef<HTMLDivElement | null>(null);
  const editorImageRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStateRef = useRef<{ distance: number; zoom: number } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_MOBILE_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const areas = question.hotspotAreas ?? [];
  const activeArea = areas.find((area) => area.id === activeAreaId) ?? areas[0] ?? null;

  useEffect(() => {
    if (!editorOpen) {
      return;
    }

    paceStateUpdate(() => {
      setZoom(DEFAULT_MOBILE_ZOOM);
      setOffset({ x: 0, y: 0 });
    });

  }, [editorOpen, paceStateUpdate]);

  if (!question.hotspotImage) {
    return null;
  }

  function resetEditorState(clearPoint: boolean) {
    setZoom(DEFAULT_MOBILE_ZOOM);
    setOffset({ x: 0, y: 0 });
    if (clearPoint) {
      onChange({ hotspotPoint: undefined });
    }
  }

  function handlePickPoint(clientX: number, clientY: number, target: HTMLDivElement | null) {
    if (submitted || !target) return;
    const rect = target.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);
    onChange({ hotspotPoint: { x, y } });
  }

  function emitAreas(nextAreas: HotspotArea[]) {
    onQuestionChange?.({ ...question, hotspotAreas: nextAreas });
  }

  function updateArea(areaId: string, patch: Partial<HotspotArea>) {
    emitAreas(areas.map((area) => (area.id === areaId ? { ...area, ...patch } : area)));
  }

  function addArea(shape?: unknown) {
    const nextShape: HotspotArea["shape"] =
      shape === "rect" || shape === "ellipse" || shape === "polygon"
        ? shape
        : activeArea?.shape ?? "rect";
    const nextArea = {
      id: createRuntimeId("hotspot"),
      shape: nextShape,
      x: 0.56,
      y: 0.18,
      width: 0.24,
      height: 0.2,
      correct: true,
      visible: true,
    };

    emitAreas([...areas, nextArea]);
    setActiveAreaId(nextArea.id);
  }

  function setAreaCount(count: number) {
    const nextCount = Math.max(1, Math.min(12, count));
    if (nextCount === areas.length) return;

    if (nextCount < areas.length) {
      const nextAreas = areas.slice(0, nextCount);
      emitAreas(nextAreas);
      if (!nextAreas.some((area) => area.id === activeAreaId)) {
        setActiveAreaId(nextAreas[0]?.id ?? null);
      }
      return;
    }

    const addedAreas = Array.from({ length: nextCount - areas.length }, (_, index) => ({
      id: createRuntimeId(`hotspot-${index}`),
      shape: "rect" as const,
      x: clamp(0.54 + index * 0.03, 0, 0.76),
      y: clamp(0.18 + index * 0.05, 0, 0.78),
      width: 0.22,
      height: 0.18,
      correct: true,
      visible: true,
    }));
    emitAreas([...areas, ...addedAreas]);
    setActiveAreaId(addedAreas[0]?.id ?? activeAreaId);
  }

  function removeArea(areaId: string) {
    if (areas.length <= 1) return;

    const nextAreas = areas.filter((area) => area.id !== areaId);
    emitAreas(nextAreas);
    if (activeAreaId === areaId) {
      setActiveAreaId(nextAreas[0]?.id ?? null);
    }
  }

  function handlePickEditableArea(clientX: number, clientY: number, target: HTMLDivElement | null) {
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const width = activeArea?.width ?? 0.22;
    const height = activeArea?.height ?? 0.18;
    const x = clamp((clientX - rect.left) / rect.width - width / 2, 0, 1 - width);
    const y = clamp((clientY - rect.top) / rect.height - height / 2, 0, 1 - height);

    if (activeArea) {
      updateArea(activeArea.id, { x, y });
      return;
    }

    const nextArea = {
      id: createRuntimeId("hotspot"),
      shape: "rect" as const,
      x,
      y,
      width,
      height,
      correct: true,
    };

    emitAreas([nextArea]);
    setActiveAreaId(nextArea.id);
  }

  function changeZoom(nextZoom: number) {
    setZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
  }

  if (editable && onQuestionChange) {
    return (
      <div className="quiz-answer-region-wide hotspot-authoring-clean">
        <div className="hotspot-authoring-toolbar is-map-tools">
          <strong>{activeArea ? `Vùng ${Math.max(1, areas.findIndex((area) => area.id === activeArea.id) + 1)}` : "Vùng chọn"}</strong>
          <button
            type="button"
            className={activeArea?.shape !== "ellipse" && activeArea?.shape !== "polygon" ? "is-active is-icon" : "is-icon"}
            onClick={() => activeArea ? updateArea(activeArea.id, { shape: "rect" }) : addArea("rect")}
            aria-label="Hình chữ nhật"
            title="Hình chữ nhật"
          >
            <Square />
          </button>
          <button
            type="button"
            className={activeArea?.shape === "ellipse" ? "is-active is-icon" : "is-icon"}
            onClick={() => activeArea ? updateArea(activeArea.id, { shape: "ellipse" }) : addArea("ellipse")}
            aria-label="Hình tròn"
            title="Hình tròn"
          >
            <Circle />
          </button>
          <button type="button" className="is-icon" disabled aria-label="Vẽ tự do" title="Vẽ tự do">
            <MousePointer2 />
          </button>
          <span className="hotspot-authoring-divider" />
          <button
            type="button"
            className={activeArea?.visible !== false ? "is-active is-icon" : "is-icon"}
            onClick={() => activeArea ? updateArea(activeArea.id, { visible: activeArea.visible === false }) : addArea()}
            aria-label={activeArea?.visible === false ? "Ẩn vùng" : "Hiện vùng"}
            title={activeArea?.visible === false ? "Ẩn vùng" : "Hiện vùng"}
          >
            {activeArea?.visible === false ? <EyeOff /> : <Eye />}
          </button>
          <label className="hotspot-authoring-count">
            <span>Số vùng</span>
            <input
              type="number"
              min={1}
              max={12}
              value={Math.max(areas.length, 1)}
              onChange={(event) => setAreaCount(Number(event.target.value))}
            />
          </label>
          <button type="button" onClick={() => addArea()}>
            <Plus className="h-3.5 w-3.5" />
            Thêm vùng
          </button>
          {activeArea && areas.length > 1 ? (
            <button type="button" className="is-danger is-icon" onClick={() => removeArea(activeArea.id)} aria-label="Xóa vùng" title="Xóa vùng">
              <Trash2 />
            </button>
          ) : null}
        </div>
        <div className="hotspot-authoring-toolbar is-legacy">
          <strong>{activeArea ? `Vùng đúng ${Math.max(1, areas.findIndex((area) => area.id === activeArea.id) + 1)}` : "Vùng đúng"}</strong>
          <button
            type="button"
            className={activeArea?.shape !== "ellipse" ? "is-active" : ""}
            onClick={() => activeArea ? updateArea(activeArea.id, { shape: "rect" }) : addArea()}
          >
            Hình vuông
          </button>
          <button
            type="button"
            className={activeArea?.shape === "ellipse" ? "is-active" : ""}
            onClick={() => activeArea ? updateArea(activeArea.id, { shape: "ellipse" }) : addArea()}
          >
            Hình tròn
          </button>
          <button
            type="button"
            className={activeArea?.visible !== false ? "is-active" : ""}
            onClick={() => activeArea ? updateArea(activeArea.id, { visible: activeArea.visible === false }) : addArea()}
          >
            {activeArea?.visible === false ? "Ẩn vùng" : "Hiện vùng"}
          </button>
          <button type="button" onClick={addArea}>Thêm vùng</button>
          {activeArea && areas.length > 1 ? (
            <button type="button" className="is-danger" onClick={() => removeArea(activeArea.id)}>
              Xóa
            </button>
          ) : null}
        </div>
        <div
          ref={imageRef}
          className="hotspot-authoring-image"
          style={{
            borderColor: "var(--quiz-canvas-border)",
          }}
          onClick={(event) => {
            handlePickEditableArea(event.clientX, event.clientY, imageRef.current);
          }}
        >
          <img
            src={question.hotspotImage.url}
            alt={question.title}
            className="block h-full w-full object-contain"
          />
          {areas.map((area, index) => (
            <HotspotEditableArea
              key={area.id}
              area={area}
              active={activeArea?.id === area.id}
              index={index}
              stageRef={imageRef}
              onSelect={() => setActiveAreaId(area.id)}
              onChange={(patch) => updateArea(area.id, patch)}
            />
          ))}
        </div>
      </div>
    );
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      pinchStateRef.current = {
        distance: getTouchDistance(event.touches[0], event.touches[1]),
        zoom,
      };
      dragStateRef.current = null;
      return;
    }

    if (event.touches.length === 1 && zoom > 1) {
      dragStateRef.current = {
        x: event.touches[0].clientX - offset.x,
        y: event.touches[0].clientY - offset.y,
      };
    }
  }

  function handleTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2 && pinchStateRef.current) {
      event.preventDefault();
      const distance = getTouchDistance(event.touches[0], event.touches[1]);
      const nextZoom = pinchStateRef.current.zoom * (distance / pinchStateRef.current.distance);
      changeZoom(nextZoom);
      return;
    }

    if (event.touches.length === 1 && dragStateRef.current && zoom > 1) {
      event.preventDefault();
      setOffset({
        x: event.touches[0].clientX - dragStateRef.current.x,
        y: event.touches[0].clientY - dragStateRef.current.y,
      });
    }
  }

  function handleTouchEnd() {
    if (pinchStateRef.current) {
      pinchStateRef.current = null;
    }
    if (dragStateRef.current) {
      dragStateRef.current = null;
    }
  }

  if (isMobile) {
    return (
      <>
        <div className="grid gap-3">
          <button
            type="button"
            className="relative overflow-hidden rounded-md border bg-white text-left shadow-sm"
            style={{ borderColor: "var(--quiz-canvas-border)" }}
            onClick={() => {
              if (submitted) return;
              setEditorOpen(true);
            }}
          >
            <img
              src={question.hotspotImage.url}
              alt={question.title}
              className="block h-auto max-h-[260px] w-full object-contain"
            />
            {value.hotspotPoint ? (
              <HotspotMarker x={value.hotspotPoint.x} y={value.hotspotPoint.y} />
            ) : null}
            {!submitted ? (
              <div className="absolute inset-0 grid place-items-center bg-slate-950/35">
                <div className="grid place-items-center gap-2 rounded-md bg-slate-900/75 px-5 py-4 text-center text-white shadow-sm">
                  <Pointer className="h-9 w-9" />
                  <span className="text-sm font-semibold leading-5">Tap to answer this question</span>
                </div>
              </div>
            ) : null}
          </button>
          <p className="text-sm text-slate-500">{t("player.clickImagePrompt")}</p>
        </div>

        {editorOpen ? (
          <div className="fixed inset-0 z-[320] bg-[#2f2f2f]">
            <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--erg-blue-light)]">
              <button
                type="button"
                onClick={() => resetEditorState(true)}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
              >
                Done
              </button>
            </div>

            <div className="flex h-[calc(100svh-56px)] flex-col">
              <div className="flex-1 overflow-hidden px-1 pb-4">
                <div className="flex h-full items-center justify-center overflow-hidden">
                  <div
                    ref={editorImageRef}
                    className="relative max-h-full w-full touch-none overflow-hidden"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                      transformOrigin: "center center",
                    }}
                    onClick={(event) => {
                      handlePickPoint(event.clientX, event.clientY, editorImageRef.current);
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img
                      src={question.hotspotImage.url}
                      alt={question.title}
                      className="block h-auto w-full object-contain"
                    />
                    {reviewMode
                      ? question.hotspotAreas?.map((area) => (
                          <HotspotReviewArea key={area.id} area={area} />
                        ))
                      : null}
                    {value.hotspotPoint ? (
                      <HotspotMarker x={value.hotspotPoint.x} y={value.hotspotPoint.y} />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white"
                  onClick={() => changeZoom(zoom - 0.3)}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="min-w-16 text-center text-sm font-semibold text-white">{Math.round(zoom * 100)}%</div>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white"
                  onClick={() => changeZoom(zoom + 0.3)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="quiz-answer-region-wide grid gap-3">
      <div
        ref={imageRef}
        className="relative grid min-h-[420px] overflow-hidden rounded-2xl border bg-white shadow-[0_14px_30px_rgba(0,0,136,0.05)]"
        style={{
          borderColor: "var(--quiz-canvas-border)",
          height: "min(64vh, 720px)",
        }}
        onClick={(event) => {
          handlePickPoint(event.clientX, event.clientY, imageRef.current);
        }}
      >
        <img
          src={question.hotspotImage.url}
          alt={question.title}
          className="block h-full w-full object-contain"
        />
        {reviewMode
          ? question.hotspotAreas?.map((area) => (
              <HotspotReviewArea key={area.id} area={area} />
            ))
          : null}
        {value.hotspotPoint ? (
          <HotspotMarker x={value.hotspotPoint.x} y={value.hotspotPoint.y} />
        ) : null}
      </div>
      <p className="text-sm text-slate-500">{t("player.clickImagePrompt")}</p>
    </div>
  );
}

function HotspotEditableArea({
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

const resizeHandles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type ResizeHandle = (typeof resizeHandles)[number];

function createRuntimeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function HotspotMarker({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-sm"
      style={{
        backgroundColor: "var(--quiz-accent-end)",
        left: `${x * 100}%`,
        top: `${y * 100}%`,
      }}
    />
  );
}

function HotspotReviewArea({
  area,
}: {
  area: {
    shape: "rect" | "ellipse" | "polygon";
    x: number;
    y: number;
    width: number;
    height: number;
  };
}) {
  return (
    <div
      className="absolute border border-dashed border-white/90 bg-[var(--erg-blue)]/20"
      style={{
        left: `${area.x * 100}%`,
        top: `${area.y * 100}%`,
        width: `${area.width * 100}%`,
        height: `${area.height * 100}%`,
        borderRadius: area.shape === "ellipse" ? "9999px" : "0.5rem",
      }}
    />
  );
}

function getTouchDistance(
  first: { clientX: number; clientY: number },
  second: { clientX: number; clientY: number },
) {
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
