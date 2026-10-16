// ---------------------------------------------------------------------------
// Font configuration for ERG system.
// Operational UI uses the bundled Manrope family. Quiz content can still opt
// into its explicit Public Sans/Fraunces choices through quizFontStacks.
// font-display: swap ensures text is visible immediately during font load.
// ---------------------------------------------------------------------------

export const appFontStack = '"Manrope", "Manrope Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const headingFontStack = '"Manrope", "Manrope Variable", sans-serif';
export const monoFontStack = '"JetBrains Mono", "SF Mono", ui-monospace, monospace';

export const quizFontStacks = {
  "Manrope": appFontStack,
  "Public Sans": '"Public Sans", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "Fraunces": '"Fraunces", "Public Sans", serif',
  "Arial": 'Arial, "Helvetica Neue", sans-serif',
  "Times New Roman": '"Times New Roman", Times, serif',
  "Calibri": 'Calibri, "Segoe UI", sans-serif',
  "Cambria": 'Cambria, Georgia, serif',
  "Georgia": 'Georgia, "Times New Roman", serif',
  "Verdana": 'Verdana, Geneva, sans-serif',
  "Tahoma": 'Tahoma, Geneva, sans-serif',
  "Trebuchet MS": '"Trebuchet MS", Arial, sans-serif',
  "Segoe UI": '"Segoe UI", "Manrope", sans-serif',
  "Courier New": '"Courier New", Courier, monospace',
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
