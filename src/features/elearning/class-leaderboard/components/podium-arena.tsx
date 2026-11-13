import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
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

// Phone set (H03b): smaller pieces, different spots.
const PHONE_CONFETTI = [
  { side: { left: "8%" }, top: 100, color: t.podium.confetti.blue, turn: 25 },
  { side: { right: "9%" }, top: 96, color: t.podium.confetti.fire, turn: 40 },
  { side: { left: "22%" }, top: 170, color: t.podium.confetti.gold, turn: -30 },
  { side: { right: "20%" }, top: 180, color: t.podium.confetti.green, turn: -15 },
] as const;

type ArenaProps = {
  entries: readonly ClassLeaderboardEntry[];
  title: string;
  subtitle: string;
  /** Board close time; omitted for the course board, which never closes. */
  endsAt?: string;
  onStart?: () => void;
};

/** Top-3 card of the "Thi đua" screen (design H08 / H03b): title and countdown, gold rays, confetti, podium and the chase strip. */
export function PodiumArena({ entries, title, subtitle, endsAt, onStart }: ArenaProps) {
  const phone = useMediaQuery(useTheme().breakpoints.down("sm"));
  const confetti = phone ? PHONE_CONFETTI : CONFETTI;
  return (
    <>
    <Box aria-labelledby="podium-title" component="section" data-design="H08.arena" sx={{ background: t.podium.arena, border: 1, borderColor: t.color.border, borderRadius: `${t.radius.card}px`, display: "grid", gap: { xs: 1, md: 2 }, overflow: "hidden", p: { xs: "2px 0 4px", md: 3 }, position: "relative" }}>
      <Box aria-hidden data-design="H08.rays" sx={{ animation: `${spin} 90s linear infinite`, background: t.podium.rays, height: { xs: 560, md: 900 }, left: "50%", mask: t.podium.raysMask, pointerEvents: "none", position: "absolute", top: 150, transform: "translate(-50%, -50%)", WebkitMask: t.podium.raysMask, width: { xs: 560, md: 900 } }} />
      {confetti.map((piece, i) => {
        const dot = "dot" in piece;
        return (
          <Box aria-hidden data-design="H08.confetti" key={i} sx={{ ...piece.side, bgcolor: piece.color, borderRadius: dot ? "50%" : "2px", height: dot ? 6 : { xs: 11, md: 14 }, opacity: 0.75, position: "absolute", top: piece.top, transform: `rotate(${piece.turn}deg)`, width: dot ? 6 : { xs: 6, md: 8 } }} />
        );
      })}
      <Box sx={{ alignItems: "flex-start", borderBottom: { xs: `1px dashed ${t.color.borderStrong}`, md: 0 }, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", pb: { xs: 1.75, md: 0 }, position: "relative", px: { xs: 0.625, md: 0 } }}>
        <Box>
          <Typography component="h2" id="podium-title" variant="h6">{title}</Typography>
          {phone ? null : <Typography component="p" variant="caption" sx={{ color: "text.secondary" }}>{subtitle}</Typography>}
        </Box>
        {endsAt ? <LeaderboardCountdown compact={phone} endsAt={endsAt} /> : null}
      </Box>
      <Box sx={{ position: "relative" }}><LeaderboardPodium entries={entries} /></Box>
      {phone ? (
        <Box sx={{ alignItems: "flex-start", color: "text.secondary", display: "flex", gap: 0.75, justifyContent: "center", pb: 1.5, pt: 0.5, position: "relative", textAlign: "center", typography: "caption" }}>
          <MilitaryTechRoundedIcon sx={{ color: t.medal.gold, fontSize: t.size.iconSm }} />
          <span>Top 3 lúc chốt bảng nhận huy hiệu Vàng · Bạc · Đồng</span>
        </Box>
      ) : <ChaseStrip entries={entries} onStart={onStart} />}
    </Box>
    {phone ? <ChaseStrip compact entries={entries} onStart={onStart} /> : null}
    </>
  );
}
