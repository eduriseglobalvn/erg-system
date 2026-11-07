import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgDataTableShell, ErgTable, ErgTableToolbar } from "@/components/erg-mui/erg-table";
import type { RecentPunch } from "../api/timekeeping-types";
import { PUNCH_STATUS, punchTimeText, verifyText } from "./punch-status";

type RecentPunchesTableProps = { punches: readonly RecentPunch[]; updatedAt: string };

/** "Lượt chấm gần nhất". `updatedAt` is the time of the last successful fetch (HH:mm). */
export function RecentPunchesTable({ punches, updatedAt }: RecentPunchesTableProps) {
  return (
    <ErgDataTableShell toolbar={<ErgTableToolbar meta={updatedAt ? `Cập nhật ${updatedAt}, tự làm mới mỗi phút khi tab đang mở` : undefined} title="Lượt chấm gần nhất" />}>
      <ErgTable aria-label="Lượt chấm gần nhất">
        <TableHead>
          <TableRow>
            {["Nhân sự", "Cơ sở", "Giờ", "Xác thực", "Trạng thái"].map((heading) => (
              <TableCell key={heading}>{heading}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {punches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}><Typography color="text.secondary" variant="body2">Chưa có lượt chấm nào.</Typography></TableCell>
            </TableRow>
          ) : (
            punches.map((punch) => {
              const status = PUNCH_STATUS[punch.status ?? "VALID"];
              return (
                <TableRow key={punch.id}>
                  <TableCell>{punch.userName}</TableCell>
                  <TableCell>{punch.siteName}</TableCell>
                  <TableCell>{punchTimeText(punch)}</TableCell>
                  <TableCell>{verifyText(punch)}</TableCell>
                  <TableCell><ErgStatusChip label={status.label} tone={status.tone} /></TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </ErgTable>
    </ErgDataTableShell>
  );
}
