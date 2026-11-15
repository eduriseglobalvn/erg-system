import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { errorConflicts, type ScheduleConflict } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { ConflictArticle } from "./conflict-article";

type Props = {
  conflicts: readonly ScheduleConflict[];
  onFix: (conflict: ScheduleConflict) => void;
  onGoTo: (conflict: ScheduleConflict) => void;
  onRemove: (conflict: ScheduleConflict) => void;
  /** O dan tu Excel khong khop ten: «Không tìm thấy “<tên>”». */
  unknownNames: readonly string[];
};

/** Panel phai «Xung đột cần xử lý»: loi truoc, canh bao nghi sau (khong dem vao badge). */
export function ConflictPanel({ conflicts, onFix, onGoTo, onRemove, unknownNames }: Props) {
  const errors = errorConflicts(conflicts);
  const warnings = conflicts.filter((conflict) => conflict.severity !== "ERROR");
  const count = errors.length + unknownNames.length;
  return (
    <Stack aria-label="Xung đột" component="section" spacing={1} sx={{ maxHeight: 520, overflowY: "auto" }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
        <Box sx={{ bgcolor: count ? scheduleTokens.clash.bg : scheduleTokens.published.bg, borderRadius: "999px", color: count ? scheduleTokens.clash.text : scheduleTokens.published.text, minWidth: 28, px: 1, py: 0.25, textAlign: "center", typography: "subtitle2" }}>{count}</Box>
        <Box>
          <Typography sx={{ typography: "subtitle2" }}>{count ? "Xung đột cần xử lý" : "Không có xung đột"}</Typography>
          <Typography sx={{ color: "text.secondary", typography: "caption" }}>{count ? "Chưa xuất bản được cho đến khi hết xung đột" : "Sẵn sàng xuất bản"}</Typography>
        </Box>
      </Stack>
      {unknownNames.map((name) => (
        <Box component="article" key={name} sx={{ bgcolor: scheduleTokens.clash.bg, borderRadius: "10px", color: scheduleTokens.clash.text, p: 1.5, typography: "body2" }}>
          Không tìm thấy “{name}”
        </Box>
      ))}
      {[...errors, ...warnings].map((conflict) => (
        <ConflictArticle conflict={conflict} key={conflict.id} onFix={onFix} onGoTo={onGoTo} onRemove={onRemove} />
      ))}
    </Stack>
  );
}
