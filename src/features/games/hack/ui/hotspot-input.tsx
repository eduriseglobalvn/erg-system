import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import type { AnswerPayload, HotspotPoint, Question } from "@/domain/quiz/types";
import { hk } from "@/features/games/hack/hack-tokens";

const c = hk.color;
const focusSx = { "&.Mui-focusVisible": { outline: `2px solid ${c.white}`, outlineOffset: "2px" } };
const KEY_STEP = 0.01;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** The answer is the same as the LMS hotspot: hotspotPoint { x, y } as fractions (0..1) of the image. */
export function pointFromClick(rect: { left: number; top: number; width: number; height: number }, clientX: number, clientY: number): HotspotPoint {
  return { x: clamp01((clientX - rect.left) / rect.width), y: clamp01((clientY - rect.top) / rect.height) };
}

/** Arrow keys nudge the aim by 1 % of the image; Enter drops it in the middle when nothing is aimed yet. */
export function nudgePoint(point: HotspotPoint | undefined, key: string): HotspotPoint | null {
  if (key === "Enter" || key === " ") return point ?? { x: 0.5, y: 0.5 };
  const base = point ?? { x: 0.5, y: 0.5 };
  switch (key) {
    case "ArrowLeft":
      return { ...base, x: clamp01(base.x - KEY_STEP) };
    case "ArrowRight":
      return { ...base, x: clamp01(base.x + KEY_STEP) };
    case "ArrowUp":
      return { ...base, y: clamp01(base.y - KEY_STEP) };
    case "ArrowDown":
      return { ...base, y: clamp01(base.y + KEY_STEP) };
    default:
      return null;
  }
}

type BodyProps = { question: Question; value: AnswerPayload; onChange: (next: AnswerPayload) => void; phone: boolean; locked: boolean };

/** Hotspot (HQHotspot / HPQHotspot): aim ring on the picture, [+] PHÓNG TO and [x] BỎ ĐIỂM on phone. */
export function HotspotBody({ question, value, onChange, phone, locked }: BodyProps) {
  const image = question.hotspotImage;
  const frame = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState(false);
  if (!image) return null;
  const point = value.hotspotPoint;
  const ring = phone ? 44 : 52;
  const ratio = image.width > 0 && image.height > 0 ? image.width / image.height : 16 / 9;

  const pick = (event: MouseEvent<HTMLDivElement>) => {
    if (locked || !frame.current) return;
    onChange({ hotspotPoint: pointFromClick(frame.current.getBoundingClientRect(), event.clientX, event.clientY) });
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (locked) return;
    const next = nudgePoint(point, event.key);
    if (!next) return;
    event.preventDefault();
    onChange({ hotspotPoint: next });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: phone ? "8px" : "12px", minHeight: 0 }}>
      <Box sx={{ overflow: "auto", maxWidth: "100%", border: `2px solid ${c.border}`, borderRadius: `${hk.radius.panel}px`, alignSelf: phone ? "stretch" : "center" }}>
        <Box
          ref={frame}
          role="application"
          tabIndex={locked ? -1 : 0}
          aria-label={point ? `Điểm ngắm tại ${Math.round(point.x * 100)}%, ${Math.round(point.y * 100)}%` : "Ảnh: bấm để đặt điểm ngắm, hoặc dùng phím mũi tên"}
          onClick={pick}
          onKeyDown={onKey}
          sx={{ position: "relative", width: zoomed ? "200%" : phone ? "100%" : "760px", maxWidth: zoomed ? "none" : "100%", aspectRatio: String(ratio), cursor: locked ? "default" : "crosshair", "&:focus-visible": { outline: `2px solid ${c.white}`, outlineOffset: "-4px" } }}
        >
          <Box component="img" src={image.url} alt={question.contentImage?.alt ?? ""} draggable={false} sx={{ display: "block", width: "100%", height: "100%", userSelect: "none" }} />
          {point ? (
            <>
              <Box aria-hidden="true" sx={{ position: "absolute", top: 0, bottom: 0, left: `${point.x * 100}%`, width: "2px", marginLeft: "-1px", bgcolor: c.red, pointerEvents: "none" }} />
              <Box aria-hidden="true" sx={{ position: "absolute", left: 0, right: 0, top: `${point.y * 100}%`, height: "2px", marginTop: "-1px", bgcolor: c.red, pointerEvents: "none" }} />
              <Box aria-hidden="true" sx={{ position: "absolute", left: `${point.x * 100}%`, top: `${point.y * 100}%`, width: `${ring}px`, height: `${ring}px`, marginLeft: `${-ring / 2}px`, marginTop: `${-ring / 2}px`, border: `3px solid ${c.red}`, boxSizing: "border-box", pointerEvents: "none" }} />
            </>
          ) : null}
        </Box>
      </Box>
      {phone ? (
        <Box sx={{ display: "flex", gap: "8px" }}>
          <ButtonBase disabled={locked} aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)} sx={{ minHeight: "44px", padding: "0 14px", border: `1px solid ${c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: c.bg, color: c.text, fontFamily: "inherit", fontSize: hk.fs[14], fontWeight: hk.font.weightBold, ...focusSx }}>{zoomed ? "[-] THU NHỎ" : "[+] PHÓNG TO"}</ButtonBase>
          <ButtonBase disabled={locked || !point} onClick={() => onChange({})} sx={{ minHeight: "44px", padding: "0 14px", border: `1px solid ${c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: c.bg, color: c.text, fontFamily: "inherit", fontSize: hk.fs[14], fontWeight: hk.font.weightBold, ...focusSx }}>[x] BỎ ĐIỂM</ButtonBase>
        </Box>
      ) : null}
    </Box>
  );
}
