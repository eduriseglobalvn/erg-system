import Box from "@mui/material/Box";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

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

/** Dark mono theme for the game routes plus the CSS variables the quiz question components read (teacher-template hooks). */
export function HackThemeProvider({ children }: { children: ReactNode }) {
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
