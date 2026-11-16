import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import { ErgSearchField, ErgSelect } from "@/components/erg-mui/erg-form";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { TeachingRole } from "../../api/timekeeping-teaching-api";
import type { TeachingSearch } from "./use-teaching-search";

/** Board filter chip: «Năm <b>2026</b> ▾», the name written inside the field instead of a floating label. */
const chip = (label: string) => ({
  htmlInput: { "aria-label": label },
  input: { startAdornment: <InputAdornment position="start" sx={{ "& p": { ...t.type.small, color: t.color.textSecondary } }}>{label}</InputAdornment> },
  select: { displayEmpty: true },
}) as const;

type Option = { label: string; value: string | number };
type Props = {
  count: string;
  months: readonly string[];
  onChange: (patch: Partial<Record<keyof TeachingSearch, string | number | undefined>>) => void;
  onQuery: (q: string) => void;
  q: string;
  schools: readonly Option[];
  search: TeachingSearch;
  teachers: readonly Option[];
  years: readonly number[];
};

const field = { "& .MuiOutlinedInput-root": { fontSize: t.type.small.fontSize, minHeight: 36 }, "& .MuiSelect-select": { fontWeight: "fontWeightMedium" }, "& .MuiOutlinedInput-input, & .MuiSelect-select": { py: "7px" } } as const;

/** «Giáo viên chính | Trợ giảng» (plan 2.8-5): picks which of the two tables Total and the month sheets show. */
export function RoleSwitch({ onChange, value }: { onChange: (role: TeachingRole) => void; value: TeachingRole }) {
  return (
    <ToggleButtonGroup aria-label="Vai trò" exclusive onChange={(_, role: TeachingRole | null) => role && onChange(role)} size="small" sx={{ "& .MuiToggleButton-root": { ...t.type.small, height: 36, textTransform: "none" } }} value={value}>
      <ToggleButton value="MAIN">Giáo viên chính</ToggleButton>
      <ToggleButton value="ASSISTANT">Trợ giảng</ToggleButton>
    </ToggleButtonGroup>
  );
}

/** Filter row of the Total sheet (Main board): Năm · Tháng · Trường · Giáo viên, search 220 wide, the count on the right; plus the «Giáo viên chính | Trợ giảng» switch (plan 2.8-5). */
export function TeachingToolbar({ count, months, onChange, onQuery, q, schools, search, teachers, years }: Props) {
  const all: Option = { label: "Tất cả", value: "" };
  return (
    <Box sx={{ alignItems: "center", borderBottom: `1px solid ${t.color.divider}`, display: "flex", flexWrap: "wrap", gap: 1, px: 2, py: 1.5, "@media print": { display: "none" } }}>
      <RoleSwitch onChange={(role) => onChange({ role })} value={search.role} />
      <ErgSelect slotProps={chip("Năm")} onChange={(event) => onChange({ year: Number(event.target.value), month: undefined })} options={years.map((y) => ({ label: String(y), value: y }))} size="small" sx={{ ...field, width: { xs: "100%", sm: 150 } }} value={search.year} />
      <ErgSelect slotProps={chip("Tháng")} onChange={(event) => onChange({ month: event.target.value })} options={[all, ...months.map((m) => ({ label: m.slice(5), value: m }))]} size="small" sx={{ ...field, width: { xs: "100%", sm: 170 } }} value={search.month && months.includes(search.month) ? search.month : ""} />
      <ErgSelect slotProps={chip("Trường")} onChange={(event) => onChange({ schoolId: event.target.value })} options={[all, ...schools]} size="small" sx={{ ...field, width: { xs: "100%", sm: 220 } }} value={search.schoolId ?? ""} />
      <ErgSelect slotProps={chip("Giáo viên")} onChange={(event) => onChange({ teacherId: event.target.value })} options={[all, ...teachers]} size="small" sx={{ ...field, width: { xs: "100%", sm: 220 } }} value={search.teacherId ?? ""} />
      <ErgSearchField onChange={(event) => onQuery(event.target.value)} placeholder="Tìm lớp, nội dung…" slotProps={{ htmlInput: { "aria-label": "Tìm lớp, nội dung" } }} sx={{ ...field, width: { xs: "100%", sm: 220 } }} value={q} />
      <Box component="span" sx={{ ...t.type.small, color: "text.secondary", ml: { sm: "auto" } }}>{count}</Box>
    </Box>
  );
}
