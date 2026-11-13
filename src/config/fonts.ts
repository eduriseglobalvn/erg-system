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

  // Non-blocking Google Fonts stylesheet; index.html cannot do this with an inline onload under the CSP.
  const quizFonts = document.createElement("link");
  quizFonts.rel = "stylesheet";
  quizFonts.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Public+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(quizFonts);
}
