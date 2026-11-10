import Box from "@mui/material/Box";
import { useRef } from "react";

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

  if (!question.hotspotImage) {
    return null;
  }

  const ratio = question.hotspotImage.width > 0 && question.hotspotImage.height > 0 ? question.hotspotImage.width / question.hotspotImage.height : 16 / 9;

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
    <Box className="quiz-answer-region-wide" sx={{ ...flushAnswerRegionSx, display: "grid", gap: 1.5 }}>
      <Box
        sx={{
          bgcolor: tokens.color.surfaceMuted,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: `${tokens.radius.card}px`,
          alignItems: "center",
          display: "flex",
          height: "min(64vh, 720px)",
          justifyContent: "center",
          minHeight: 420,
          overflow: "hidden",
        }}
      >
        {/* Sized by the image itself, so clicks and areas are fractions of the image, not of its frame. */}
        <Box
          ref={imageRef}
          data-testid="hotspot-image-box"
          // The box takes the image ratio from its data: an SVG with only a viewBox has no width of its own and would shrink to 0.
          sx={{ aspectRatio: `${ratio}`, cursor: submitted ? "default" : "crosshair", maxWidth: `calc(max(420px, min(64vh, 720px)) * ${ratio})`, position: "relative", width: "100%" }}
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
