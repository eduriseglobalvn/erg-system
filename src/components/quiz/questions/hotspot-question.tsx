import { useRef, useState } from "react";

import { useI18n } from "@/platform/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import type { HotspotArea } from "@/domain/quiz/types";

import { HotspotAuthoring } from "./hotspot-question/hotspot-authoring";
import { clamp, createRuntimeId } from "./hotspot-question/hotspot-helpers";
import { HotspotMobileAnswer } from "./hotspot-question/hotspot-mobile-answer";
import { HotspotMarker, HotspotReviewArea } from "./hotspot-question/hotspot-marks";

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
  const imageRef = useRef<HTMLDivElement | null>(null);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const areas = question.hotspotAreas ?? [];
  const activeArea = areas.find((area) => area.id === activeAreaId) ?? areas[0] ?? null;

  if (!question.hotspotImage) {
    return null;
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

  if (editable && onQuestionChange) {
    return (
      <HotspotAuthoring
        question={question}
        areas={areas}
        activeArea={activeArea}
        imageRef={imageRef}
        addArea={addArea}
        updateArea={updateArea}
        removeArea={removeArea}
        setAreaCount={setAreaCount}
        setActiveAreaId={setActiveAreaId}
        onPickArea={handlePickEditableArea}
      />
    );
  }

  if (isMobile) {
    return (
      <HotspotMobileAnswer
        question={question}
        value={value}
        onChange={onChange}
        submitted={submitted}
        reviewMode={reviewMode}
        onPickPoint={handlePickPoint}
      />
    );
  }

  return (
    <div className="quiz-answer-region-wide grid gap-3">
      <div
        className="grid min-h-[420px] place-items-center overflow-hidden rounded-2xl border bg-white shadow-[0_14px_30px_rgba(0,0,136,0.05)]"
        style={{
          borderColor: "var(--quiz-canvas-border)",
          height: "min(64vh, 720px)",
        }}
      >
        {/* Sized by the image itself, so clicks and areas are fractions of the image, not of its frame. */}
        <div
          ref={imageRef}
          data-testid="hotspot-image-box"
          className="relative inline-block"
          onClick={(event) => {
            handlePickPoint(event.clientX, event.clientY, imageRef.current);
          }}
        >
          <img
            src={question.hotspotImage.url}
            alt={question.title}
            style={{ display: "block", maxWidth: "100%", maxHeight: "min(64vh, 720px)", width: "auto", height: "auto" }}
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
      <p className="text-sm text-slate-500">{t("player.clickImagePrompt")}</p>
    </div>
  );
}
