import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { leaderboardCountdown } from "@/features/elearning/class-leaderboard/leaderboard-period";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

/** "Chốt bảng sau [2] ngày [14] giờ [32] phút" (spec 5.9); under a day the day box is dropped, phones skip the minutes. */
export function LeaderboardCountdown({ endsAt, now, compact = false }: { endsAt: string; now?: Date; /** Phone: smaller boxes and "Chốt sau". */ compact?: boolean }) {
  const left = leaderboardCountdown(endsAt, now);
  if (!left) return null;
  const parts = [
    ...(left.days ? [[left.days, "ngày", true] as const] : []),
    [left.hours, "giờ", true] as const,
    [left.minutes, "phút", false] as const,
  ];
  return (
    <Box data-design="H08.countdown" sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{compact ? "Chốt sau" : "Chốt bảng sau"}</Typography>
      {parts.map(([value, unit, phone]) => (
        <Box key={unit} sx={{ alignItems: "center", display: phone ? "flex" : { xs: "none", md: "flex" }, gap: 0.5 }}>
          <Box sx={{ bgcolor: t.color.surface, border: 1, borderColor: t.color.border, borderRadius: `${t.radius.control}px`, minWidth: compact ? 28 : 34, py: compact ? 0.25 : 0.5, textAlign: "center", typography: "subtitle2" }}>{value}</Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>{unit}</Typography>
        </Box>
      ))}
    </Box>
  );
}
