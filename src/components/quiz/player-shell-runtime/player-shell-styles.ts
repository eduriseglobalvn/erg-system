import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export const playerViewportClass = "lg:h-[calc(100vh-3.75rem)]";
// Two columns of equal height: question card on the left, 340px question list on the right.
export const playerGridClass = `grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch ${playerViewportClass}`;

export function buildPlayerStyles(isTrainingMode: boolean) {
  const playerCardStyle = {
    backgroundColor: "var(--quiz-player-bg)",
    borderColor: "var(--quiz-canvas-border)",
  };
  const canvasStyle = {
    backgroundColor: "var(--quiz-player-bg)",
    borderColor: "var(--quiz-canvas-border)",
  };
  const headerStyle = {
    background: "var(--quiz-header-bg)",
    color: "var(--quiz-header-text)",
  };
  const accentButtonStyle = {
    backgroundColor: "var(--quiz-accent, #000088)",
    color: `var(--quiz-accent-contrast, ${ergEnterpriseTokens.color.surface})`,
    boxShadow: "0 10px 24px rgba(0,0,136,0.18)",
  };
  const modeBadgeStyle = isTrainingMode
    ? {
        backgroundColor: "rgba(0,0,136,0.08)",
        color: "#000088",
      }
    : {
        backgroundColor: "rgba(232,40,40,0.10)",
        color: "#b91c1c",
      };
  return { playerCardStyle, canvasStyle, headerStyle, accentButtonStyle, modeBadgeStyle };
}
