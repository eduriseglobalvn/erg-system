import Button from "@mui/material/Button";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

import { ErgDataTableShell, ErgEmptyState, ErgLoadingSkeleton, ErgTable, ErgTableToolbar } from "@/components/erg-mui";
import type { LearningStandardPackage } from "@/features/lcms/integrations/learning-standards/api/learning-standards-api";
import { LearningStandardsStateChip } from "@/features/lcms/integrations/learning-standards/components/learning-standards-state-chip";

type PackageTableProps = {
  packages: LearningStandardPackage[];
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onValidate: (value: LearningStandardPackage) => void;
  onLaunch: (value: LearningStandardPackage) => void;
  onRetry: () => void;
};

export function LearningStandardsPackageTable({ packages, isLoading, isError, canManage, onValidate, onLaunch, onRetry }: PackageTableProps) {
  return (
    <ErgDataTableShell toolbar={<ErgTableToolbar title="SCORM packages" meta={`${packages.length} gói trong tenant hiện tại`} />}>
      {isLoading ? (
        <ErgLoadingSkeleton rows={6} />
      ) : isError ? (
        <ErgEmptyState title="Không tải được package" description="Kiểm tra quyền learning.standards.read hoặc thử lại sau." action={<Button onClick={onRetry}>Thử lại</Button>} />
      ) : packages.length === 0 ? (
        <ErgEmptyState title="Chưa có SCORM package" description="Đăng ký metadata trước, sau đó upload artifact qua pipeline storage của backend." />
      ) : (
        <ErgTable aria-label="Learning standard packages">
          <TableHead>
            <TableRow>
              <TableCell>Package</TableCell>
              <TableCell>Chuẩn</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Kích thước</TableCell>
              <TableCell align="right">Phiên bản</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packages.map((value) => (
              <TableRow hover key={value.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 800 }} variant="body2">{value.title}</Typography>
                  <Typography color="text.secondary" variant="caption">{value.id} · {value.packageVersion}</Typography>
                  {value.quarantineReason ? <Typography color="error.main" variant="caption">{value.quarantineReason}</Typography> : null}
                </TableCell>
                <TableCell>{value.standard === "SCORM_2004" ? "SCORM 2004" : "SCORM 1.2"}</TableCell>
                <TableCell><LearningStandardsStateChip status={value.status} /></TableCell>
                <TableCell align="right">{formatBytes(value.byteSize)}</TableCell>
                <TableCell align="right">v{value.recordVersion}</TableCell>
                <TableCell align="right">
                  {canManage ? <Button size="small" startIcon={<FactCheckRoundedIcon />} onClick={() => onValidate(value)}>Kiểm tra</Button> : null}
                  {value.status === "READY" ? <Button size="small" startIcon={<PlayArrowRoundedIcon />} onClick={() => onLaunch(value)}>Mở</Button> : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ErgTable>
      )}
    </ErgDataTableShell>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
