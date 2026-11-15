import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { conflictLines } from "@/features/teaching-calendar/domain/conflict-copy";
import { conflictKindName } from "@/features/teaching-calendar/domain/schedule-copy";
import type { ScheduleConflict } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { scheduleTokens } from "../shared/schedule-cell-sx";

type Props = {
  conflict: ScheduleConflict;
  onFix: (conflict: ScheduleConflict) => void;
  onGoTo: (conflict: ScheduleConflict) => void;
  onRemove: (conflict: ScheduleConflict) => void;
};

const linkSx = { cursor: "pointer", typography: "caption" } as const;

/** Mot xung dot (6.2): ten loai + so tuan, thoi diem, o dang xep, trung voi, nguon, goi y sua, di toi o / bo tiet. */
export function ConflictArticle({ conflict, onFix, onGoTo, onRemove }: Props) {
  const lines = conflictLines(conflict);
  const warning = conflict.severity !== "ERROR";
  return (
    <Box component="article" sx={{ bgcolor: warning ? scheduleTokens.warn.bg : "background.paper", border: 1, borderColor: "divider", borderRadius: "10px", p: 1.5 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography sx={{ typography: "subtitle2" }}>{conflictKindName(conflict.kind)}</Typography>
        <Typography sx={{ color: "text.secondary", typography: "caption" }}>{lines.weeks}</Typography>
      </Stack>
      <Typography sx={{ color: "text.secondary", typography: "caption" }}>{lines.when}</Typography>
      <Typography sx={{ mt: 0.75, typography: "body2" }}><strong>Ô đang xếp</strong> {lines.mineLine}</Typography>
      {lines.otherLine ? <Typography sx={{ typography: "body2" }}><strong>{warning ? "Lý do" : "Trùng với"}</strong> {lines.otherLine}</Typography> : null}
      {lines.source ? (
        <Typography sx={{ color: "text.secondary", typography: "caption" }}>
          {lines.source}
          {conflict.kind === "TRAVEL_TIME" ? <> · <Link href={adminPath("/calendar/settings/travel")} underline="hover">Cài đặt › Di chuyển giữa trường</Link></> : null}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", mt: 0.75 }}>
        {lines.fixLine ? <Link component="button" onClick={() => onFix(conflict)} sx={linkSx} type="button" underline="hover">{lines.fixLine}</Link> : null}
        <Link color="text.secondary" component="button" onClick={() => onGoTo(conflict)} sx={linkSx} type="button" underline="hover">Đi tới ô</Link>
        <Link color="text.secondary" component="button" onClick={() => onRemove(conflict)} sx={linkSx} type="button" underline="hover">Bỏ tiết</Link>
      </Stack>
    </Box>
  );
}
