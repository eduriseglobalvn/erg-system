import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { formatViNumber } from "@/domain/student-tier/tiers";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

export type Chase =
  | { kind: "chase"; me: ClassLeaderboardEntry; third: ClassLeaderboardEntry; gap: number; ratio: number }
  | { kind: "hold"; me: ClassLeaderboardEntry; lead: number | null };

/** Where the viewer stands against the podium: chasing rank 3, or holding a podium place over rank 4. Null when unranked. */
export function chaseOf(entries: readonly ClassLeaderboardEntry[]): Chase | null {
  const me = entries.find((entry) => entry.isViewer && entry.rank != null);
  if (!me || me.rank == null) return null;
  if (me.rank <= 3) {
    const fourth = entries.find((entry) => entry.rank === 4);
    return { kind: "hold", me, lead: fourth ? Math.max(0, me.xp - fourth.xp) : null };
  }
  const third = entries.find((entry) => entry.rank === 3);
  if (!third) return null;
  return { kind: "chase", me, third, gap: Math.max(1, third.xp - me.xp), ratio: third.xp > 0 ? Math.min(1, me.xp / third.xp) : 0 };
}

/** "Bạn đang #4 · 380 XP" with the way onto the podium (design H08 / H03b); holds the page's one contained button. */
export function ChaseStrip({ entries, onStart, compact = false }: { entries: readonly ClassLeaderboardEntry[]; onStart?: () => void; /** Phone layout (H03b): its own card under the arena, no avatar. */ compact?: boolean }) {
  const chase = chaseOf(entries);
  if (!chase) return null;
  if (compact) return <CompactChase chase={chase} onStart={onStart} />;
  const { me } = chase;
  const name = me.studentName || "Học sinh";
  const holding = chase.kind === "hold";
  return (
    <Box
      data-design="H08.chase"
      sx={{ alignItems: { md: "center" }, bgcolor: t.color.primarySofter, border: 1, borderColor: t.color.primarySoft, borderRadius: `${t.radius.card}px`, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, position: "relative", px: { xs: 2, md: 2.25 }, py: 1.75 }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, minWidth: 0 }}>
        <Avatar sx={{ bgcolor: "primary.main", border: `2px solid ${t.color.surface}`, boxShadow: `0 0 0 2px ${t.color.primary}`, color: "primary.contrastText", height: 40, typography: "caption", width: 40 }}>{getInitials(name)}</Avatar>
        <Box>
          <Typography variant="subtitle2">{`Bạn đang #${me.rank} · ${formatViNumber(me.xp)} XP`}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {holding
              ? `Giữ vị trí${chase.lead != null ? `: hơn hạng 4 ${formatViNumber(chase.lead)} XP` : ""}`
              : <>Còn <Box component="b" sx={{ color: "primary.main" }}>{`${formatViNumber(chase.gap)} XP`}</Box>{` là lên bục, vượt ${chase.third.studentName || "bạn đứng hạng 3"}`}</>}
          </Typography>
        </Box>
      </Box>
      {holding ? <Box sx={{ flex: 1 }} /> : (
        <Box aria-label={`Đã có ${formatViNumber(me.xp)} trên ${formatViNumber(chase.third.xp)} XP để lên hạng 3`} role="img" sx={{ alignSelf: "stretch", bgcolor: t.color.surface, borderRadius: `${t.radius.chip}px`, flex: 1, height: 10, my: { md: "auto" }, position: "relative" }}>
          <Box sx={{ bgcolor: "primary.main", borderRadius: `${t.radius.chip}px`, height: "100%", width: `${Math.round(chase.ratio * 100)}%` }} />
          <Box component="span" sx={{ alignItems: "center", bgcolor: t.medal.bronze, border: `2px solid ${t.color.surface}`, borderRadius: "50%", boxSizing: "border-box", color: t.color.surface, display: "grid", height: 22, placeItems: "center", position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", typography: "caption", width: 22 }}>3</Box>
        </Box>
      )}
      {onStart ? <ErgButton variant="contained" trailingIcon={<ArrowForwardRoundedIcon />} onClick={onStart} sx={{ width: { xs: "100%", md: "auto" } }}>{holding ? "Làm 1 bài để giữ vị trí" : "Làm 1 bài để lên bục"}</ErgButton> : null}
    </Box>
  );
}

/** Phone chase card (design H03b): "Còn 40 XP là lên bục" with 380 / 420, the bar and a full-width contained button. */
function CompactChase({ chase, onStart }: { chase: Chase; onStart?: () => void }) {
  const holding = chase.kind === "hold";
  return (
    <Box data-design="H03b.chase" sx={{ bgcolor: t.color.primarySofter, border: 1, borderColor: t.color.primarySoft, borderRadius: `${t.radius.card}px`, display: "grid", gap: 1, p: 1.75 }}>
      <Box sx={{ alignItems: "baseline", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <Typography variant="subtitle2">{holding ? `Giữ vị trí${chase.lead != null ? `: hơn hạng 4 ${formatViNumber(chase.lead)} XP` : ""}` : `Còn ${formatViNumber(chase.gap)} XP là lên bục`}</Typography>
        {holding ? null : <Typography variant="caption" sx={{ color: "text.secondary" }}>{`${formatViNumber(chase.me.xp)} / ${formatViNumber(chase.third.xp)}`}</Typography>}
      </Box>
      {holding ? null : (
        <Box aria-label={`${formatViNumber(chase.me.xp)} trên ${formatViNumber(chase.third.xp)} XP`} role="img" sx={{ bgcolor: t.color.surface, borderRadius: `${t.radius.chip}px`, height: 10 }}>
          <Box sx={{ bgcolor: "primary.main", borderRadius: `${t.radius.chip}px`, height: "100%", width: `${Math.round(chase.ratio * 100)}%` }} />
        </Box>
      )}
      {onStart ? <ErgButton fullWidth variant="contained" trailingIcon={<ArrowForwardRoundedIcon />} onClick={onStart}>{holding ? "Làm 1 bài để giữ vị trí" : "Làm 1 bài để lên bục"}</ErgButton> : null}
    </Box>
  );
}
