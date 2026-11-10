import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import { alpha, type Theme } from "@mui/material/styles";
import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";

import { useI18n } from "@/platform/i18n";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
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

  const zoomButtonSx = (theme: Theme) => ({ bgcolor: alpha(theme.palette.common.white, 0.12), color: "common.white", height: 44, width: 44, "&:hover": { bgcolor: alpha(theme.palette.common.white, 0.2) } });

  return (
    <>
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <ButtonBase
          type="button"
          sx={{ bgcolor: tokens.color.surfaceMuted, border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, display: "block", overflow: "hidden", position: "relative", textAlign: "left", width: "100%" }}
          onClick={() => {
            if (submitted) return;
            setEditorOpen(true);
          }}
        >
          <Box component="img" src={question.hotspotImage.url} alt={question.title} sx={{ display: "block", height: "auto", maxHeight: 360, objectFit: "contain", width: "100%" }} />
          {value.hotspotPoint ? (
            <HotspotMarker x={value.hotspotPoint.x} y={value.hotspotPoint.y} />
          ) : null}
          {!submitted && !value.hotspotPoint ? (
            <Box sx={{ alignItems: "center", bottom: 10, display: "flex", justifyContent: "center", left: 0, position: "absolute", right: 0 }}>
              <Box component="span" sx={{ typography: "subtitle2", alignItems: "center", bgcolor: "background.paper", border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.chip}px`, boxShadow: tokens.shadow.float, color: "text.primary", display: "inline-flex", gap: 0.75, px: 1.75, py: 1 }}>
                <TouchAppRoundedIcon aria-hidden fontSize="small" sx={{ color: "primary.main" }} />
                Chạm để chọn trên ảnh
              </Box>
            </Box>
          ) : null}
        </ButtonBase>
        <Box component="p" sx={{ typography: "caption", color: "text.secondary", m: 0 }}>{t("player.clickImagePrompt")}</Box>
      </Box>

      {editorOpen ? (
        <Box sx={{ bgcolor: tokens.color.text, inset: 0, position: "fixed", zIndex: 320 }}>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", px: 1, py: 1 }}>
            <Button type="button" variant="text" sx={{ color: tokens.color.primarySoft }} onClick={() => resetEditorState(true)}>
              Đặt lại
            </Button>
            <Button type="button" variant="text" sx={{ color: tokens.color.primarySoft }} onClick={() => setEditorOpen(false)}>
              Xong
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100svh - 56px)" }}>
            <Box sx={{ flex: 1, overflow: "hidden", pb: 2, px: 0.5 }}>
              <Box sx={{ alignItems: "center", display: "flex", height: "100%", justifyContent: "center", overflow: "hidden" }}>
                <Box
                  ref={editorImageRef}
                  sx={{ maxHeight: "100%", overflow: "hidden", position: "relative", touchAction: "none", width: "100%" }}
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
                  <Box component="img" src={question.hotspotImage.url} alt={question.title} sx={{ display: "block", height: "auto", objectFit: "contain", width: "100%" }} />
                  {reviewMode
                    ? question.hotspotAreas?.filter((area) => area.correct).map((area) => (
                        <HotspotReviewArea key={area.id} area={area} />
                      ))
                    : null}
                  {value.hotspotPoint ? (
                    <HotspotMarker
                      x={value.hotspotPoint.x}
                      y={value.hotspotPoint.y}
                      onMove={submitted ? undefined : (clientX, clientY) => onPickPoint(clientX, clientY, editorImageRef.current)}
                    />
                  ) : null}
                </Box>
              </Box>
            </Box>

            <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, justifyContent: "center", pb: "calc(env(safe-area-inset-bottom, 0px) + 16px)", px: 2 }}>
              <IconButton type="button" aria-label="Thu nhỏ" sx={zoomButtonSx} onClick={() => changeZoom(zoom - 0.3)}>
                <RemoveRoundedIcon />
              </IconButton>
              <Box sx={{ typography: "subtitle2", color: "common.white", fontVariantNumeric: "tabular-nums", minWidth: 64, textAlign: "center" }}>{Math.round(zoom * 100)}%</Box>
              <IconButton type="button" aria-label="Phóng to" sx={zoomButtonSx} onClick={() => changeZoom(zoom + 0.3)}>
                <AddRoundedIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      ) : null}
    </>
  );
}
