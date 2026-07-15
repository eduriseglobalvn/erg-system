import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { formatAcademicYear, getAcademicYearOptions, getAcademicYearStart } from "@/features/lcms/school-management/types/academic-year";

export function AcademicYearFields({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const startYear = getAcademicYearStart(value);
  const options = getAcademicYearOptions(startYear);

  return <>
    <TextField helperText="Chọn năm bắt đầu" label="Năm học bắt đầu" onChange={(event) => onChange(formatAcademicYear(Number(event.target.value)))} select value={startYear}>
      {options.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
    </TextField>
    <TextField
      helperText="Tự động theo năm bắt đầu"
      label="Năm học kết thúc"
      slotProps={{ input: { readOnly: true } }}
      value={startYear + 1}
    />
  </>;
}
