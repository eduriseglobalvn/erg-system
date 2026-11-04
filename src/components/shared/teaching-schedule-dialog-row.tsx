import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import type { ErgScheduleClass, ErgScheduleOption, ErgScheduleTeacher } from "./erg-calendar-types";
import {
  type ScheduleDraftRow,
  buildPeriodRangeOptions,
  getOptionId,
  optionLabel,
  periodCountOptions,
  sessionOptions,
  weekdayOptions,
} from "./teaching-schedule-dialog-model";
import {
  deleteRowButtonSx,
  excelActionCellSx,
  excelGridRowSx,
  noteFieldSx,
  scheduleSelectSlotProps,
  timeRangeCellSx,
} from "./teaching-schedule-dialog-styles";
import { TeacherColorChip, teacherSelectSlotProps } from "./teaching-schedule-dialog-teacher-chip";

type ScheduleOptions = Array<string | ErgScheduleOption>;

export type TeachingScheduleRowProps = {
  assistantOptions: ErgScheduleTeacher[];
  canRemove: boolean;
  expanded: boolean;
  levels: ScheduleOptions;
  onExpandNote: (rowId: string | null) => void;
  onRemove: (rowId: string) => void;
  onUpdate: (rowId: string, patch: Partial<ScheduleDraftRow>) => void;
  onUpdatePeriodCount: (rowId: string, periodCount: string) => void;
  onUpdateStartTime: (rowId: string, start: string) => void;
  rooms: ScheduleOptions;
  row: ScheduleDraftRow;
  schoolClasses: ErgScheduleClass[];
  subjects: ScheduleOptions;
  teachers: ErgScheduleTeacher[];
};

export function TeachingScheduleRow({
  assistantOptions,
  canRemove,
  expanded,
  levels,
  onExpandNote,
  onRemove,
  onUpdate: updateRow,
  onUpdatePeriodCount: updatePeriodCount,
  onUpdateStartTime: updateStartTime,
  rooms,
  row,
  schoolClasses,
  subjects,
  teachers,
}: TeachingScheduleRowProps) {
  const getTeacherName = (teacherId: string) => teachers.find((teacher) => teacher.id === teacherId)?.name ?? "Chưa chọn";
  const getAssistantName = (teacherId: string) => assistantOptions.find((teacher) => teacher.id === teacherId)?.name ?? "Không có";

  return (
    <Box sx={excelGridRowSx(expanded, row.mainTeacherId)}>
                <TextField onChange={(event) => updateRow(row.id, { weekday: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.weekday}>
                  {weekdayOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                </TextField>
                <TextField onChange={(event) => updateRow(row.id, { session: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.session}>
                  {sessionOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                </TextField>
                <TextField onChange={(event) => updatePeriodCount(row.id, event.target.value)} select size="small" slotProps={scheduleSelectSlotProps} value={row.periodCount}>
                  {periodCountOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                </TextField>
                <TextField onChange={(event) => updateRow(row.id, { period: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.period}>
                  {buildPeriodRangeOptions(row.periodCount).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <Box sx={timeRangeCellSx}>
                  <TextField onChange={(event) => updateStartTime(row.id, event.target.value)} placeholder="13:00" size="small" value={row.start} />
                  <Typography aria-hidden sx={{ color: "#98A2B3", fontSize: 12, fontWeight: 900 }}>-</Typography>
                  <TextField onChange={(event) => updateRow(row.id, { end: event.target.value })} placeholder="13:45" size="small" value={row.end} />
                </Box>
                <TextField onChange={(event) => updateRow(row.id, { subject: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.subject}>
                  {subjects.map((option) => <MenuItem key={getOptionId(option)} value={getOptionId(option)}>{optionLabel(option)}</MenuItem>)}
                </TextField>
                <TextField onChange={(event) => updateRow(row.id, { level: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.level}>
                  {levels.map((option) => <MenuItem key={getOptionId(option)} value={getOptionId(option)}>{optionLabel(option)}</MenuItem>)}
                </TextField>
                <TextField onChange={(event) => updateRow(row.id, { classId: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.classId}>
                  {schoolClasses.map((classroom) => <MenuItem key={classroom.id} value={classroom.id}>{classroom.name}</MenuItem>)}
                </TextField>
                <TextField onChange={(event) => updateRow(row.id, { room: event.target.value })} select size="small" slotProps={scheduleSelectSlotProps} value={row.room}>
                  {rooms.map((option) => <MenuItem key={getOptionId(option)} value={getOptionId(option)}>{optionLabel(option)}</MenuItem>)}
                </TextField>
                <TextField
                  onChange={(event) => updateRow(row.id, { mainTeacherId: event.target.value })}
                  select
                  size="small"
                  slotProps={teacherSelectSlotProps(row.mainTeacherId, getTeacherName(row.mainTeacherId))}
                  value={row.mainTeacherId}
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      <TeacherColorChip label={teacher.name} teacherId={teacher.id} />
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  onChange={(event) => updateRow(row.id, { assistantTeacherId: event.target.value })}
                  select
                  size="small"
                  slotProps={teacherSelectSlotProps(row.assistantTeacherId, getAssistantName(row.assistantTeacherId), !row.assistantTeacherId)}
                  value={row.assistantTeacherId}
                >
                  <MenuItem value=""><TeacherColorChip label="Không có" muted teacherId="none" /></MenuItem>
                  {assistantOptions.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      <TeacherColorChip label={teacher.name} teacherId={teacher.id} />
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  multiline
                  maxRows={expanded ? 6 : 1}
                  minRows={expanded ? 3 : 1}
                  onBlur={() => onExpandNote(null)}
                  onChange={(event) => updateRow(row.id, { note: event.target.value })}
                  onFocus={() => onExpandNote(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      onExpandNote(null);
                      event.currentTarget.blur();
                    }
                  }}
                  placeholder="Ghi chú"
                  size="small"
                  sx={noteFieldSx(expanded)}
                  value={row.note}
                />
                <Box sx={excelActionCellSx}>
                  <IconButton aria-label="Xóa dòng lịch" disabled={!canRemove} onClick={() => onRemove(row.id)} sx={deleteRowButtonSx}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
    </Box>
  );
}
