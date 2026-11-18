import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { formatAcademicYear, getAcademicYearOptions, getAcademicYearStart } from "@/features/lcms/school-management/types/academic-year";

export function AcademicYearFields({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const startYear = getAcademicYearStart(value);
  const options = getAcademicYearOptions(startYear);

  return <>
    <TextField helperText="Chọn năm bắt đầu" label="Năm học bắt đầu" onChange={(event) => onChange(formatAcademicYear(Number(event.target.value)))} select value={startYear}>
      {options.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
    </TextField>
    {/* Tự tính từ năm bắt đầu nên chỉ hiển thị, không là ô nhập. */}
    <Box sx={{ alignSelf: "start", display: "grid", pt: 0.5 }}>
      <Typography color="text.secondary" variant="caption">Năm học kết thúc</Typography>
      <Typography variant="body1">{startYear + 1}</Typography>
      <Typography color="text.secondary" variant="caption">Tự động theo năm bắt đầu</Typography>
    </Box>
  </>;
}
