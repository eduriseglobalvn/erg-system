import Box from "@mui/material/Box";
import { keyframes } from "@mui/material/styles";
import { memo, useMemo } from "react";

import { hk } from "@/features/games/hack/hack-tokens";

const fall = keyframes`from{transform:translateY(-50%)}to{transform:translateY(0)}`;
const GLYPHS = "0123456789ABCDEF{}[]<>$#*+=";
const ROWS = 120;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One column is a single text node (a char per line) that CSS-translates down; no timers, no canvas. */
function buildColumns(count: number) {
  const random = mulberry32(count * 7919);
  return Array.from({ length: count }, () => {
    const chars = Array.from({ length: ROWS }, () => GLYPHS[Math.floor(random() * GLYPHS.length)]);
    const head = 4 + Math.floor(random() * (ROWS - 12));
    return {
      before: chars.slice(0, head).join("\n"),
      head: chars.slice(head, head + 3).join("\n"),
      tip: chars[head + 3],
      after: chars.slice(head + 4).join("\n"),
      duration: 6 + random() * 6,
      delay: -random() * 10,
      opacity: 0.55 + random() * 0.4,
    };
  });
}

type Tone = "green" | "bright" | "amber";
const TONE_COLOR: Record<Tone, string> = { green: hk.color.rain, bright: hk.color.rainBright, amber: hk.color.amberRain };

/** Falling-code backdrop: 46 columns on desktop, 16 on phones, frozen under prefers-reduced-motion. */
export const MatrixRain = memo(function MatrixRain({ phone, tone = "green" }: { phone: boolean; tone?: Tone }) {
  const columns = useMemo(() => buildColumns(phone ? hk.rain.phoneColumns : hk.rain.desktopColumns), [phone]);
  return (
    <Box
      aria-hidden="true"
      sx={{ position: "absolute", inset: 0, overflow: "hidden", display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 8px", color: TONE_COLOR[tone], pointerEvents: "none" }}
    >
      {columns.map((column, index) => (
        <Box
          key={index}
          sx={{
            width: "1ch",
            fontSize: hk.fs[11],
            lineHeight: 1.35,
            whiteSpace: "pre",
            opacity: column.opacity,
            animation: `${fall} ${column.duration}s linear ${column.delay}s infinite`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          {column.before}
          {"\n"}
          <Box component="span" sx={{ color: hk.color.rainHead }}>{column.head}</Box>
          {"\n"}
          <Box component="span" sx={{ color: hk.color.white }}>{column.tip}</Box>
          {"\n"}
          {column.after}
        </Box>
      ))}
    </Box>
  );
});
