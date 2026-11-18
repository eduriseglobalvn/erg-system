import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { formatTimeVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import type { CurriculumLessonRow } from "../attendance-api";
import { attendanceCopy } from "../attendance-copy";
import { shortDateLabel, type AttendanceMark, type AttendanceStudent, type LessonLogPeriod, type MarkMap } from "../attendance-model";

type Props = {
  actualPeriod: number;
  comment: string;
  compact?: boolean;
  curriculumRows: CurriculumLessonRow[];
  draftAt: number | null;
  lessonTitle: string | null;
  marks: MarkMap;
  onActualPeriod: (value: number) => void;
  onComment: (value: string) => void;
  onOpenLog: () => void;
  onSave: () => void;
  period: LessonLogPeriod;
  saving: boolean;
  students: AttendanceStudent[];
};

const Field = ({ children, label, source }: { children: React.ReactNode; label: string; source?: string }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
    <Typography color="text.secondary" component="span" variant="caption">
      {label}{source ? <Typography color={source.startsWith("GV") ? "primary.main" : "text.secondary"} component="span" variant="caption"> · {source}</Typography> : null}
    </Typography>
    {children}
  </Box>
);

const ReadOnly = ({ children, tone }: { children: React.ReactNode; tone?: "danger" }) => (
  <Typography
    sx={{
      bgcolor: ergEnterpriseTokens.color.surfaceMuted,
      border: `1px solid ${ergEnterpriseTokens.color.divider}`,
      borderRadius: `${ergEnterpriseTokens.radius.control}px`,
      color: tone === "danger" ? ergEnterpriseTokens.classLog.absentK.color : "text.primary",
      minHeight: 36,
      px: 1.25,
      py: 0.75,
    }}
    variant="body2"
  >
    {children}
  </Typography>
);

/** "Ghi vào sổ đầu bài": right column on desktop, bottom sheet on the phone (`compact`). */
export function LogSidePanel({
  actualPeriod, comment, compact = false, curriculumRows, draftAt, lessonTitle, marks, onActualPeriod, onComment, onOpenLog, onSave, period, saving, students,
}: Props) {
  const absentLabel = students
    .filter((student) => (marks[student.id] ?? "present") !== "present" && marks[student.id] !== "late")
    .map((student) => (marks[student.id] === "absentExcused" ? `${student.name} (P)` : `${student.name} (K)`));
  const late = students.filter((student) => (marks[student.id] as AttendanceMark | undefined) === "late").map((student) => student.name);
  const options = curriculumRows.length ? curriculumRows.map((row) => ({ label: `Tiết ${row.period}`, value: row.period })) : null;

  const actualField = options ? (
    <ErgSelect
      onChange={(event) => onActualPeriod(Number(event.target.value))}
      options={options}
      size="small"
      slotProps={{ htmlInput: { "aria-label": "Tiết thực tế" } }}
      value={actualPeriod}
    />
  ) : (
    <ErgTextField
      compact
      onChange={(event) => onActualPeriod(Math.max(1, Number(event.target.value) || 1))}
      slotProps={{ htmlInput: { "aria-label": "Tiết thực tế", inputMode: "numeric", min: 1 } }}
      type="number"
      value={actualPeriod}
    />
  );
  const commentField = (
    <ErgTextField
      compact={compact}
      minRows={compact ? 1 : 2}
      multiline={!compact}
      onChange={(event) => onComment(event.target.value)}
      placeholder={attendanceCopy.commentPlaceholder}
      slotProps={{ htmlInput: { "aria-label": "Nhận xét tiết học", maxLength: 500 } }}
      value={comment}
    />
  );
  const lesson = lessonTitle ?? attendanceCopy.noCurriculum;

  if (compact) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ alignItems: "center", display: "flex" }}>
          <Typography sx={{ flex: 1 }} variant="subtitle2">Ghi vào sổ đầu bài</Typography>
          <Typography color="text.secondary" variant="caption">PPCT {period.ppctPeriod}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ flex: "none", width: 120 }}><Field label="Tiết thực tế" source="GV sửa được">{actualField}</Field></Box>
          <Box sx={{ flex: 1, minWidth: 0 }}><Field label="Bài dạy"><ReadOnly>{lesson}</ReadOnly></Field></Box>
        </Box>
        {commentField}
        <ErgButton loading={saving} onClick={onSave} sx={{ minHeight: 46 }} variant="contained">{attendanceCopy.save}</ErgButton>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: ergEnterpriseTokens.color.surface, border: `1px solid ${ergEnterpriseTokens.color.border}`, borderRadius: `${ergEnterpriseTokens.radius.card}px`, display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}>
      <Box>
        <Typography variant="subtitle1">Ghi vào sổ đầu bài</Typography>
        <Typography color="text.secondary" variant="caption">{period.className} · {shortDateLabel(period.date)}</Typography>
      </Box>
      <Field label="Tiết theo PPCT" source="tự lấy từ khung chương trình"><ReadOnly>Tiết {period.ppctPeriod}</ReadOnly></Field>
      <Field label="Tiết thực tế" source="GV sửa được">{actualField}</Field>
      <Field label="Bài dạy" source="theo tiết thực tế"><ReadOnly>{lesson}</ReadOnly></Field>
      <Field label="Học sinh vắng" source="từ điểm danh bên trái">
        <ReadOnly tone={absentLabel.length ? "danger" : undefined}>
          {absentLabel.length || late.length ? [absentLabel.join(", "), late.length ? `${late.join(", ")} muộn` : ""].filter(Boolean).join(" · ") : "Không có"}
        </ReadOnly>
      </Field>
      <Field label="Nhận xét tiết học" source="GV nhập">{commentField}</Field>
      <Typography
        sx={{ bgcolor: ergEnterpriseTokens.classLog.late.bg, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: ergEnterpriseTokens.classLog.late.color, p: 1.25 }}
        variant="caption"
      >
        Bài dạy đổi theo Tiết thực tế. Nếu dạy chậm/nhanh hơn PPCT, sửa Tiết thực tế: hệ thống tra lại tên bài từ khung chương trình.
      </Typography>
      {draftAt ? (
        <Typography color="success.main" variant="caption">
          Đã lưu nháp {formatTimeVi(draftAt)} · mất mạng vẫn lưu, có mạng tự đồng bộ
        </Typography>
      ) : null}
      <ErgButton loading={saving} onClick={onSave} sx={{ minHeight: 44 }} variant="contained">{attendanceCopy.save}</ErgButton>
      <ErgButton onClick={onOpenLog} variant="text">Mở sổ đầu bài tuần này ›</ErgButton>
    </Box>
  );
}
