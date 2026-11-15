import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { useCurriculumRows } from "@/features/class-log/attendance/attendance-query";
import { MobileBottomSheet } from "@/features/lms/mobile/components/mobile-bottom-sheet";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { updateLessonLogEntry } from "../api/class-log-api";
import { classLogQueryKeys } from "../api/class-log-query-keys";
import { absenteesText, classLogText, lessonLogErrorText } from "../domain/class-log-copy";
import { actualSpan, clampStart, whenText, type PeriodGroup } from "./lesson-report-mobile-model";

const FALLBACK_EXTRA = 10;

type Props = { group: PeriodGroup | null; onClose: () => void };

/** «Đổi»: pick the lesson(s) really taught from the framework (2.8-4); the title follows from the framework after saving. */
export function LessonReportPeriodSheet({ group, onClose }: Props) {
  return (
    <MobileBottomSheet onOpenChange={(open) => { if (!open) onClose(); }} open={Boolean(group)} title={group ? `Báo giảng ${group.className}` : "Báo giảng"}>
      {group ? <SheetBody group={group} key={group.key} onClose={onClose} /> : null}
    </MobileBottomSheet>
  );
}

function SheetBody({ group, onClose }: { group: PeriodGroup; onClose: () => void }) {
  const queryClient = useQueryClient();
  const first = group.periods[0]!;
  const count = group.periods.length;
  const [start, setStart] = useState(first.actualPeriod);
  const [comment, setComment] = useState(first.comment ?? "");
  const curriculum = useCurriculumRows(first.classId, first.subjectName, first.subjectId);
  const rows = curriculum.data ?? [];
  const last = rows.length ? Math.max(...rows.map((r) => r.period)) : Math.max(first.ppctPeriod, first.actualPeriod) + FALLBACK_EXTRA;
  const options = rows.length ? rows.map((r) => ({ period: r.period, title: r.title })) : Array.from({ length: last }, (_, i) => ({ period: i + 1, title: "" }));
  const absent = group.periods.flatMap((p) => p.absentees);

  const save = useMutation({
    mutationFn: async () => {
      for (const [i, p] of group.periods.entries()) {
        await updateLessonLogEntry({ eventId: p.eventId, date: p.date, periodNo: p.periodNo, actualPeriod: start + i, comment, expectedVersion: p.version });
      }
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: classLogQueryKeys.all }); onClose(); },
    onError: (error) => { toast.error(lessonLogErrorText(error)); void queryClient.invalidateQueries({ queryKey: classLogQueryKeys.all }); },
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minHeight: 0 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.25 }}>
        <Box sx={{ alignItems: "center", bgcolor: t.color.primarySofter, borderRadius: `${t.radius.control}px`, color: t.statusTint.info.color, display: "flex", fontWeight: t.type.label.fontWeight, height: 40, justifyContent: "center", width: 52 }}>{group.className}</Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography sx={{ fontWeight: t.type.label.fontWeight }}>{whenText(group)}</Typography>
          <Typography sx={{ color: t.color.textMuted, fontSize: t.type.label.fontSize }}>{`PPCT tiết ${first.ppctPeriod}${count > 1 ? `–${first.ppctPeriod + count - 1}` : ""}`}</Typography>
        </Box>
      </Box>
      <Box role="listbox" aria-label="Khung chương trình" sx={{ border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, maxHeight: 280, overflowY: "auto" }}>
        {options.map((o, i) => {
          const selected = o.period >= start && o.period < start + count;
          return (
            <ButtonBase
              aria-selected={selected}
              key={o.period}
              onClick={() => setStart(clampStart(o.period, count, last))}
              role="option"
              sx={{ alignItems: "center", bgcolor: selected ? t.color.primarySofter : "transparent", borderTop: i ? `1px solid ${t.color.divider}` : 0, display: "flex", fontSize: t.type.small.fontSize, gap: 1.5, justifyContent: "flex-start", minHeight: 44, px: 1.75, textAlign: "left", width: "100%" }}
            >
              <Box component="span" sx={{ color: selected ? t.color.primary : t.color.textMuted, fontWeight: t.type.label.fontWeight, width: 28 }}>{o.period}</Box>
              <Box component="span" sx={{ color: selected ? t.statusTint.info.color : "text.primary", flex: 1 }}>{o.title || classLogText.noLesson}</Box>
              {selected ? <Box component="span" aria-hidden sx={{ color: t.color.primary }}>✓</Box> : null}
            </ButtonBase>
          );
        })}
      </Box>
      <Box sx={{ alignItems: "center", display: "flex", fontSize: t.type.small.fontSize, minHeight: 44 }}>
        <Box sx={{ flex: 1 }}>{`Vắng ${absent.length} · ${absenteesText(absent)}`}</Box>
        <Box component="a" href={teacherPath("/attendance")} sx={{ color: t.color.primary, fontWeight: t.type.label.fontWeight, py: 1.25, textDecoration: "none" }}>Điểm danh</Box>
      </Box>
      <ErgTextField aria-label="Ghi chú" onChange={(e) => setComment(e.target.value)} placeholder="Ghi chú (không bắt buộc)" value={comment} />
      <ErgButton loading={save.isPending} onClick={() => save.mutate()} sx={{ minHeight: 52 }} variant="contained">{`Lưu · ${actualSpan(start, count)}`}</ErgButton>
    </Box>
  );
}
