import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { AuditEntry, AuditOutcome } from "@/features/audit/types/audit-types";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { maskAuditEntry } from "@/features/audit/utils/audit-masking";

const outcomeMeta: Record<AuditOutcome, { color: "success" | "error" | "warning" | "info"; label: string }> = {
  SUCCESS: { color: "success", label: "Thành công" },
  FAILURE: { color: "error", label: "Thất bại" },
  DENIED: { color: "warning", label: "Từ chối" },
  PARTIAL: { color: "info", label: "Một phần" },
};

export function AuditTable({ entries, isLoading }: { entries: AuditEntry[]; isLoading: boolean }) {
  return (
    <TableContainer sx={{ minHeight: 380 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Hành động</TableCell>
            <TableCell>Người thực hiện</TableCell>
            <TableCell>Kết quả</TableCell>
            <TableCell>Tài nguyên</TableCell>
            <TableCell>Phạm vi</TableCell>
            <TableCell>Thời gian</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? <AuditTableSkeleton /> : entries.map((entry) => <AuditRow entry={entry} key={entry.id} />)}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const safe = maskAuditEntry(entry);
  const outcome = safe.outcome ? outcomeMeta[safe.outcome] : null;
  return (
    <TableRow hover>
      <TableCell sx={{ fontWeight: 600 }}>{safe.action}</TableCell>
      <TableCell sx={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{safe.actorId ?? "Ẩn danh"}</TableCell>
      <TableCell>{outcome ? <Chip color={outcome.color} label={outcome.label} size="small" variant="outlined" /> : "-"}</TableCell>
      <TableCell>
        <Typography sx={{ fontWeight: 600 }} variant="body2">{safe.resourceType ?? "-"}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{safe.scopeType ?? "-"}</Typography>
      </TableCell>
      <TableCell>{formatOccurredAt(safe.occurredAt)}</TableCell>
    </TableRow>
  );
}

function AuditTableSkeleton() {
  return Array.from({ length: 7 }, (_, index) => (
    <TableRow key={`audit-skeleton-${index}`}>
      {Array.from({ length: 6 }, (_, cell) => <TableCell key={cell}><Skeleton width={cell === 0 ? "80%" : "60%"} /></TableCell>)}
    </TableRow>
  ));
}

function formatOccurredAt(value?: string) {
  return formatDateTimeVi(value) || "-";
}
