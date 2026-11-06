// ---------------------------------------------------------------------------
// Font configuration for ERG system.
// Operational UI uses the bundled Be Vietnam Pro family; quiz text defaults to Public Sans.
// font-display: swap ensures text is visible immediately during font load.
// ---------------------------------------------------------------------------

export const headingFontStack = '"Be Vietnam Pro", sans-serif';
export const monoFontStack = '"JetBrains Mono", "SF Mono", ui-monospace, monospace';

export const defaultQuizFontFamily = "Public Sans";

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
