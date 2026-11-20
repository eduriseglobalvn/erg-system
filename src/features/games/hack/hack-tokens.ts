// Terminal-hacker palette for the Hack game. Taken 1:1 from wayground/design/*.dc.html; only the
// game routes use it (see hack-theme.tsx). Hard-coded hex lives here on purpose: the design-token
// baseline counts this file and nothing else in features/games.
export const HACK_GAME_DISPLAY_NAME = "ERG Hack";

export const hk = {
  color: {
    bg: "#04100A",
    panel: "#071A10",
    selected: "#0C2B1A",
    border: "#1E7A45",
    dim: "#7CCB9A",
    text: "#D6FFE6",
    white: "#FFFFFF",
    green: "#39FF88",
    yellow: "#FFC83D",
    cyan: "#4DD8FF",
    red: "#FF4D5E",
    pink: "#FF8F9A",
    mint: "#B8F5CF",
    disabled: "#143D26",
    strike: "#3F6B52",
    cyanPanel: "#071E26",
    errPanel: "#2A0E13",
    errText: "#FFE1E4",
    weakPanel: "#170A0D",
    weakBorder: "#7A2530",
    rain: "#0E3B22",
    rainBright: "#14552F",
    rainHead: "#2FA862",
    amberBg: "#100C02",
    amberText: "#FFF1CC",
    amberPanel: "#1A1404",
    amberBorder: "#7A5F10",
    amberSoft: "#FFDF8A",
    amberRain: "#3A2E08",
  },
  font: { weightMedium: 500, weightBold: 700 },
  // Font sizes (px) used by the screens, named by their value.
  fs: { 10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20, 22: 22, 24: 24, 26: 26, 28: 28, 30: 30, 34: 34, 40: 40, 44: 44, 46: 46, 56: 56, 58: 58, 64: 64, 68: 68, 96: 96, 120: 120, 160: 160, 200: 200 },
  radius: { panel: 6, chip: 4 },
  rain: { desktopColumns: 46, phoneColumns: 16 },
} as const;

/** Below this width (px) the phone layout (HP*.dc.html) is used. */
export const HACK_PHONE_MAX_WIDTH = 767;
