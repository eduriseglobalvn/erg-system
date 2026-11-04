import { Minus, Plus, Pointer } from "lucide-react";
import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";

import { useI18n } from "@/platform/i18n";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";

import { clamp, getTouchDistance } from "./hotspot-helpers";
import { HotspotMarker, HotspotReviewArea } from "./hotspot-marks";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DEFAULT_MOBILE_ZOOM = 1;

type HotspotMobileAnswerProps = Pick<QuestionComponentProps, "question" | "value" | "onChange" | "submitted" | "reviewMode"> & {
  onPickPoint: (clientX: number, clientY: number, target: HTMLDivElement | null) => void;
};

export function HotspotMobileAnswer({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  onPickPoint,
}: HotspotMobileAnswerProps) {
  const { t } = useI18n();
  const paceStateUpdate = usePacedStateBatch();
  const editorImageRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStateRef = useRef<{ distance: number; zoom: number } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_MOBILE_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

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

  function changeZoom(nextZoom: number) {
    setZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
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
                    onPickPoint(event.clientX, event.clientY, editorImageRef.current);
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
