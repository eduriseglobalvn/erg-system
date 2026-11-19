import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

import { isWorkingSchool, type SchoolStatus } from "@/features/lcms/school-management/types/school-management-types";

export type SchoolStatusFilter = "working" | "paused" | "archived" | "all";

const OPTIONS: Array<[SchoolStatusFilter, string]> = [
  ["working", "Đang hợp tác"],
  ["paused", "Tạm dừng"],
  ["archived", "Đã lưu trữ"],
  ["all", "Tất cả"],
];

export function matchesSchoolStatusFilter(school: { status: SchoolStatus }, filter: SchoolStatusFilter) {
  if (filter === "all") return true;
  return filter === "working" ? isWorkingSchool(school) : school.status === filter;
}

/** Directory status filter; defaults to the schools still working with ERG so paused/archived ones stay one click away. */
export function SchoolStatusFilterField({ onChange, value }: { onChange: (value: SchoolStatusFilter) => void; value: SchoolStatusFilter }) {
  return (
    <TextField
      label="Trạng thái"
      onChange={(event) => onChange(event.target.value as SchoolStatusFilter)}
      select
      size="small"
      sx={{ minWidth: 160 }}
      value={value}
    >
      {OPTIONS.map(([option, label]) => <MenuItem key={option} value={option}>{label}</MenuItem>)}
    </TextField>
  );
}
