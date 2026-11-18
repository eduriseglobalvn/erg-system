import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import { markLabels } from "../attendance-copy";
import { ATTENDANCE_MARKS, type AttendanceMark, type AttendanceStudent, type MarkMap } from "../attendance-model";

type Props = {
  activeStudentId: string | null;
  marks: MarkMap;
  onActive: (studentId: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onMark: (studentId: string, mark: AttendanceMark) => void;
  students: AttendanceStudent[];
};

const { classLog } = ergEnterpriseTokens;
/** Same four tones as the board: Có mặt xanh lá, Muộn cam, Vắng K đỏ, Vắng P xanh dương (edge = selected border). */
export const MARK_TINT: Record<AttendanceMark, { bg: string; color: string; edge: string }> = {
  absentExcused: classLog.absentP,
  absentUnexcused: classLog.absentK,
  late: classLog.late,
  present: classLog.present,
};

export function StudentAttendanceList({ activeStudentId, marks, onActive, onKeyDown, onMark, students }: Props) {
  const { color, radius } = ergEnterpriseTokens;
  return (
    // tabIndex makes the list focusable so keys 1-4 work without a mouse.
    <Box
      aria-label="Danh sách học sinh"
      onKeyDown={onKeyDown}
      role="group"
      sx={{ outline: "none" }}
      tabIndex={0}
    >
      <Box sx={{ bgcolor: color.surfaceMuted, borderBottom: `1px solid ${color.divider}`, color: color.textMuted, display: { md: "flex", xs: "none" }, px: 2, py: 1 }}>
        <Typography sx={{ width: 36 }} variant="caption">STT</Typography>
        <Typography sx={{ flex: 1 }} variant="caption">Học sinh</Typography>
        <Typography sx={{ width: 344 }} variant="caption">Trạng thái (mặc định Có mặt)</Typography>
      </Box>
      {students.map((student, index) => {
        const current = marks[student.id] ?? "present";
        return (
          <Box
            key={student.id}
            onClick={() => onActive(student.id)}
            sx={{
              alignItems: { md: "center", xs: "stretch" },
              bgcolor: student.id === activeStudentId ? color.primarySofter : current === "absentUnexcused" ? classLog.rowAbsent : color.surface,
              borderBottom: `1px solid ${color.divider}`,
              display: "flex",
              flexDirection: { md: "row", xs: "column" },
              gap: { md: 0, xs: 0.75 },
              minHeight: 44,
              px: { md: 2, xs: 1.25 },
              py: { md: "3px", xs: 1 },
            }}
          >
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, minWidth: 0 }}>
              <Typography color="text.secondary" sx={{ width: { md: 36, xs: 26 } }} variant="caption">{index + 1}</Typography>
              <Typography noWrap variant="body2">{student.name}</Typography>
            </Box>
            <Box role="radiogroup" sx={{ display: "flex", gap: 0.5, pl: { md: 0, xs: "26px" }, width: { md: 344, xs: "auto" } }}>
              {ATTENDANCE_MARKS.map((mark) => {
                const on = current === mark;
                const tint = MARK_TINT[mark];
                return (
                  <ButtonBase
                    aria-checked={on}
                    aria-label={`${student.name}: ${markLabels[mark]}`}
                    key={mark}
                    onClick={() => onMark(student.id, mark)}
                    role="radio"
                    sx={{
                      bgcolor: on ? tint.bg : color.surface,
                      border: `1px solid ${on ? tint.edge : color.divider}`,
                      borderRadius: `${radius.sm}px`,
                      color: on ? tint.color : color.textMuted,
                      flex: 1,
                      height: { md: 32, xs: 44 },
                    }}
                  >
                    <Typography variant={on ? "subtitle2" : "caption"}>{markLabels[mark]}</Typography>
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
