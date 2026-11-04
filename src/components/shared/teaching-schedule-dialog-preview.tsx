import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import type { ErgSchedulePreviewResult } from "./erg-calendar-types";
import { previewToneMap } from "./teaching-schedule-dialog-model";
import {
  previewIssueRowSx,
  schedulePreviewIconSx,
  schedulePreviewListSx,
  schedulePreviewPanelSx,
} from "./teaching-schedule-dialog-styles";

export function SchedulePreviewPanel({
  result,
  rowLabels,
}: {
  result: ErgSchedulePreviewResult;
  rowLabels: Map<string, string>;
}) {
  const rowErrors = result.rowResults.flatMap((row) => row.errors.map((error) => ({ ...error, clientRowId: row.clientRowId })));
  const rowWarnings = result.rowResults.flatMap((row) => row.warnings.map((warning) => ({ ...warning, clientRowId: row.clientRowId })));
  const hasConflicts = result.conflicts.length > 0;
  const hasErrors = rowErrors.length > 0;
  const tone = hasErrors ? previewToneMap.error : hasConflicts ? previewToneMap.warning : previewToneMap.success;
  const title = hasErrors
    ? "Cần sửa dữ liệu trước khi tạo lịch"
    : hasConflicts
      ? "Phát hiện lịch trùng"
      : "Preview hợp lệ, có thể tạo lịch";
  const Icon = hasErrors ? ErrorOutlineRoundedIcon : hasConflicts ? WarningAmberRoundedIcon : CheckCircleOutlineRoundedIcon;

  return (
    <Box sx={schedulePreviewPanelSx(tone)}>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, minWidth: 0 }}>
          <Box sx={schedulePreviewIconSx(tone)}>
            <Icon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: tone.text, fontSize: 14, fontWeight: 950 }}>{title}</Typography>
            <Typography sx={{ color: "#667085", fontSize: 12.5, fontWeight: 600, mt: 0.25 }}>
              {result.previewEventCount} lịch · {result.teacherScheduleCount} phân công giáo viên · {result.totalPeriodCount} tiết
            </Typography>
          </Box>
        </Box>
        {hasConflicts && !hasErrors ? (
          <Typography sx={{ color: "#8A4600", flexShrink: 0, fontSize: 12, fontWeight: 850 }}>
            Bấm tạo để thay thế lịch trùng
          </Typography>
        ) : null}
      </Box>

      {hasConflicts || hasErrors || rowWarnings.length ? (
        <Stack spacing={0.65} sx={schedulePreviewListSx}>
          {rowErrors.map((error) => (
            <PreviewIssueRow key={`error-${error.clientRowId}-${error.code}-${error.message}`} message={error.message} rowLabel={rowLabels.get(error.clientRowId) ?? error.clientRowId} tone="error" />
          ))}
          {result.conflicts.map((conflict) => (
            <PreviewIssueRow key={`conflict-${conflict.clientRowId ?? "batch"}-${conflict.code}-${conflict.existingEventId ?? ""}`} message={conflict.message} rowLabel={conflict.clientRowId ? rowLabels.get(conflict.clientRowId) ?? conflict.clientRowId : "Toàn bộ batch"} tone="warning" />
          ))}
          {rowWarnings.map((warning) => (
            <PreviewIssueRow key={`warning-${warning.clientRowId}-${warning.code}-${warning.message}`} message={warning.message} rowLabel={rowLabels.get(warning.clientRowId) ?? warning.clientRowId} tone="info" />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}

function PreviewIssueRow({
  message,
  rowLabel,
  tone,
}: {
  message: string;
  rowLabel: string;
  tone: "error" | "warning" | "info";
}) {
  const color = tone === "error" ? "#B42318" : tone === "warning" ? "#A35200" : "#0B5CAD";
  return (
    <Box sx={previewIssueRowSx}>
      <Typography noWrap sx={{ color: "#253041", fontSize: 12.5, fontWeight: 850, minWidth: 0 }}>
        {rowLabel}
      </Typography>
      <Typography sx={{ color, fontSize: 12.25, fontWeight: 600, lineHeight: 1.45 }}>
        {message}
      </Typography>
    </Box>
  );
}

export function countPreviewRowErrors(result: ErgSchedulePreviewResult) {
  return result.rowResults.reduce((total, row) => total + row.errors.length, 0);
}

export function getScheduleSubmitLabel({
  hasPreview,
  isPreviewing,
  isSubmitting,
  previewConflictCount,
  previewCount,
  previewReady,
}: {
  hasPreview: boolean;
  isPreviewing: boolean;
  isSubmitting: boolean;
  previewConflictCount: number;
  previewCount: number;
  previewReady: boolean;
}) {
  if (isPreviewing) return "Đang kiểm tra...";
  if (isSubmitting) return "Đang tạo...";
  if (hasPreview && !previewReady) return "Kiểm tra xung đột";
  if (previewConflictCount > 0) return `Tạo và xử lý ${previewConflictCount} lịch trùng`;
  return `Tạo ${previewCount} lịch dạy`;
}
