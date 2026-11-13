import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { keyframes, useTheme } from "@mui/material/styles";

import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { ChaseStrip } from "@/features/elearning/class-leaderboard/components/chase-strip";
import { LeaderboardCountdown } from "@/features/elearning/class-leaderboard/components/leaderboard-countdown";
import { LeaderboardPodium } from "@/features/elearning/class-leaderboard/components/leaderboard-podium";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;
const spin = keyframes`from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); }`;

// Horizontal offsets are percentages of the arena, top is in px, as in the design. `dot` = small round piece.
const CONFETTI = [
  { side: { left: "9%" }, top: 120, color: t.podium.confetti.blue, turn: 25 },
  { side: { left: "17%" }, top: 210, color: t.podium.confetti.gold, turn: -30 },
  { side: { right: "12%" }, top: 110, color: t.podium.confetti.fire, turn: 40 },
  { side: { right: "20%" }, top: 230, color: t.podium.confetti.green, turn: -15 },
  { side: { left: "30%" }, top: 70, color: t.podium.confetti.green, turn: 0, dot: true },
  { side: { right: "32%" }, top: 84, color: t.podium.confetti.blue, turn: 0, dot: true },
] as const;

type ArenaProps = {
  entries: readonly ClassLeaderboardEntry[];
  title: string;
  subtitle: string;
  /** Board close time; omitted for the course board, which never closes. */
  endsAt?: string;
  onStart?: () => void;
};

/** Top-3 card of the "Thi đua" screen (design H08 / H03b): title and countdown, spinning gold rays, confetti, podium and the chase strip. */
export function PodiumArena({ entries, title, subtitle, endsAt, onStart }: ArenaProps) {
  const phone = useMediaQuery(useTheme().breakpoints.down("sm"));
  return (
    <>
    <Box aria-labelledby="podium-title" component="section" data-design="H08.arena" sx={{ background: t.podium.arena, border: 1, borderColor: t.color.border, borderRadius: `${t.radius.card}px`, display: "grid", gap: 2, overflow: "hidden", p: { xs: 2, md: 3 }, position: "relative" }}>
      <Box aria-hidden data-design="H08.rays" sx={{ animation: `${spin} 90s linear infinite`, background: t.podium.rays, height: 900, left: "50%", mask: t.podium.raysMask, pointerEvents: "none", position: "absolute", top: 150, WebkitMask: t.podium.raysMask, width: 900 }} />
      {CONFETTI.map((piece, i) => {
        const dot = "dot" in piece;
        return (
          <Box aria-hidden data-design="H08.confetti" key={i} sx={{ ...piece.side, bgcolor: piece.color, borderRadius: dot ? "50%" : "2px", display: { xs: i < 4 ? "block" : "none", md: "block" }, height: dot ? 6 : 14, opacity: 0.75, position: "absolute", top: piece.top, transform: `rotate(${piece.turn}deg)`, width: dot ? 6 : 8 }} />
        );
      })}
      <Box sx={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", position: "relative" }}>
        <Box>
          <Typography component="h2" id="podium-title" variant="h3">{title}</Typography>
          <Typography component="p" variant="caption" sx={{ color: "text.secondary" }}>{subtitle}</Typography>
        </Box>
        {endsAt ? <LeaderboardCountdown endsAt={endsAt} /> : null}
      </Box>
      <Box sx={{ position: "relative" }}><LeaderboardPodium entries={entries} /></Box>
      {phone ? null : <ChaseStrip entries={entries} onStart={onStart} />}
    </Box>
    {phone ? <ChaseStrip compact entries={entries} onStart={onStart} /> : null}
    </>
  );
}
