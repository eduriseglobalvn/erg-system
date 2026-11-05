import { useRef } from "react";

import { useI18n } from "@/platform/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";

import { clamp } from "./hotspot-question/hotspot-helpers";
import { HotspotMobileAnswer } from "./hotspot-question/hotspot-mobile-answer";
import { HotspotMarker, HotspotReviewArea } from "./hotspot-question/hotspot-marks";

export function HotspotQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
}: QuestionComponentProps) {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const imageRef = useRef<HTMLDivElement | null>(null);

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
            ? question.hotspotAreas?.filter((area) => area.correct).map((area) => (
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
