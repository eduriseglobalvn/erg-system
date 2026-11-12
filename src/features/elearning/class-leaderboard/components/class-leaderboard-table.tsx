import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { ErgDataTableShell, ErgTable } from "@/components/erg-mui/erg-table";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { ClassLeaderboardEntry } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";

function formatPercent(value: number | null | undefined) {
  return typeof value === "number" ? `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%` : "—";
}

/** Rank, name, average and completed count; the viewer's own row is highlighted. Unranked students show "—". */
export function ClassLeaderboardTable({ entries }: { entries: readonly ClassLeaderboardEntry[] }) {
  return (
    <ErgDataTableShell scrollLabel="Bảng xếp hạng lớp">
      <ErgTable size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 72 }}>Hạng</TableCell>
            <TableCell>Học sinh</TableCell>
            <TableCell align="right">Điểm TB</TableCell>
            <TableCell align="right">Bài đã nộp</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow
              aria-current={entry.isViewer ? "true" : undefined}
              key={entry.studentId || index}
              sx={entry.isViewer ? { bgcolor: ergEnterpriseTokens.color.primarySofter, "& td": { color: "primary.main", fontWeight: "fontWeightMedium" } } : undefined}
            >
              <TableCell>{entry.rank ?? "—"}</TableCell>
              <TableCell>{entry.studentName || "Học sinh"}{entry.isViewer ? " (bạn)" : ""}</TableCell>
              <TableCell align="right">{formatPercent(entry.averagePercent)}</TableCell>
              <TableCell align="right">{entry.completedCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </ErgTable>
    </ErgDataTableShell>
  );
}
