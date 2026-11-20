import Box from "@mui/material/Box";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, type ReactNode } from "react";

import { monoFontStack } from "@/config/fonts";
import { hk } from "@/features/games/hack/hack-tokens";
import ergEnterpriseTheme from "@/themes/erg-enterprise-theme";

const c = hk.color;

// Nested over the app theme so the reused quiz question components (palette, typography, transitions)
// render dark and mono; only the game routes are wrapped in it.
const hackTheme = createTheme(ergEnterpriseTheme, {
  palette: {
    mode: "dark",
    primary: { main: c.green, dark: c.green, contrastText: c.bg },
    success: { main: c.green, dark: c.green },
    error: { main: c.red, dark: c.red },
    warning: { main: c.yellow, dark: c.yellow },
    info: { main: c.cyan },
    background: { default: c.bg, paper: c.bg },
    divider: c.border,
    text: { primary: c.text, secondary: c.dim, disabled: c.strike },
  },
  typography: { fontFamily: monoFontStack },
});

const MONO_FONT_LINK_ID = "hack-mono-font";

// JetBrains Mono is not bundled (no @fontsource package); like the quiz fonts in config/fonts.ts it comes from Google Fonts, only on the game routes.
function useMonoFont() {
  useEffect(() => {
    if (document.getElementById(MONO_FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = MONO_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

/** Dark mono theme for the game routes plus the CSS variables the quiz question components read (teacher-template hooks). */
export function HackThemeProvider({ children }: { children: ReactNode }) {
  useMonoFont();
  return (
    <ThemeProvider theme={hackTheme}>
      <Box
        sx={{
          fontFamily: monoFontStack,
          "--quiz-accent": c.green,
          "--quiz-accent-contrast": c.bg,
          "--quiz-highlight": c.selected,
          "--quiz-highlight-contrast": c.white,
          "--quiz-radius": `${hk.radius.panel}px`,
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
