import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { assignmentKey, assignmentLabel, currentAssignment, rowsFromSlots } from "@/features/teaching-calendar/domain/period-times-model";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { SchoolPeriodsEditor } from "./school-periods-editor";
import { useSchoolPeriods } from "./use-school-periods";

const { color, radius, type } = ergEnterpriseTokens;

/** «Giờ tiết của trường» (board AdminSchoolPeriods): danh sach truong that + bang gio da nhap; sua va «Lưu giờ tiết» (saveSchoolPeriodTimes). */
export function SchoolPeriodsPage() {
  const data = useSchoolPeriods();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tableKey, setTableKey] = useState<string | null>(null);
  const school = data.entries.find((entry) => entry.schoolId === selectedId) ?? data.entries.find((entry) => entry.assignments.length) ?? data.entries[0];
  const assignment = school ? (school.assignments.find((item) => assignmentKey(item) === tableKey) ?? currentAssignment(school.assignments) ?? school.assignments[0] ?? null) : null;
  const sources = useMemo(() => data.entries
    .filter((entry) => entry.schoolId !== school?.schoolId)
    .flatMap((entry) => {
      const current = currentAssignment(entry.assignments);
      const template = data.templates.find((item) => item.id === current?.templateId);
      return template ? [{ rows: rowsFromSlots(template.slots), schoolName: entry.schoolName }] : [];
    }), [data.entries, data.templates, school?.schoolId]);

  if (data.isError) return <ErgErrorState action={<ErgButton onClick={data.refetch} variant="outlined">Thử lại</ErgButton>} description="Kiểm tra kết nối rồi thử lại." title="Không tải được giờ tiết." />;
  if (data.isPending) return <ContentPendingSkeleton />;

  return (
    <Stack spacing={2.5} sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <Box component="header">
        <Link href={adminPath("/calendar")} sx={{ fontSize: type.small.fontSize }} underline="none">← Lịch giảng dạy</Link>
        <Typography component="h1" sx={{ mt: 0.75 }} variant="h1">Giờ tiết của trường</Typography>
        <Typography sx={{ color: color.textMuted, mt: 0.5, ...type.small }}>Nhập một lần. Khi kéo tiết trên lịch tuần, khối tiết bám theo giờ ở đây.</Typography>
      </Box>
      {!school ? <ErgEmptyState title="Chưa có trường nào" /> : (
        <Stack direction={{ md: "row", xs: "column" }} spacing={2.5} sx={{ alignItems: "flex-start" }}>
          <Box aria-label="Trường" component="nav" sx={{ display: "flex", flex: "none", flexDirection: "column", gap: "2px", width: { md: 248, xs: "100%" } }}>
            {data.entries.map((entry) => {
              const on = entry.schoolId === school.schoolId;
              const current = currentAssignment(entry.assignments) ?? entry.assignments[0];
              return (
                <Box
                  aria-current={on ? "true" : undefined} component="button" key={entry.schoolId} onClick={() => { setSelectedId(entry.schoolId); setTableKey(null); }} type="button"
                  sx={{ alignItems: "center", bgcolor: on ? scheduleTokens.published.bg : "transparent", border: 0, borderRadius: `${radius.control}px`, color: on ? scheduleTokens.published.text : "inherit", cursor: "pointer", display: "flex", font: "inherit", gap: 1, px: 1.5, py: 1, textAlign: "left" }}
                >
                  <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
                    <Box component="span" sx={{ display: "block", fontWeight: type.noteMedium.fontWeight }}>{entry.schoolName}</Box>
                    <Box component="span" sx={{ color: current ? (on ? scheduleTokens.published.text : color.textMuted) : scheduleTokens.warn.text, display: "block", ...type.note }}>
                      {current ? assignmentLabel(current).replace("Áp dụng từ", "Từ") : "Chưa nhập giờ tiết"}
                    </Box>
                  </Box>
                  {current ? null : <Box aria-hidden component="span" sx={{ bgcolor: color.warning, borderRadius: "999px", height: 8, width: 8 }} />}
                </Box>
              );
            })}
          </Box>
          <SchoolPeriodsEditor
            assignment={assignment} key={`${school.schoolId}:${assignment ? assignmentKey(assignment) : "none"}:${assignment?.templateId ?? ""}`}
            onPickAssignment={setTableKey} school={school} sources={sources} templates={data.templates}
          />
        </Stack>
      )}
    </Stack>
  );
}
