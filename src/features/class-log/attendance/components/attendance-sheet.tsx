import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import { loadClassWeek } from "../../api/class-log-api";
import { classLogQueryKeys } from "../../api/class-log-query-keys";
import { shortDateVi, weekdayVi } from "../../domain/class-log-week";
import type { AttendanceStudent } from "../attendance-model";
import { buildAttendanceSheet, monthRange, weekStartsBetween, type SheetMark } from "../attendance-sheet-model";

type Props = {
  classId: string;
  date: string;
  onOpenDate: (date: string) => void;
  students: AttendanceStudent[];
  subjectId?: string | null;
  subjectName: string;
};

const { classLog, color } = ergEnterpriseTokens;
const MARK_COLOR: Record<SheetMark, string> = { "": color.textMuted, K: classLog.absentK.color, P: classLog.absentP.color, x: color.textMuted };
const STT_W = 44;
const NAME_W = 200;
const HEAD_H = 30;

const cell = { borderBottom: `1px solid ${color.divider}`, borderRight: `1px solid ${color.divider}`, px: 1, py: 0.75, textAlign: "center", whiteSpace: "nowrap" } as const;
const head = { ...cell, bgcolor: color.surfaceMuted, color: color.textMuted, position: "sticky", zIndex: 2 } as const;
const stickyLeft = (left: number, bg: string) => ({ bgcolor: bg, left, position: "sticky", zIndex: 1 }) as const;

/** Month sheet like the school's paper/Google Sheet: rows = students, columns = this subject's periods grouped by week. */
export function AttendanceSheet({ classId, date, onOpenDate, students, subjectId, subjectName }: Props) {
  const range = monthRange(date);
  const weekQueries = useQueries({
    queries: weekStartsBetween(range.from, range.to).map((weekStart) => ({
      queryFn: ({ signal }: { signal: AbortSignal }) => loadClassWeek({ classId, weekStart }, signal),
      queryKey: classLogQueryKeys.classWeek(classId, weekStart),
      staleTime: 15_000,
    })),
  });
  const pending = weekQueries.some((q) => q.isPending);
  const failed = weekQueries.find((q) => q.isError);
  const periods = useMemo(() => weekQueries.flatMap((q) => q.data?.days.flatMap((day) => day.periods) ?? []), [weekQueries]);
  const sheet = useMemo(
    () => buildAttendanceSheet(periods, students, { from: range.from, subjectId, subjectName, to: range.to }),
    [periods, range.from, range.to, students, subjectId, subjectName],
  );

  if (pending) return <Box aria-busy="true" sx={{ p: 2 }}><ErgLoadingSkeleton /></Box>;
  if (failed) {
    return <ErgErrorState action={<ErgButton onClick={() => void failed.refetch()} variant="outlined">Thử lại</ErgButton>} description="Không tải được dữ liệu." title="Lỗi tải" />;
  }
  if (!sheet.columns.length) return <ErgEmptyState description="Tháng này lớp chưa có tiết nào của môn trong thời khoá biểu." title="Chưa có buổi học" />;

  return (
    <Box sx={{ maxHeight: "calc(100vh - 260px)", overflow: "auto" }}>
      <Box component="table" sx={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "100%", typography: "body2" }}>
        <thead>
          <tr>
            <Box component="th" rowSpan={2} sx={{ ...head, ...stickyLeft(0, color.surfaceMuted), minWidth: STT_W, top: 0, zIndex: 3 }}>STT</Box>
            <Box component="th" rowSpan={2} sx={{ ...head, ...stickyLeft(STT_W, color.surfaceMuted), minWidth: NAME_W, textAlign: "left", top: 0, zIndex: 3 }}>Họ và tên</Box>
            {sheet.weeks.map((week) => (
              <Box component="th" colSpan={week.columns.length} key={week.weekStart} sx={{ ...head, height: HEAD_H, top: 0 }}>Tuần {shortDateVi(week.weekStart)}</Box>
            ))}
            <Box component="th" rowSpan={2} sx={{ ...head, color: classLog.absentK.color, top: 0 }}>Vắng K</Box>
            <Box component="th" rowSpan={2} sx={{ ...head, color: classLog.absentP.color, top: 0 }}>Vắng P</Box>
          </tr>
          <tr>
            {sheet.columns.map((column) => (
              <Box component="th" key={column.key} sx={{ ...head, p: 0, top: HEAD_H }}>
                <ButtonBase
                  aria-label={`Điểm danh ${weekdayVi(column.date)} ${shortDateVi(column.date)} tiết ${column.periodNo}`}
                  onClick={() => onOpenDate(column.date)}
                  sx={{ display: "flex", flexDirection: "column", px: 1, py: 0.5, width: "100%" }}
                >
                  <Typography component="span" variant="caption">{shortDateVi(column.date)}</Typography>
                  <Typography color="text.secondary" component="span" variant="caption">T{column.periodNo}</Typography>
                </ButtonBase>
              </Box>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((row, index) => (
            <tr key={row.student.id}>
              <Box component="td" sx={{ ...cell, ...stickyLeft(0, color.surface), color: color.textMuted }}>{index + 1}</Box>
              <Box component="td" sx={{ ...cell, ...stickyLeft(STT_W, color.surface), textAlign: "left" }}>{row.student.name}</Box>
              {row.marks.map((mark, i) => (
                <Box component="td" key={sheet.columns[i].key} sx={{ ...cell, bgcolor: mark === "K" ? classLog.absentK.bg : mark === "P" ? classLog.absentP.bg : undefined, color: MARK_COLOR[mark], fontWeight: mark === "x" ? undefined : "fontWeightMedium" }}>
                  {mark}
                </Box>
              ))}
              <Box component="td" sx={{ ...cell, color: row.absentUnexcused ? classLog.absentK.color : color.textMuted }}>{row.absentUnexcused}</Box>
              <Box component="td" sx={{ ...cell, color: row.absentExcused ? classLog.absentP.color : color.textMuted }}>{row.absentExcused}</Box>
            </tr>
          ))}
        </tbody>
      </Box>
      <Typography color="text.secondary" component="p" sx={{ px: 2, py: 1 }} variant="caption">
        x có mặt · K vắng không phép · P vắng có phép · ô trống: tiết chưa diễn ra. Bấm ngày để điểm danh tiết đó.
      </Typography>
    </Box>
  );
}
