import { useState } from "react";
import Box from "@mui/material/Box";
import EventNoteIcon from "@mui/icons-material/EventNote";

import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import type { ClassLogPeriod } from "../api/class-log-api";
import { classLogQueryKeys } from "../api/class-log-query-keys";
import { classLogText } from "../domain/class-log-copy";
import { addDays, weekRangeLabel } from "../domain/class-log-week";
import { useConfirmWeek, useTeacherWeek } from "../hooks/use-class-log-queries";
import { useLessonLogEditor } from "../hooks/use-lesson-log-editor";
import { ClassLogToolbar } from "./class-log-toolbar";
import { PanelState } from "./class-log-ui";
import type { CurriculumTarget } from "./curriculum-drawer";
import { LagChip } from "./lag-chip";
import { TeacherWeekTable } from "./teacher-week-table";

const SATURDAY_OFFSET = 5;

export function curriculumTargetOf(period: ClassLogPeriod | undefined): CurriculumTarget | null {
  if (!period) return null;
  return {
    classId: period.classId, className: period.className, subjectId: period.subjectId ?? null, subjectName: period.subjectName,
    focus: { date: period.date, periodNo: period.periodNo, ppct: period.ppctPeriod, actual: period.actualPeriod },
  };
}

type Props = { weekStart: string; onWeek: (weekStart: string) => void; onCurriculum: (target: CurriculumTarget | null) => void };

/** «Sổ theo GV bộ môn»: the caller's own periods of one week, editable. */
export function TeacherWeekPanel({ weekStart, onWeek, onCurriculum }: Props) {
  const [session, setSession] = useState("");
  const [status, setStatus] = useState("");
  const query = useTeacherWeek(weekStart, session, status);
  const editor = useLessonLogEditor(classLogQueryKeys.teacherWeek(weekStart, session, status));
  const confirm = useConfirmWeek(weekStart);
  const week = query.data;
  const periods = week?.days.flatMap((d) => d.periods) ?? [];
  const lagging = week?.lagChip ? periods.find((p) => p.classId === week.lagChip?.classId) : undefined;
  const stats = week?.stats;

  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
      <ClassLogToolbar
        confirming={confirm.isPending}
        onConfirm={() => confirm.mutate()}
        onOpenCurriculum={() => onCurriculum(curriculumTargetOf(lagging ?? periods[0]))}
        onSession={setSession}
        onStatus={setStatus}
        onWeekStep={(direction) => onWeek(addDays(weekStart, direction * 7))}
        pending={stats?.pending ?? 0}
        rangeLabel={weekRangeLabel(weekStart, SATURDAY_OFFSET)}
        session={session}
        status={status}
        weekNo={week?.weekNo}
      />
      <PanelState isError={query.isError} isPending={query.isPending} onRetry={() => void query.refetch()}>
        {week && stats ? (
          <>
            <Box sx={{ alignItems: "center", borderBottom: `1px solid ${t.color.divider}`, color: t.color.textSecondary, display: "flex", flexWrap: "wrap", fontSize: t.type.small.fontSize, gap: 2.5, px: 2, py: 1.25 }}>
              {[
                [stats.taught, "tiết đã dạy", t.color.textSoft], [stats.confirmed, "đã xác nhận", t.statusTint.success.dot], [stats.pending, "chờ xác nhận", t.statusTint.info.dot],
              ].map(([n, label, dot]) => (
                <Box key={String(label)} sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                  <Box sx={{ bgcolor: String(dot), borderRadius: "50%", height: 8, width: 8 }} />
                  <Box component="strong" sx={{ color: "text.primary", fontWeight: t.type.label.fontWeight }}>{n}</Box>
                  {label}
                </Box>
              ))}
              {week.lagChip ? <LagChip chip={week.lagChip} /> : null}
            </Box>
            {periods.length === 0 && !session && !status ? (
              <Box sx={{ p: 2 }}><ErgEmptyState icon={<EventNoteIcon />} title={classLogText.emptyWeek} /></Box>
            ) : (
              <TeacherWeekTable drafts={editor.drafts} onEdit={editor.edit} week={week} />
            )}
          </>
        ) : null}
      </PanelState>
    </Box>
  );
}
