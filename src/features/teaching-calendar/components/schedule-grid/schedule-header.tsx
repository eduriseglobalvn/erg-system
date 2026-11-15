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
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
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
  /** Ten khung gio tiet dang dung (hien o dong phu). */
  templateName?: string;
};

const buttonSx = (radius: number) => ({ borderRadius: `${radius}px`, height: 40 });

function saveText(status: DraftStatus, savedAt: string | null, onRetry: () => void, draft: boolean) {
  if (status === "saving") return "Đang lưu…";
  if (status === "error") return <>Chưa lưu được · <Link component="button" onClick={onRetry} type="button" underline="hover">Thử lại</Link></>;
  if (status === "dirty") return "Đang chờ lưu…";
  if (!draft) return "";
  return savedAt ? `Tự lưu nháp · ${formatTimeVi(savedAt)}` : "Tự lưu nháp";
}

/** Dau trang «Thời khóa biểu · <trường>»: ten dot (doi ten duoc), trang thai, trang thai luu, nut xuat ban (contained duy nhat). */
export function ScheduleHeader({ batchLabel, batchStatus, errorCount, onExport, onPublish, onRename, onReusePrevious, onRetry, publishing, rowCount, savedAt, schoolName, status, templateName }: Props) {
  const blocked = errorCount > 0;
  const disabled = blocked || rowCount === 0 || batchStatus !== "DRAFT" || status !== "idle";
  const { color, type, radius } = ergEnterpriseTokens;
  return (
    <Stack direction="row" sx={{ alignItems: "flex-end", flexWrap: "wrap", gap: 2, justifyContent: "space-between" }}>
      <Box>
        <Link href={adminPath("/calendar")} sx={{ fontSize: type.small.fontSize }} underline="none">← Lịch giảng dạy</Link>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          {schoolName ? `Thời khóa biểu · ${schoolName}` : "Thời khóa biểu"}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.25 }}>
          {templateName ? (
            <Typography sx={{ color: color.textMuted, ...type.note }}>
              Giờ tiết theo bảng giờ {templateName} · <Link href={adminPath("/calendar/settings/periods")} underline="none">Chỉnh giờ tiết →</Link>
            </Typography>
          ) : null}
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
        </Stack>
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography aria-live="polite" sx={{ color: status === "error" ? "error.main" : color.textMuted, mr: 0.75, ...type.note }}>{saveText(status, savedAt, onRetry, batchStatus === "DRAFT")}</Typography>
        {onReusePrevious ? <ErgButton onClick={onReusePrevious} sx={buttonSx(radius.control)} variant="outlined">Dùng lại tuần trước</ErgButton> : null}
        {onExport ? <ErgButton onClick={onExport} sx={{ ...buttonSx(radius.control), px: 1.25 }} variant="text">Xuất Excel theo mẫu</ErgButton> : null}
        <Tooltip title={blocked ? `Còn ${errorCount} xung đột cần xử lý` : ""}>
          <span>
            <ErgButton disabled={disabled} loading={publishing} onClick={onPublish} sx={{ ...buttonSx(radius.control), px: 2.25 }} variant="contained">Xuất bản cho giáo viên</ErgButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
