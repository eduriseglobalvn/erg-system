import Box from "@mui/material/Box";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/platform/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";

import { clamp } from "./hotspot-question/hotspot-helpers";
import { HotspotMobileAnswer } from "./hotspot-question/hotspot-mobile-answer";
import { flushAnswerRegionSx } from "@/components/quiz/questions/shared";
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
  const image = question.hotspotImage;
  const ratio = image && image.width > 0 && image.height > 0 ? image.width / image.height : 16 / 9;
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const fit = useFitInFrame(frame, ratio);

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
    // A column that may shrink: inside the player's fixed-height card the image fits what is left, no scrolling.
    <Box className="quiz-answer-region-wide" sx={{ ...flushAnswerRegionSx, display: "flex", flex: "1 1 auto", flexDirection: "column", gap: 1.5, minHeight: 0 }}>
      <Box
        ref={setFrame}
        sx={{
          bgcolor: tokens.color.surfaceMuted,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: `${tokens.radius.card}px`,
          alignItems: "center",
          display: "flex",
          flex: "1 1 auto",
          height: "min(64vh, 720px)",
          justifyContent: "center",
          minHeight: 240,
          overflow: "hidden",
        }}
      >
        {/* Sized by the image itself, so clicks and areas are fractions of the image, not of its frame. */}
        <Box
          ref={imageRef}
          data-testid="hotspot-image-box"
          // The box takes the image ratio from its data: an SVG with only a viewBox has no width of its own and would shrink to 0.
          sx={{
            cursor: submitted ? "default" : "crosshair",
            position: "relative",
            ...(fit ? { height: fit.height, width: fit.width } : { aspectRatio: `${ratio}`, maxWidth: `calc(max(240px, min(64vh, 720px)) * ${ratio})`, width: "100%" }),
          }}
          onClick={(event) => {
            handlePickPoint(event.clientX, event.clientY, imageRef.current);
          }}
        >
          <img
            src={question.hotspotImage.url}
            alt={question.title}
            style={{ display: "block", width: "100%", height: "100%" }}
          />
          {reviewMode
            ? question.hotspotAreas?.filter((area) => area.correct).map((area) => (
                <HotspotReviewArea key={area.id} area={area} />
              ))
            : null}
          {value.hotspotPoint ? (
            <HotspotMarker
              x={value.hotspotPoint.x}
              y={value.hotspotPoint.y}
              onMove={submitted ? undefined : (clientX, clientY) => handlePickPoint(clientX, clientY, imageRef.current)}
            />
          ) : null}
        </Box>
      </Box>
      <Box component="p" sx={{ typography: "caption", color: "text.secondary", m: 0 }}>{t("player.clickImagePrompt")}</Box>
    </Box>
  );
}

/** Largest box with the image's ratio that fits the frame; null until measured (or where ResizeObserver is missing). */
function useFitInFrame(frame: HTMLElement | null, ratio: number) {
  const [fit, setFit] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    if (!frame || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      const fitWidth = Math.min(width, height * ratio);
      setFit({ height: fitWidth / ratio, width: fitWidth });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frame, ratio]);
  return fit;
}
