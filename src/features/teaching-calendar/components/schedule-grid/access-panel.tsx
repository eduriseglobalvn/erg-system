import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { formatDateVi } from "@/domain/formatters/format-date";
import type { TeachingScheduleDraftResult } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { scheduleTokens } from "../shared/schedule-cell-sx";

type Change = TeachingScheduleDraftResult["accessChanges"][number];

const dd = (value: string) => formatDateVi(value).slice(0, 5);

function Chip({ children, tone, strike }: { children: string; strike?: boolean; tone: "soft" | "neutral" | "warn" }) {
  const palette = tone === "soft" ? scheduleTokens.published : tone === "warn" ? scheduleTokens.warn : scheduleTokens.neutral;
  return (
    <Box component="span" sx={{ bgcolor: palette.bg, borderRadius: "999px", color: palette.text, px: 1, py: 0.125, textDecoration: strike ? "line-through" : "none", typography: "caption" }}>
      {children}
    </Box>
  );
}

/** «Quyền thay đổi khi xuất bản»: moi giao vien mot khoi, truong + lop (dang co / moi / thu hoi). */
export function AccessPanel({ changes, schoolName }: { changes: readonly Change[]; schoolName: string }) {
  if (!changes.length) return null;
  return (
    <Stack aria-label="Quyền thay đổi khi xuất bản" component="section" spacing={1}>
      <Typography sx={{ typography: "subtitle2" }}>Quyền thay đổi khi xuất bản</Typography>
      {changes.map((change) => {
        const revokeOnly = change.weeklyPeriods === 0 && change.lastPeriodDate;
        return (
          <Box component="article" key={`${change.teacherId}-${change.schoolId}`} sx={{ border: 1, borderColor: "divider", borderRadius: "10px", p: 1.25 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography sx={{ typography: "body2" }}>{change.teacherName}</Typography>
              <Typography sx={{ color: "text.secondary", typography: "caption" }}>
                {revokeOnly ? `tiết cuối ${dd(change.lastPeriodDate as string)}` : `${change.weeklyPeriods} tiết/tuần`}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.5 }}>
              <Typography sx={{ typography: "caption" }}>{schoolName}</Typography>
              {change.schoolState === "NEW" ? <Chip tone="soft">mới</Chip> : change.schoolState === "REVOKE" ? <Chip tone="warn">{`thu hồi ${change.schoolRevokeOn ? dd(change.schoolRevokeOn) : ""}`.trim()}</Chip> : <Chip tone="neutral">đã có</Chip>}
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", mt: 0.5, rowGap: 0.5 }}>
              {change.classes.map((item) => (
                <Chip key={item.classId} strike={item.state === "REVOKE"} tone={item.state === "NEW" ? "soft" : "neutral"}>
                  {item.state === "NEW" ? `${item.className} · mới` : item.className}
                </Chip>
              ))}
            </Stack>
          </Box>
        );
      })}
      <Typography sx={{ color: "text.secondary", typography: "caption" }}>
        mới = sẽ cấp. gạch = đã hết tiết; chỉ thu hồi khi 2 tuần liên tiếp không có tiết nào ở đó (có tiết mới thì giữ quyền). Quyền chủ nhiệm giữ nguyên.
      </Typography>
    </Stack>
  );
}
