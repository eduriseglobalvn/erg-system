import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { StreakDays, medalColor } from "@/features/elearning/class-leaderboard/components/class-leaderboard-table";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";

const t = ergEnterpriseTokens;
// Second, first, third from left to right, the first one standing tallest.
const PLACES = [{ index: 1, height: 64 }, { index: 0, height: 88 }, { index: 2, height: 48 }];

/** Gold, silver and bronze for the top three ranked students (design H03). */
export function LeaderboardPodium({ entries }: { entries: readonly ClassLeaderboardEntry[] }) {
  const top = entries.filter((entry) => entry.rank != null && entry.rank <= 3).slice(0, 3);
  if (!top.length) return null;
  return (
    <Box sx={{ alignItems: "end", display: "grid", gap: 1.5, gridTemplateColumns: "repeat(3, minmax(0, 1fr))", maxWidth: 420, mx: "auto", width: "100%" }}>
      {PLACES.map(({ index, height }) => {
        const entry = top[index];
        if (!entry) return <Box key={index} />;
        const color = medalColor(entry.rank) ?? t.color.border;
        const name = entry.studentName || "Học sinh";
        return (
          <Box key={entry.studentId} sx={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
            <Avatar sx={{ bgcolor: alpha(color, 0.16), border: `2px solid ${color}`, color: "text.primary", height: 44, typography: "subtitle2", width: 44 }}>
              {getInitials(name)}
            </Avatar>
            <Typography noWrap variant="body2" sx={{ color: entry.isViewer ? "primary.main" : "text.primary", fontWeight: "fontWeightMedium", maxWidth: "100%" }}>
              {name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{entry.xp.toLocaleString("vi-VN")} XP</Typography>
            <StreakDays days={entry.streakDays} />
            <Box
              sx={{
                alignItems: "center",
                bgcolor: alpha(color, 0.18),
                borderRadius: `${t.radius.control}px ${t.radius.control}px 0 0`,
                borderTop: `3px solid ${color}`,
                color,
                display: "flex",
                height,
                justifyContent: "center",
                typography: "h6",
                width: "100%",
              }}
            >
              {entry.rank}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
