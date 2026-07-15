import { useMemo, useState } from "react";
import dayjs from "dayjs";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import type {
  DeleteTeacherScheduleInput,
  TeachingScheduleDeletePayload,
} from "@/features/teaching-calendar/api/teaching-calendar-api";

type Option = { id: string; name: string };

type Props = {
  onDelete: (input: Omit<DeleteTeacherScheduleInput, "tenantId">) => Promise<TeachingScheduleDeletePayload> | TeachingScheduleDeletePayload;
  schools: Option[];
  teachers: Option[];
};

export function DeleteTeacherScheduleDialog({ onDelete, schools, teachers }: Props) {
  const initialRange = useMemo(() => ({
    from: dayjs().startOf("week").format("YYYY-MM-DD"),
    to: dayjs().startOf("week").add(6, "day").format("YYYY-MM-DD"),
  }), []);
  const [open, setOpen] = useState(false);
  const [teacherUserId, setTeacherUserId] = useState(teachers[0]?.id ?? "");
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function submit() {
    if (!teacherUserId || !schoolId || !dateFrom || !dateTo) {
      setErrorMessage("Vui lòng chọn đủ giáo viên, trường và khoảng ngày.");
      return;
    }
    setIsDeleting(true);
    setErrorMessage("");
    try {
      const result = await onDelete({ dateFrom, dateTo, schoolIds: [schoolId], teacherUserId });
      setSuccessMessage(`Đã xóa ${result.affectedEventCount} lịch của giáo viên.`);
      setOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể xóa lịch giáo viên. Vui lòng thử lại.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
        <Button color="error" disabled={!teachers.length || !schools.length} onClick={() => setOpen(true)} size="small" variant="outlined">
          Xóa lịch giáo viên
        </Button>
        {successMessage ? <Alert severity="success" sx={{ width: "100%" }}>{successMessage}</Alert> : null}
      </Stack>
      <Dialog fullWidth maxWidth="sm" onClose={() => setOpen(false)} open={open}>
        <DialogTitle>Xóa lịch theo giáo viên</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning">Các sự kiện trong phạm vi đã chọn sẽ bị hủy và biến mất khỏi lịch LMS.</Alert>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            <TextField label="Giáo viên" onChange={(event) => setTeacherUserId(event.target.value)} select value={teacherUserId}>
              {teachers.map((teacher) => <MenuItem key={teacher.id} value={teacher.id}>{teacher.name}</MenuItem>)}
            </TextField>
            <TextField label="Trường" onChange={(event) => setSchoolId(event.target.value)} select value={schoolId}>
              {schools.map((school) => <MenuItem key={school.id} value={school.id}>{school.name}</MenuItem>)}
            </TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth label="Từ ngày" onChange={(event) => setDateFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="date" value={dateFrom} />
              <TextField fullWidth label="Đến ngày" onChange={(event) => setDateTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="date" value={dateTo} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isDeleting} onClick={() => setOpen(false)}>Hủy</Button>
          <Button color="error" disabled={isDeleting} onClick={() => void submit()} variant="contained">Xác nhận xóa lịch</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
