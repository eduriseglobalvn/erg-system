import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { formatTimeVi } from "@/domain/formatters/format-date";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import type { DraftStatus } from "./use-schedule-draft";

type Props = {
  batchLabel: string;
  batchStatus: "DRAFT" | "PUBLISHED" | "CANCELLED";
  errorCount: number;
  /** «Xuất Excel theo mẫu»: undefined = ẩn. */
  onExport?: () => void;
  onPublish: () => void;
  /** «Dùng lại tuần trước»: mo dialog dung lai lich tuan truoc; undefined = an. */
  onReusePrevious?: () => void;
  onRename: (anchor: HTMLElement) => void;
  onRetry: () => void;
  publishing: boolean;
  rowCount: number;
  savedAt: string | null;
  schoolName: string;
  status: DraftStatus;
};

function saveText(status: DraftStatus, savedAt: string | null, onRetry: () => void, draft: boolean) {
  if (status === "saving") return "Đang lưu…";
  if (status === "error") return <>Chưa lưu được · <Link component="button" onClick={onRetry} type="button" underline="hover">Thử lại</Link></>;
  if (status === "dirty") return "Đang chờ lưu…";
  if (!draft) return "";
  return savedAt ? `Tự lưu nháp · ${formatTimeVi(savedAt)}` : "Tự lưu nháp";
}

/** Dau trang «Thời khóa biểu · <trường>»: ten dot (doi ten duoc), trang thai, trang thai luu, nut xuat ban (contained duy nhat). */
export function ScheduleHeader({ batchLabel, batchStatus, errorCount, onExport, onPublish, onRename, onReusePrevious, onRetry, publishing, rowCount, savedAt, schoolName, status }: Props) {
  const blocked = errorCount > 0;
  const disabled = blocked || rowCount === 0 || batchStatus !== "DRAFT" || status !== "idle";
  return (
    <Stack spacing={1}>
      <Link href={adminPath("/calendar")} sx={{ typography: "body2" }} underline="hover">← Lịch giảng dạy</Link>
      <Stack direction="row" sx={{ alignItems: "flex-start", flexWrap: "wrap", gap: 2, justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h1">
            {schoolName ? `Thời khóa biểu · ${schoolName}` : "Thời khóa biểu"}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
            {batchLabel ? (
              batchStatus === "CANCELLED" ? <Chip label={batchLabel} size="small" /> : (
                <Chip
                  aria-label={`Đổi tên đợt ${batchLabel}`}
                  clickable
                  icon={<EditOutlinedIcon fontSize="small" />}
                  label={batchLabel}
                  onClick={(event) => onRename(event.currentTarget)}
                  size="small"
                  sx={{ bgcolor: scheduleTokens.published.bg, border: 1, borderColor: "primary.main", color: scheduleTokens.published.text, flexDirection: "row-reverse", "& .MuiChip-icon": { ml: -0.5, mr: 0.5 } }}
                />
              )
            ) : null}
            {batchLabel ? <Chip label={batchStatus === "PUBLISHED" ? "Đã xuất bản" : batchStatus === "CANCELLED" ? "Đã huỷ" : "Nháp"} size="small" sx={{ bgcolor: scheduleTokens.neutral.bg, color: scheduleTokens.neutral.text }} /> : null}
            <Typography aria-live="polite" sx={{ color: status === "error" ? "error.main" : "text.secondary", typography: "caption" }}>{saveText(status, savedAt, onRetry, batchStatus === "DRAFT")}</Typography>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {onReusePrevious ? <ErgButton onClick={onReusePrevious} variant="outlined">Dùng lại tuần trước</ErgButton> : null}
        {onExport ? <ErgButton onClick={onExport} variant="outlined">Xuất Excel theo mẫu</ErgButton> : null}
        <Tooltip title={blocked ? `Còn ${errorCount} xung đột cần xử lý` : ""}>
          <span>
            <ErgButton disabled={disabled} loading={publishing} onClick={onPublish} variant="contained">Xuất bản cho giáo viên</ErgButton>
          </span>
        </Tooltip>
        </Stack>
      </Stack>
    </Stack>
  );
}
