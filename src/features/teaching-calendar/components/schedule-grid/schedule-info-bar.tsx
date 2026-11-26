import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";

import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { addDaysToDate, dayLabel } from "@/features/teaching-calendar/domain/schedule-copy";
import type { TeachingPeriodTemplate } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
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

const { color, radius, type } = ergEnterpriseTokens;

/** «Lặp 3 tuần: Thứ 2, 30/11 → Chủ nhật, 20/12/2026 · 12 tiết/tuần → 36 buổi»; "" khi chưa đủ ngày. */
export function repeatSummary(applyFrom: string, repeatUntil: string, perWeek: number) {
  const weeks = weeksBetween(applyFrom, repeatUntil);
  if (!weeks) return "";
  const end = addDaysToDate(applyFrom, weeks * 7 - 1);
  return `Lặp ${weeks} tuần: ${dayLabel(applyFrom)} → ${dayLabel(end)}/${end.slice(0, 4)} · ${perWeek} tiết/tuần → ${perWeek * weeks} buổi`;
}

/** Dòng dưới thanh thông tin: nói rõ số tuần lặp; 1 tuần tô vàng vì hay là quên chỉnh «Lặp đến». */
export function RepeatSummaryLine({ applyFrom, perWeek, repeatUntil }: { applyFrom: string; perWeek: number; repeatUntil: string }) {
  const text = repeatSummary(applyFrom, repeatUntil, perWeek);
  if (!text) return null;
  const single = weeksBetween(applyFrom, repeatUntil) === 1;
  const tone = ergEnterpriseTokens.schedule.warn;
  return (
    <Box aria-live="polite" sx={{ bgcolor: single ? tone.bg : "transparent", borderRadius: `${radius.control}px`, color: single ? tone.text : color.textMuted, px: single ? 1.5 : 0, py: single ? 0.75 : 0, ...type.note }}>
      {text}{single ? " · Chỉ 1 tuần — kiểm tra lại «Lặp đến» nếu muốn lặp cả kỳ." : ""}
    </Box>
  );
}


/** O nhap cao 36px, bo 10, chu 14/400 (board AdminCreate); nhan nam tren o, 12px xam. */
const controlSx = {
  "& .MuiOutlinedInput-root": { borderRadius: `${radius.control}px`, height: 36, minHeight: 36, typography: "body2" },
  "& .MuiOutlinedInput-input": { py: 0, height: "100%", boxSizing: "border-box" },
  "& .MuiOutlinedInput-root fieldset": { borderColor: color.border },
  "& .MuiSelect-select": { py: 0 },
} as const;

function Labeled({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Box component="label" sx={{ color: color.textMuted, display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0, ...type.note }}>
      {label}
      {children}
    </Box>
  );
}

/** Thanh thong tin 1 hang (board AdminCreate): grid 1.4fr 1.4fr 1fr 1fr 1.2fr, gap 12, p 12/16, the vien 14. */
export function ScheduleInfoBar({ meta, onChange, onSchoolChange, programs, schools, templates }: Props) {
  const weeks = weeksBetween(meta.applyFrom, meta.repeatUntil);
  const program = meta.levelId ? `${meta.subjectId ?? ""}|${meta.levelId}` : "";
  return (
    <Box aria-label="Thông tin áp dụng" component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, display: "grid", gap: 1.5, gridTemplateColumns: { md: "1.4fr 1.4fr 1fr 1fr 1.2fr", xs: "1fr 1fr" }, px: 2, py: 1.5 }}>
      <Labeled label="Trường">
        <ErgSelect
          onChange={(event) => onSchoolChange(event.target.value)}
          options={schools.map((school) => ({ label: school.label, value: school.id }))}
          size="small"
          slotProps={{ select: { SelectDisplayProps: { "aria-label": "Trường" } as never } }}
          sx={controlSx}
          value={meta.schoolId}
        />
      </Labeled>
      <Labeled label="Môn · Chương trình">
        <ErgSelect
          disabled={!programs.length}
          onChange={(event) => {
            const [subjectId, levelId] = event.target.value.split("|");
            onChange({ levelId, subjectId });
          }}
          options={programs.map((item) => ({ label: item.label, value: `${item.subjectId}|${item.levelId}` }))}
          size="small"
          slotProps={{ select: { SelectDisplayProps: { "aria-label": "Môn · Chương trình" } as never } }}
          sx={controlSx}
          value={program}
        />
      </Labeled>
      <Labeled label="Áp dụng từ">
        <ErgTextField onChange={(event) => onChange({ applyFrom: event.target.value })} size="small" slotProps={{ htmlInput: { "aria-label": "Áp dụng từ" } }} sx={controlSx} type="date" value={meta.applyFrom} />
      </Labeled>
      <Labeled label="Lặp đến">
        <ErgTextField
          onChange={(event) => onChange({ repeatUntil: event.target.value })}
          size="small"
          slotProps={{ htmlInput: { "aria-label": "Lặp đến" }, input: { endAdornment: <InputAdornment position="end" sx={{ whiteSpace: "nowrap" }}>· {weeks} tuần</InputAdornment> } }}
          sx={controlSx}
          type="date"
          value={meta.repeatUntil}
        />
      </Labeled>
      <Labeled label="Khung giờ tiết">
        <ErgSelect
          onChange={(event) => onChange({ periodTemplateId: event.target.value })}
          options={templates.map((template) => ({ label: template.name, value: template.id }))}
          size="small"
          slotProps={{ select: { SelectDisplayProps: { "aria-label": "Khung giờ tiết" } as never } }}
          sx={controlSx}
          value={meta.periodTemplateId}
        />
      </Labeled>
    </Box>
  );
}
