import Box from "@mui/material/Box";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgTable } from "@/components/erg-mui/erg-table";
import { AppleAvatar } from "@/features/employee-management/components/apple-ui-tokens";
import {
  ACCESS_RESULT_LABEL,
  accessResult,
  describeDevice,
  describeSecurityEvent,
  formatIpAddress,
} from "@/features/employee-management/lib/access-log-display";
import type { SecurityFeedItem } from "@/features/employee-management/types/employee-management";
import { formatDateTimeVi } from "@/domain/formatters/format-date";

export function AccessLogTable({ rows }: { rows: SecurityFeedItem[] }) {
  return (
    <ErgTable aria-label="Nhật ký truy cập nhân sự" sx={{ "& .MuiTableCell-head": { whiteSpace: "nowrap" } }}>
      <TableHead>
        <TableRow>
          <TableCell>Thời gian</TableCell>
          <TableCell>Nhân sự</TableCell>
          <TableCell>Sự kiện</TableCell>
          <TableCell>Thiết bị</TableCell>
          <TableCell>Địa chỉ IP</TableCell>
          <TableCell>Kết quả</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((event) => {
          const result = accessResult(event);
          return (
            <TableRow hover key={`${event.sourceType}:${event.id}`}>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTimeVi(event.occurredAt)}</TableCell>
              <TableCell sx={{ maxWidth: 260 }}>
                <Box sx={{ alignItems: "center", display: "flex", gap: 1.25, minWidth: 0 }}>
                  <AppleAvatar name={event.userName || event.userId} size={28} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: "fontWeightMedium" }} variant="body2">
                      {event.userName || "Không xác định"}
                    </Typography>
                    <Typography color="text.secondary" noWrap variant="caption">{event.userEmail || "—"}</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{describeSecurityEvent(event)}</Typography>
                {event.reason ? <Typography color="text.secondary" variant="caption">{event.reason}</Typography> : null}
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{describeDevice(event)}</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatIpAddress(event.ipAddress)}</TableCell>
              <TableCell>
                {/* Chỉ gắn nhãn khi có vấn đề; dòng thành công để trống cho dễ quét. */}
                {result === "failed" || result === "warning" ? (
                  <ErgStatusChip label={ACCESS_RESULT_LABEL[result]} tone={result === "failed" ? "error" : "warning"} />
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </ErgTable>
  );
}
