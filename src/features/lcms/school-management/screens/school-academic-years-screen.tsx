import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";

export default function SchoolAcademicYearsScreen() {
  const { activateYear, closeYear, createYear, isLoading, isSaving, selectedSchool } = useSchoolManagementContext();
  const [open, setOpen] = useState(false);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [activate, setActivate] = useState(true);
  const years = selectedSchool?.academicYears ?? [];

  return <SchoolPageShell title="Năm học & học kỳ" description="Thiết lập chu kỳ đào tạo và phạm vi dữ liệu vận hành của trường." action={<Button disabled={!selectedSchool} onClick={() => setOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Tạo năm học</Button>}>
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" } }}>
      {isLoading ? Array.from({ length: 3 }, (_, index) => <Skeleton height={220} key={index} variant="rounded" />) : years.map((year) => {
        const status = year.status.toUpperCase();
        const active = status === "ACTIVE";
        return <Paper key={year.id} variant="outlined" sx={{ p: 2.5 }}><Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}><CalendarMonthRoundedIcon color="primary" /><Chip color={active ? "success" : status === "DRAFT" ? "warning" : "default"} label={active ? "Hiện hành" : status === "DRAFT" ? "Bản nháp" : "Đã khóa"} size="small" /></Box><Typography sx={{ fontSize: 22, fontWeight: 900, mt: 2 }}>{year.displayName}</Typography><Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{year.startsOn || "Chưa đặt ngày bắt đầu"} — {year.endsOn || "Chưa đặt ngày kết thúc"}</Typography><Box sx={{ display: "flex", gap: 1, mt: 2 }}>{!active && status !== "CLOSED" ? <Button disabled={isSaving} onClick={() => void activateYear(year.id, year.version)} variant="outlined">Kích hoạt</Button> : null}{active ? <Button color="warning" disabled={isSaving} onClick={() => void closeYear(year.id, year.version)} variant="outlined">Khóa năm học</Button> : null}</Box></Paper>;
      })}
      {!isLoading && !years.length ? <Paper variant="outlined" sx={{ gridColumn: "1/-1", p: 4, textAlign: "center" }}><Typography sx={{ fontWeight: 800 }}>Chưa có năm học</Typography><Typography color="text.secondary" variant="body2">Tạo năm học đầu tiên để đồng bộ khối học.</Typography></Paper> : null}
    </Box>
    <Dialog fullWidth maxWidth="xs" onClose={() => setOpen(false)} open={open}><DialogTitle>Tạo năm học</DialogTitle><DialogContent sx={{ display: "grid", gap: 1.5, pt: "12px !important" }}><TextField label="Năm bắt đầu" onChange={(event) => setStartYear(Number(event.target.value))} slotProps={{ htmlInput: { min: 2000, max: 2200 } }} type="number" value={startYear} /><TextField label="Năm kết thúc" slotProps={{ input: { readOnly: true } }} value={startYear + 1} /><FormControlLabel control={<Checkbox checked={activate} onChange={(event) => setActivate(event.target.checked)} />} label="Kích hoạt ngay sau khi tạo" /></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Hủy</Button><Button disabled={isSaving || startYear < 2000 || startYear > 2200} onClick={async () => { await createYear({ startYear, activate }); setOpen(false); }} variant="contained">{isSaving ? "Đang tạo..." : "Tạo năm học"}</Button></DialogActions></Dialog>
  </SchoolPageShell>;
}
