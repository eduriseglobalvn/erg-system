import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type {
  CertificateRecord,
  CompetencyRecord,
  CompletionRecord,
  LearningPathRecord,
} from "@/features/lms/learning-paths/api/learning-outcomes-api";

export function OutcomeStatusChip({ status }: { status: string }) {
  const normalized = status.trim().toUpperCase();
  const color = normalized === "PUBLISHED" || normalized === "ISSUED" || normalized === "COMPLETED" || normalized === "ATTAINED"
    ? "success"
    : normalized === "REVOKED" || normalized === "EXPIRED" || normalized === "FAILED"
      ? "error"
      : normalized === "IN_PROGRESS" || normalized === "DRAFT"
        ? "warning"
        : "default";
  return <Chip color={color} label={statusLabel(normalized)} size="small" variant="outlined" />;
}

export function OutcomeTableShell({ children, minWidth = 680 }: { children: ReactNode; minWidth?: number }) {
  return (
    <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Table size="small" sx={{ minWidth }}>
        {children}
      </Table>
    </TableContainer>
  );
}

export function LearningPathTable({ paths, selectedId, onSelect }: { paths: LearningPathRecord[]; selectedId?: string; onSelect?: (id: string) => void }) {
  return (
    <OutcomeTableShell>
      <TableHead><TableRow><TableCell>Lộ trình</TableCell><TableCell>Phạm vi</TableCell><TableCell>Trạng thái</TableCell><TableCell align="right">Nút nội dung</TableCell><TableCell>Cập nhật</TableCell></TableRow></TableHead>
      <TableBody>
        {paths.map((path) => (
          <TableRow hover key={path.id} onClick={() => onSelect?.(path.id)} selected={path.id === selectedId} sx={{ cursor: onSelect ? "pointer" : "default" }}>
            <TableCell><Typography sx={{ fontWeight: 750 }}>{path.title}</Typography><Typography color="text.secondary" sx={{ maxWidth: 300 }} variant="caption">{path.description || "Chưa có mô tả"}</Typography></TableCell>
            <TableCell>{path.classId || path.educationUnitId || "Toàn đơn vị"}</TableCell>
            <TableCell><OutcomeStatusChip status={path.status} /></TableCell>
            <TableCell align="right">{path.nodeCount}</TableCell>
            <TableCell>{formatDate(path.updatedAt ?? path.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </OutcomeTableShell>
  );
}

export function CompetencyTable({ competencies }: { competencies: CompetencyRecord[] }) {
  return (
    <OutcomeTableShell minWidth={560}>
      <TableHead><TableRow><TableCell>Mã năng lực</TableCell><TableCell>Năng lực</TableCell><TableCell>Đơn vị giáo dục</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead>
      <TableBody>
        {competencies.map((competency) => (
          <TableRow key={competency.id} hover><TableCell sx={{ fontFamily: "monospace", fontWeight: 750 }}>{competency.code}</TableCell><TableCell><Typography sx={{ fontWeight: 700 }}>{competency.name}</Typography><Typography color="text.secondary" variant="caption">{competency.description || "Chưa có mô tả"}</Typography></TableCell><TableCell>{competency.educationUnitId || "Toàn đơn vị"}</TableCell><TableCell><OutcomeStatusChip status={competency.status} /></TableCell></TableRow>
        ))}
      </TableBody>
    </OutcomeTableShell>
  );
}

export function CompletionTable({ completions, pathTitleById }: { completions: CompletionRecord[]; pathTitleById?: Map<string, string> }) {
  return (
    <OutcomeTableShell minWidth={580}>
      <TableHead><TableRow><TableCell>Lộ trình</TableCell><TableCell>Tiến độ</TableCell><TableCell>Trạng thái</TableCell><TableCell>Đánh giá</TableCell></TableRow></TableHead>
      <TableBody>
        {completions.map((completion) => (
          <TableRow key={completion.id}><TableCell>{pathTitleById?.get(completion.learningPathId) ?? completion.learningPathId}</TableCell><TableCell>{completion.progressPercent}% ({completion.completedNodeCount}/{completion.requiredNodeCount})</TableCell><TableCell><OutcomeStatusChip status={completion.status} /></TableCell><TableCell>{formatDate(completion.evaluatedAt)}</TableCell></TableRow>
        ))}
      </TableBody>
    </OutcomeTableShell>
  );
}

export function CertificateTable({ certificates, pathTitleById, onRevoke }: { certificates: CertificateRecord[]; pathTitleById?: Map<string, string>; onRevoke?: (certificate: CertificateRecord) => void }) {
  return (
    <OutcomeTableShell minWidth={760}>
      <TableHead><TableRow><TableCell>Số chứng chỉ</TableCell><TableCell>Lộ trình</TableCell><TableCell>Người học</TableCell><TableCell>Trạng thái</TableCell><TableCell>Phát hành</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead>
      <TableBody>
        {certificates.map((certificate) => (
          <TableRow key={certificate.id}><TableCell sx={{ fontFamily: "monospace", fontWeight: 750 }}>{certificate.certificateNumber}</TableCell><TableCell>{pathTitleById?.get(certificate.learningPathId) ?? certificate.learningPathId}</TableCell><TableCell>{certificate.learnerId}</TableCell><TableCell><OutcomeStatusChip status={certificate.status} /></TableCell><TableCell>{formatDate(certificate.issuedAt)}</TableCell><TableCell align="right">{onRevoke && certificate.status === "ISSUED" ? <Typography color="error.main" onClick={() => onRevoke(certificate)} sx={{ cursor: "pointer", fontWeight: 750 }} variant="body2">Thu hồi</Typography> : "-"}</TableCell></TableRow>
        ))}
      </TableBody>
    </OutcomeTableShell>
  );
}

export function OutcomeLoadingState() {
  return <Box aria-label="Đang tải dữ liệu kết quả học tập" role="status" sx={{ display: "grid", gap: 1.25 }}><Skeleton height={56} variant="rounded" /><Skeleton height={56} variant="rounded" /><Skeleton height={180} variant="rounded" /></Box>;
}

export function OutcomeErrorState({ message = "Không thể tải dữ liệu kết quả học tập." }: { message?: string }) {
  return <Box role="alert" sx={{ alignItems: "center", border: "1px solid", borderColor: "error.light", borderRadius: 2, display: "flex", gap: 1, p: 2 }}><ErrorOutlineRoundedIcon color="error" /><Typography color="error.main" variant="body2">{message}</Typography></Box>;
}

export function OutcomeEmptyState({ title, description }: { title: string; description: string }) {
  return <Box sx={{ alignItems: "center", border: "1px dashed", borderColor: "divider", borderRadius: 2, display: "flex", flexDirection: "column", gap: 0.75, p: 4, textAlign: "center" }}><HourglassEmptyRoundedIcon color="disabled" /><Typography sx={{ fontWeight: 750 }}>{title}</Typography><Typography color="text.secondary" variant="body2">{description}</Typography></Box>;
}

export function OutcomeConfirmedBadge() {
  return <Chip color="success" icon={<CheckCircleOutlineRoundedIcon />} label="Đã xác nhận từ máy chủ" size="small" variant="outlined" />;
}

function statusLabel(status: string) {
  return ({ DRAFT: "Bản nháp", PUBLISHED: "Đã phát hành", ACTIVE: "Đang hoạt động", IN_PROGRESS: "Đang học", COMPLETED: "Hoàn thành", ATTAINED: "Đạt", ISSUED: "Đã cấp", REVOKED: "Đã thu hồi", EXPIRED: "Đã hết hạn", FAILED: "Không đạt" } as Record<string, string>)[status] ?? status;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(parsed);
}
