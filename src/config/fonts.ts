// ---------------------------------------------------------------------------
// Font configuration for ERG system.
// The app uses Public Sans for body/UI and Fraunces for editorial headings.
// font-display: swap ensures text is visible immediately during font load.
// ---------------------------------------------------------------------------

export const appFontStack = '"Public Sans", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const headingFontStack = '"Fraunces", "Public Sans", serif';
export const monoFontStack = '"JetBrains Mono", "SF Mono", ui-monospace, monospace';

export const quizFontStacks = {
  "Public Sans": appFontStack,
  "Fraunces": headingFontStack,
  "Default": appFontStack,
} as const;

export const defaultQuizFontFamily = "Public Sans";

export const quizEditorFontOptions = Object.keys(quizFontStacks) as Array<keyof typeof quizFontStacks>;

export function resolveQuizFontStack(fontFamily: string) {
  return quizFontStacks[fontFamily as keyof typeof quizFontStacks] ?? appFontStack;
}

// Injects font-display CSS for critical font families.
// Call once in main.tsx before React mounts.
export function injectFontDisplaySwap() {
  if (typeof document === "undefined") return;
  const id = "erg-font-display-hint";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @font-face {
      font-family: "Public Sans";
      src: local("Public Sans");
      font-display: swap;
    }
    @font-face {
      font-family: "Fraunces";
      src: local("Fraunces");
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}
