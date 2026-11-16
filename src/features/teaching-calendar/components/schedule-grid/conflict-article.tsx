import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";

import { conflictLines } from "@/features/teaching-calendar/domain/conflict-copy";
import { conflictKindName } from "@/features/teaching-calendar/domain/schedule-copy";
import type { ScheduleConflict } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";

type Props = {
  conflict: ScheduleConflict;
  onFix: (conflict: ScheduleConflict) => void;
  onGoTo: (conflict: ScheduleConflict) => void;
  onRemove: (conflict: ScheduleConflict) => void;
};

const { color, type } = ergEnterpriseTokens;
const linkSx = { alignItems: "center", display: "inline-flex", height: 30, px: 1, ...type.label } as const;

/** Mot xung dot (board AdminCreate): chip loai + so tuan, thoi diem, thanh «Ô đang xếp» / «Trùng với», nguon, goi y sua, di toi o / bo tiet. */
export function ConflictArticle({ conflict, onFix, onGoTo, onRemove }: Props) {
  const lines = conflictLines(conflict);
  const warning = conflict.severity !== "ERROR";
  const chip = warning ? scheduleTokens.warn : scheduleTokens.clash;
  return (
    <Stack component="article" spacing={1} sx={{ bgcolor: warning ? scheduleTokens.warn.bg : undefined, borderTop: `1px solid ${color.divider}`, color: color.textSecondary, px: 1.75, py: 1.5, ...type.note }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Box component="span" sx={{ bgcolor: chip.bg, borderRadius: "999px", color: chip.text, px: 1, py: 0.25, ...type.microStrong }}>{conflictKindName(conflict.kind)}</Box>
        <Box component="span" sx={{ color: color.textMuted, ml: "auto", ...type.micro }}>{lines.weeks}</Box>
      </Stack>
      <Box sx={{ color: color.text, ...type.smallStrong }}>{lines.when}</Box>
      <Box sx={{ columnGap: 1.25, display: "grid", gridTemplateColumns: "4px 1fr", rowGap: 0.75 }}>
        <Box sx={{ bgcolor: color.primary, borderRadius: "999px" }} />
        <Box>
          <Box sx={{ color: color.textMuted, ...type.micro }}>Ô đang xếp</Box>
          <Box sx={{ color: color.text }}>{lines.mineLine}</Box>
        </Box>
        {lines.otherLine ? (
          <>
            <Box sx={{ bgcolor: scheduleTokens.clash.edge, borderRadius: "999px" }} />
            <Box>
              <Box sx={{ color: color.textMuted, ...type.micro }}>{warning ? "Lý do" : "Trùng với"}</Box>
              <Box sx={{ color: scheduleTokens.clash.text, fontWeight: type.label.fontWeight }}>{lines.otherLine}</Box>
              {lines.source ? (
                <Box sx={{ color: color.textMuted, mt: 0.25, ...type.micro }}>
                  {lines.source}
                  {conflict.kind === "TRAVEL_TIME" ? <> · <Link href={adminPath("/calendar/settings/travel")} underline="hover">Cài đặt › Di chuyển giữa trường</Link></> : null}
                </Box>
              ) : null}
            </Box>
          </>
        ) : null}
      </Box>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}>
        {lines.fixLine ? <Link component="button" onClick={() => onFix(conflict)} sx={{ ...linkSx, border: `1px solid ${color.primary}`, borderRadius: `${ergEnterpriseTokens.radius.control}px`, px: 1.25 }} type="button" underline="none">{lines.fixLine}</Link> : null}
        <Link component="button" onClick={() => onGoTo(conflict)} sx={linkSx} type="button" underline="none">Đi tới ô</Link>
        <Link component="button" onClick={() => onRemove(conflict)} sx={{ ...linkSx, color: color.textMuted, fontWeight: type.note.fontWeight, ml: "auto" }} type="button" underline="none">Bỏ tiết</Link>
      </Stack>
    </Stack>
  );
}
