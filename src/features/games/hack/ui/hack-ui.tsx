import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

import { HACK_PHONE_MAX_WIDTH, hk } from "@/features/games/hack/hack-tokens";
import { MatrixRain } from "@/features/games/hack/ui/matrix-rain";

const c = hk.color;

/** True below 768px: the screens switch to the HP*.dc.html phone layout. */
export function useHackPhone() {
  return useMediaQuery(`(max-width:${HACK_PHONE_MAX_WIDTH}px)`, { noSsr: true });
}

/** Terminal handle: "Minh Anh" -> "MINH_ANH". */
export function toHandle(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Thousands grouped with a plain space as the designs show ("1 540"); Intl vi-VN would print "1.540". */
export function formatNumber(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

type HackScreenProps = {
  children: ReactNode;
  phone: boolean;
  tone?: "green" | "bright" | "amber";
  amber?: boolean;
  center?: boolean;
  sx?: SxProps<Theme>;
  label: string;
};

/** Full-screen game frame: dark terminal background, falling code, a content column above it. */
export function HackScreen({ children, phone, tone = "green", amber = false, center = false, sx, label }: HackScreenProps) {
  return (
    <Box
      component="main"
      aria-label={label}
      sx={[
        {
          position: "relative",
          minHeight: ["100vh", "100dvh"],
          bgcolor: amber ? c.amberBg : c.bg,
          color: amber ? c.amberText : c.text,
          fontFamily: "inherit",
          lineHeight: "normal", // the app's global body line-height (1.55) made every bar 4px taller than the design
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: center ? "center" : "stretch",
          justifyContent: center ? "center" : "flex-start",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <MatrixRain phone={phone} tone={tone} />
      {children}
    </Box>
  );
}

/** Bordered terminal card. */
export function Panel({ children, sx, component = "div" }: { children: ReactNode; sx?: SxProps<Theme>; component?: "div" | "section" }) {
  return (
    <Box
      component={component}
      sx={[
        { position: "relative", bgcolor: c.panel, border: `1px solid ${c.border}`, borderRadius: `${hk.radius.panel}px` },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}

export function WindowTitle({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderBottom: `1px solid ${c.border}`, fontSize: hk.fs[12], color: c.dim }}>
      {[c.red, c.yellow, c.green].map((color) => (
        <Box key={color} component="span" sx={{ width: "10px", height: "10px", bgcolor: color }} />
      ))}
      <Box component="span" sx={{ marginLeft: "8px" }}>{children}</Box>
    </Box>
  );
}

/** Blinking-free block cursor (static, so reduced motion needs no special case). */
export function Cursor({ color = c.green, fg = c.bg }: { color?: string; fg?: string }) {
  return <Box component="span" sx={{ bgcolor: color, color: fg }}>&nbsp;</Box>;
}

type HackButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "green" | "amber";
  outline?: boolean;
  phone?: boolean;
  fullWidth?: boolean;
  fontSize?: number;
  minHeight?: number;
  paddingX?: number;
  sx?: SxProps<Theme>;
};

/** The one primary action of a screen ("> CHẠY LỆNH"); `outline` is the secondary style. */
export function HackButton({ children, onClick, disabled, tone = "green", outline, fullWidth, fontSize = hk.fs[18], minHeight = 56, paddingX = 36, sx }: HackButtonProps) {
  const main = tone === "amber" ? c.yellow : c.green;
  const ink = tone === "amber" ? c.amberBg : c.bg;
  return (
    <ButtonBase
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={[
        {
          minHeight: `${minHeight}px`,
          padding: `0 ${paddingX}px`,
          border: outline ? `1px solid ${tone === "amber" ? c.amberSoft : c.dim}` : 0,
          borderRadius: `${hk.radius.panel}px`,
          bgcolor: outline ? "transparent" : disabled ? c.disabled : main,
          color: outline ? (tone === "amber" ? c.amberText : c.text) : disabled ? c.dim : ink,
          fontFamily: "inherit",
          fontSize,
          fontWeight: hk.font.weightBold,
          width: fullWidth ? "100%" : undefined,
          "&.Mui-focusVisible": { outline: `2px solid ${c.white}`, outlineOffset: "2px" },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </ButtonBase>
  );
}

export function Chip({ children, color, solid, sx }: { children: ReactNode; color: string; solid?: boolean; sx?: SxProps<Theme> }) {
  return (
    <Box
      component="span"
      sx={[
        { bgcolor: solid ? color : "transparent", color: solid ? c.bg : color, border: solid ? 0 : `1px solid ${color}`, padding: solid ? "4px 10px" : "3px 10px", borderRadius: `${hk.radius.chip}px` },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}

/** "[OK] text" terminal status line. */
export function TermLine({ tag, color = c.green, children }: { tag: string; color?: string; children: ReactNode }) {
  return (
    <Box>
      <Box component="span" sx={{ color }}>{tag}</Box> {children}
    </Box>
  );
}
