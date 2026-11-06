import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

import { pathLeft, pathRight, PUZZLE } from "./puzzle-geometry";

export type PieceTone = "idle" | "over" | "correct" | "wrong" | "missing";

function pieceColors(theme: Theme, side: "left" | "right", tone: PieceTone) {
  const { palette } = theme;
  const right = side === "right";
  switch (tone) {
    case "over":
      return { fill: tokens.color.primarySofter, stroke: palette.primary.main, dash: "5 4" };
    case "correct":
      return { fill: right ? tokens.statusTint.success.bg : palette.background.paper, stroke: palette.success.main };
    case "wrong":
      return { fill: right ? tokens.statusTint.error.bg : palette.background.paper, stroke: palette.error.main };
    case "missing":
      return right
        ? { fill: palette.background.paper, stroke: palette.warning.main, dash: "5 4" }
        : { fill: palette.background.paper, stroke: tokens.color.border };
    default:
      return { fill: palette.background.paper, stroke: tokens.color.border };
  }
}

/** One puzzle piece: an SVG outline measured from the box itself, so the knob and notch keep their size at any width. */
export function PuzzlePiece({
  side,
  tone,
  children,
  sx,
}: {
  side: "left" | "right";
  tone: PieceTone;
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setSize((prev) => (prev.w === node.offsetWidth && prev.h === node.offsetHeight ? prev : { w: node.offsetWidth, h: node.offsetHeight }));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const colors = pieceColors(theme, side, tone);

  return (
    <Box
      ref={ref}
      sx={[
        {
          position: "relative",
          minHeight: PUZZLE.minHeight,
          maxWidth: PUZZLE.maxWidth,
          display: "flex",
          alignItems: "center",
          gap: 1,
          typography: "body2",
          lineHeight: 1.4,
          fontWeight: "fontWeightMedium",
          "& img": { maxWidth: 150, maxHeight: 84, borderRadius: `${tokens.radius.xs}px`, objectFit: "cover" },
        },
        side === "left" ? { pl: 2, pr: "34px", color: "text.primary" } : { pl: "30px", pr: 1.5, color: "primary.main" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {size.w > 0 ? (
        <Box component="svg" aria-hidden sx={{ position: "absolute", inset: 0, overflow: "visible", width: "100%", height: "100%" }}>
          <path
            d={side === "left" ? pathLeft(size.w, size.h) : pathRight(size.w, size.h)}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth={1.3}
            strokeDasharray={colors.dash}
          />
        </Box>
      ) : null}
      <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

export const GripDots = () => (
  <Box component="svg" aria-hidden viewBox="0 0 10 16" sx={{ width: 10, height: 16, flex: "none", color: "text.secondary" }}>
    {[3, 8, 13].flatMap((cy) => [2, 8].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.5} fill="currentColor" />))}
  </Box>
);
