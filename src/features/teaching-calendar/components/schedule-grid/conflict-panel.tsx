import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { errorConflicts, type ScheduleConflict } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
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

/** Panel phai «Xung đột cần xử lý» (board AdminCreate): the vien 14px, header do nhat, loi truoc, canh bao sau (khong dem vao badge). */
export function ConflictPanel({ conflicts, onFix, onGoTo, onRemove, unknownNames }: Props) {
  const errors = errorConflicts(conflicts);
  const warnings = conflicts.filter((conflict) => conflict.severity !== "ERROR");
  const count = errors.length + unknownNames.length;
  const tone = count ? scheduleTokens.clash : scheduleTokens.published;
  return (
    <Box aria-label="Xung đột" component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, maxHeight: 520, overflow: "hidden auto" }}>
      <Box component="header" sx={{ alignItems: "center", bgcolor: tone.bg, borderBottom: 1, borderColor: count ? scheduleTokens.clash.line : "divider", display: "flex", gap: 1.25, px: 1.75, py: 1.5 }}>
        <Box aria-hidden sx={{ alignItems: "center", bgcolor: count ? scheduleTokens.clash.edge : "primary.main", borderRadius: "999px", color: "common.white", display: "flex", flex: "0 0 28px", height: 28, justifyContent: "center", typography: "subtitle2", width: 28 }}>{count}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={{ color: tone.text, typography: "subtitle2" }}>{count ? "Xung đột cần xử lý" : "Không có xung đột"}</Typography>
          <Typography sx={[{ color: tone.text, opacity: 0.8, typography: "caption" }, { fontWeight: "fontWeightRegular" }]}>{count ? "Chưa áp dụng được cho đến khi hết xung đột" : "Sẵn sàng áp dụng"}</Typography>
        </Box>
      </Box>
      {unknownNames.map((name) => (
        <Box component="article" key={name} sx={{ borderTop: 1, borderColor: "divider", color: scheduleTokens.clash.text, px: 1.75, py: 1.5, typography: "body2" }}>
          Không tìm thấy “{name}”
        </Box>
      ))}
      {[...errors, ...warnings].map((conflict) => (
        <ConflictArticle conflict={conflict} key={conflict.id} onFix={onFix} onGoTo={onGoTo} onRemove={onRemove} />
      ))}
    </Box>
  );
}
