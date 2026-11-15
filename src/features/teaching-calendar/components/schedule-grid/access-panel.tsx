import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { formatDateVi } from "@/domain/formatters/format-date";
import type { TeachingScheduleDraftResult } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { teacherTone } from "../shared/teacher-tone";

type Change = TeachingScheduleDraftResult["accessChanges"][number];

const { color, type } = ergEnterpriseTokens;
const dd = (value: string) => formatDateVi(value).slice(0, 5);

function Chip({ children, tone, strike, strong }: { children: string; strike?: boolean; strong?: boolean; tone: "soft" | "neutral" | "warn" }) {
  const palette = tone === "soft" ? scheduleTokens.published : tone === "warn" ? scheduleTokens.clash : scheduleTokens.neutral;
  return (
    <Box component="span" sx={{ bgcolor: palette.bg, borderRadius: "999px", color: palette.text, px: strong ? 0.75 : 1, py: strong ? 0 : 0.125, textDecoration: strike ? "line-through" : "none", ...(strong || tone === "soft" ? type.microStrong : type.micro) }}>
      {children}
    </Box>
  );
}

/** «Quyền thay đổi khi áp dụng» (board AdminCreate): the vien 14px p14, moi giao vien mot khoi, truong + lop (dang co / moi / thu hoi). */
export function AccessPanel({ changes, schoolName }: { changes: readonly Change[]; schoolName: string }) {
  if (!changes.length) return null;
  return (
    <Stack aria-label="Quyền thay đổi khi áp dụng" component="section" spacing={1.25} sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, p: 1.75 }}>
      <Typography component="h2" sx={{ typography: "subtitle2" }}>Quyền thay đổi khi áp dụng</Typography>
      {changes.map((change) => {
        const revokeOnly = change.weeklyPeriods === 0 && change.lastPeriodDate;
        return (
          <Stack component="article" key={`${change.teacherId}-${change.schoolId}`} spacing={0.625} sx={type.note}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box aria-hidden sx={{ bgcolor: revokeOnly ? color.textSoft : teacherTone(change.teacherId).border, borderRadius: "999px", flex: "0 0 10px", height: 10, width: 10 }} />
              <Box component="strong" sx={{ ...type.smallStrong, flex: 1 }}>{change.teacherName}</Box>
              <Box component="span" sx={{ color: color.textMuted }}>
                {revokeOnly ? `tiết cuối ${dd(change.lastPeriodDate as string)}` : `${change.weeklyPeriods} tiết/tuần`}
              </Box>
            </Stack>
            <Box sx={{ color: color.textSecondary }}>
              Trường: {schoolName}{" "}
              {change.schoolState === "NEW" ? <Chip strong tone="soft">mới</Chip> : change.schoolState === "REVOKE" ? <Chip strong tone="warn">{`thu hồi ${change.schoolRevokeOn ? dd(change.schoolRevokeOn) : ""}`.trim()}</Chip> : <Box component="span" sx={{ color: color.textMuted, ...type.micro }}>đã có</Box>}
            </Box>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
              {change.classes.map((item) => (
                <Chip key={item.classId} strike={item.state === "REVOKE"} tone={item.state === "NEW" ? "soft" : item.state === "REVOKE" ? "warn" : "neutral"}>
                  {item.state === "NEW" ? `${item.className} · mới` : item.className}
                </Chip>
              ))}
            </Stack>
          </Stack>
        );
      })}
      <Box component="p" sx={{ borderTop: `1px solid ${color.divider}`, color: color.textMuted, m: 0, pt: 1, ...type.note }}>
        <Chip strong tone="soft">mới</Chip> = sẽ cấp. <Chip strike strong tone="warn">gạch</Chip> = đã hết tiết; chỉ thu hồi khi 2 tuần liên tiếp không có tiết nào ở đó (có tiết mới thì giữ quyền). Quyền chủ nhiệm giữ nguyên.
      </Box>
    </Stack>
  );
}
