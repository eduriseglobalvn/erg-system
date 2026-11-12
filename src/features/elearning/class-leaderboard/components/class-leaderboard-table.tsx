import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ErgDataTableShell, ErgTable } from "@/components/erg-mui/erg-table";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";

const t = ergEnterpriseTokens;

export function medalColor(rank: number | null | undefined) {
  return rank === 1 ? t.medal.gold : rank === 2 ? t.medal.silver : rank === 3 ? t.medal.bronze : undefined;
}

export function StreakDays({ days }: { days: number }) {
  if (!days) return <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>—</Typography>;
  return (
    <Stack component="span" direction="row" spacing={0.25} sx={{ alignItems: "center", color: t.color.warning, display: "inline-flex" }}>
      <LocalFireDepartmentRoundedIcon fontSize="small" />
      <Typography component="span" variant="body2" sx={{ color: "text.primary" }}>{days}</Typography>
    </Stack>
  );
}

/** Up/down versus the previous period; "—" when there is nothing to compare. */
function RankChange({ change }: { change: number | null | undefined }) {
  if (!change) return <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>—</Typography>;
  const up = change > 0;
  return (
    <Stack
      aria-label={up ? `Lên ${change} hạng` : `Xuống ${-change} hạng`}
      component="span"
      direction="row"
      sx={{ alignItems: "center", color: up ? "success.main" : "error.main", display: "inline-flex" }}
    >
      {up ? <ArrowUpwardRoundedIcon fontSize="small" /> : <ArrowDownwardRoundedIcon fontSize="small" />}
      <Typography component="span" variant="body2" sx={{ color: "inherit" }}>{Math.abs(change)}</Typography>
    </Stack>
  );
}

/** Rank, student, streak, XP and change; the viewer's row is highlighted. Only XP is shown, never scores. */
export function ClassLeaderboardTable({ entries }: { entries: readonly ClassLeaderboardEntry[] }) {
  return (
    <ErgDataTableShell scrollLabel="Bảng thi đua">
      <ErgTable size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 64 }}>Hạng</TableCell>
            <TableCell>Học sinh</TableCell>
            <TableCell align="right">Chuỗi</TableCell>
            <TableCell align="right">XP</TableCell>
            <TableCell align="right" sx={{ width: 72 }}>Thay đổi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry, index) => {
            const name = entry.studentName || "Học sinh";
            const medal = medalColor(entry.rank);
            return (
              <TableRow
                aria-current={entry.isViewer ? "true" : undefined}
                key={entry.studentId || index}
                sx={entry.isViewer ? { bgcolor: t.color.primarySofter } : undefined}
              >
                <TableCell>
                  <Box sx={{ color: medal ?? "text.secondary", fontWeight: medal ? "fontWeightBold" : undefined }}>{entry.rank ?? "—"}</Box>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
                    <Avatar sx={{ bgcolor: entry.isViewer ? "primary.main" : t.color.surfaceSubtle, color: entry.isViewer ? "primary.contrastText" : "text.secondary", height: 32, typography: "caption", width: 32 }}>
                      {getInitials(name)}
                    </Avatar>
                    <Typography noWrap variant="body2" sx={{ color: entry.isViewer ? "primary.main" : "text.primary", fontWeight: entry.isViewer ? "fontWeightMedium" : undefined }}>
                      {name}{entry.isViewer ? " (bạn)" : ""}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right"><StreakDays days={entry.streakDays} /></TableCell>
                <TableCell align="right" sx={{ fontWeight: "fontWeightMedium" }}>{entry.xp.toLocaleString("vi-VN")}</TableCell>
                <TableCell align="right"><RankChange change={entry.rankChange} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </ErgTable>
    </ErgDataTableShell>
  );
}
