import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import type { TeachingPeriodTemplate } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { formatDateVi } from "@/domain/formatters/format-date";
import type { DraftMeta } from "./use-schedule-draft";

type Option = { id: string; label: string };

type Props = {
  meta: DraftMeta;
  onChange: (patch: Partial<DraftMeta>) => void;
  onSchoolChange: (schoolId: string) => void;
  programs: ReadonlyArray<{ label: string; levelId: string; subjectId: string }>;
  schools: readonly Option[];
  templates: readonly TeachingPeriodTemplate[];
};

export function weeksBetween(from: string, until: string) {
  if (!from || !until) return 0;
  return Math.max(0, Math.ceil(((Date.parse(until) - Date.parse(from)) / 86_400_000 + 1) / 7));
}

const field = { flex: 1, minWidth: 160 } as const;

/** Thanh thong tin 1 hang (6.2): Truong | Mon · Chuong trinh | Ap dung tu | Lap den | Khung gio tiet. */
export function ScheduleInfoBar({ meta, onChange, onSchoolChange, programs, schools, templates }: Props) {
  const weeks = weeksBetween(meta.applyFrom, meta.repeatUntil);
  const program = meta.levelId ? `${meta.subjectId ?? ""}|${meta.levelId}` : "";
  return (
    <Stack aria-label="Thông tin thời khóa biểu" direction="row" divider={<Divider flexItem orientation="vertical" />} spacing={1.5} sx={{ alignItems: "flex-start", bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: "14px", flexWrap: "wrap", p: 1.5, rowGap: 1.5 }}>
      <ErgSelect
        label="Trường"
        onChange={(event) => onSchoolChange(event.target.value)}
        options={schools.map((school) => ({ label: school.label, value: school.id }))}
        size="small"
        sx={field}
        value={meta.schoolId}
      />
      <ErgSelect
        disabled={!programs.length}
        label="Môn · Chương trình"
        onChange={(event) => {
          const [subjectId, levelId] = event.target.value.split("|");
          onChange({ levelId, subjectId });
        }}
        options={programs.map((item) => ({ label: item.label, value: `${item.subjectId}|${item.levelId}` }))}
        size="small"
        sx={field}
        value={program}
      />
      <ErgTextField label="Áp dụng từ" onChange={(event) => onChange({ applyFrom: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={field} type="date" value={meta.applyFrom} />
      <Stack sx={field}>
        <ErgTextField label="Lặp đến" onChange={(event) => onChange({ repeatUntil: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} type="date" value={meta.repeatUntil} />
        <Typography sx={{ color: "text.secondary", typography: "caption" }}>{formatDateVi(meta.repeatUntil)} · {weeks} tuần</Typography>
      </Stack>
      <ErgSelect
        label="Khung giờ tiết"
        onChange={(event) => onChange({ periodTemplateId: event.target.value })}
        options={templates.map((template) => ({ label: template.name, value: template.id }))}
        size="small"
        sx={field}
        value={meta.periodTemplateId}
      />
    </Stack>
  );
}
