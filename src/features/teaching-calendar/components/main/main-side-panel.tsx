import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { addDaysToDate, weekStartOf } from "@/features/teaching-calendar/domain/schedule-copy";
import { ScheduleLegend } from "../shared/schedule-legend";

const HEAD = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

type Option = { color?: string; id: string; label: string; meta?: string };

type Props = {
  anchor: string;
  children?: ReactNode;
  onPickDay: (day: string) => void;
  onToggleSchool: (id: string) => void;
  onToggleTeacher: (id: string) => void;
  schoolIds: readonly string[];
  schools: readonly Option[];
  teacherIds: readonly string[];
  teachers: readonly Option[];
};

function MiniMonth({ anchor, onPickDay }: { anchor: string; onPickDay: (day: string) => void }) {
  const first = weekStartOf(`${anchor.slice(0, 7)}-01`);
  return (
    <Box aria-label={`Tháng ${Number(anchor.slice(5, 7))}, ${anchor.slice(0, 4)}`} sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center" }}>
      <Typography sx={{ gridColumn: "1 / -1", mb: 0.5, textAlign: "left", typography: "subtitle2" }}>Tháng {Number(anchor.slice(5, 7))}, {anchor.slice(0, 4)}</Typography>
      {HEAD.map((label) => <Typography key={label} sx={{ color: "text.secondary", typography: "caption" }}>{label}</Typography>)}
      {Array.from({ length: 42 }, (_, index) => addDaysToDate(first, index)).map((day) => (
        <ButtonBase key={day} onClick={() => onPickDay(day)} sx={{ bgcolor: day === anchor ? "primary.main" : "transparent", borderRadius: "50%", color: day === anchor ? "primary.contrastText" : day.startsWith(anchor.slice(0, 7)) ? "text.primary" : "text.disabled", height: 28, typography: "caption", width: 28, mx: "auto" }}>
          {Number(day.slice(8))}
        </ButtonBase>
      ))}
    </Box>
  );
}

function Checklist({ options, selected, title, onToggle, search }: { onToggle: (id: string) => void; options: readonly Option[]; search?: boolean; selected: readonly string[]; title: string }) {
  const [query, setQuery] = useState("");
  const visible = options.filter((option) => option.label.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  return (
    <Stack aria-label={title} component="section" spacing={0.25}>
      <Typography sx={{ typography: "subtitle2" }}>{title}</Typography>
      {search ? <ErgSearchField onChange={(event) => setQuery(event.target.value)} placeholder={`Tìm ${title.toLocaleLowerCase("vi")}…`} value={query} /> : null}
      <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
        {visible.map((option) => (
          <FormControlLabel
            control={<Checkbox checked={selected.includes(option.id)} onChange={() => onToggle(option.id)} size="small" />}
            key={option.id}
            label={<Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", typography: "body2", width: "100%" }}><Box component="span" sx={{ alignItems: "center", display: "inline-flex", gap: 0.75 }}>{option.color ? <Box aria-hidden component="span" sx={{ bgcolor: option.color, borderRadius: "50%", height: 8, width: 8 }} /> : null}{option.label}</Box>{option.meta ? <Typography sx={{ color: "text.secondary", typography: "caption" }}>{option.meta}</Typography> : null}</Box>}
            sx={{ display: "flex", mr: 0, width: "100%", "& .MuiFormControlLabel-label": { flex: 1 } }}
          />
        ))}
      </Box>
    </Stack>
  );
}

/** Panel trai 264px (6.1): mini month, Truong, Giao vien, the nhap (children), chu thich 3 muc. */
export function MainSidePanel({ anchor, children, onPickDay, onToggleSchool, onToggleTeacher, schoolIds, schools, teacherIds, teachers }: Props) {
  return (
    <Stack component="aside" spacing={2} sx={{ flexShrink: 0, width: 264 }}>
      <MiniMonth anchor={anchor} onPickDay={onPickDay} />
      <Checklist onToggle={onToggleSchool} options={schools} search={schools.length > 8} selected={schoolIds} title="Trường" />
      <Checklist onToggle={onToggleTeacher} options={teachers} selected={teacherIds} title="Giáo viên" />
      {children}
      <ScheduleLegend items={["published", "draft", "clash"]} labels={{ clash: "Trùng lịch", draft: "Nháp (giáo viên chưa thấy)" }} />
    </Stack>
  );
}
