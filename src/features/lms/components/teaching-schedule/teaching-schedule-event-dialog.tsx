import AlignHorizontalLeftRoundedIcon from "@mui/icons-material/AlignHorizontalLeftRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type { TeachingScheduleDraft, TeachingScheduleStatus } from "./teaching-schedule-types";

const statusOptions: Array<{ label: string; value: TeachingScheduleStatus }> = [
  { label: "Đã phân bổ", value: "confirmed" },
  { label: "Lịch nháp", value: "draft" },
  { label: "Cần học liệu", value: "needs-material" },
];

type TeachingScheduleEventDialogProps = {
  draft: TeachingScheduleDraft;
  mode: "create" | "edit";
  onChange: (draft: TeachingScheduleDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
  onSave: () => void;
};

export function TeachingScheduleEventDialog({ draft, mode, onChange, onClose, onDelete, onSave }: TeachingScheduleEventDialogProps) {
  function updateDraft(field: keyof TeachingScheduleDraft, value: string) {
    onChange({ ...draft, [field]: value });
  }

  const dialogTitle = mode === "create" ? "Tạo lịch dạy" : "Chỉnh sửa lịch dạy";

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open>
      <DialogTitle sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", py: 1.25 }}>
        <Typography component="span" sx={{ fontWeight: 800 }} variant="h6">{dialogTitle}</Typography>
        <Stack direction="row" spacing={0.5}>
          {mode === "edit" && onDelete ? <IconButton aria-label="Xóa" color="error" onClick={onDelete}><DeleteOutlineRoundedIcon /></IconButton> : null}
          <IconButton aria-label="Đóng" onClick={onClose}><CloseRoundedIcon /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ display: "grid", gap: 2, py: 2.5 }}>
        <TextField autoFocus fullWidth label="Tiêu đề" onChange={(event) => updateDraft("title", event.target.value)} value={draft.title} />

        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip color="primary" label="Sự kiện" />
          <Chip label="Việc cần làm" variant="outlined" />
          <Chip label="Lên lịch hẹn" variant="outlined" />
        </Stack>

        <ScheduleRow icon={<ScheduleRoundedIcon />}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField slotProps={{ inputLabel: { shrink: true } }} label="Bắt đầu" onChange={(event) => updateDraft("start", event.target.value)} type="datetime-local" value={draft.start} />
            <TextField slotProps={{ inputLabel: { shrink: true } }} label="Kết thúc" onChange={(event) => updateDraft("end", event.target.value)} type="datetime-local" value={draft.end} />
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 1.25 }}><Chip label="Không lặp lại" size="small" variant="outlined" /><Chip label="Thêm thời gian" size="small" variant="outlined" /><Chip label="Không có giờ bận" size="small" variant="outlined" /></Stack>
        </ScheduleRow>

        <ScheduleRow icon={<GroupsRoundedIcon />}><TextField fullWidth label="Lớp hoặc nhóm học sinh" onChange={(event) => updateDraft("className", event.target.value)} value={draft.className} /></ScheduleRow>
        <ScheduleRow icon={<SchoolOutlinedIcon />}><TextField fullWidth label="Phân tiết / tiết dạy" onChange={(event) => updateDraft("lesson", event.target.value)} value={draft.lesson} /></ScheduleRow>
        <ScheduleRow icon={<LocationOnOutlinedIcon />}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField label="Trường" onChange={(event) => updateDraft("school", event.target.value)} value={draft.school} />
            <TextField label="Phòng học" onChange={(event) => updateDraft("room", event.target.value)} value={draft.room} />
          </Box>
        </ScheduleRow>

        <ScheduleRow icon={<NotificationsNoneRoundedIcon />}><Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}><Chip label="30 phút trước" variant="outlined" /><Chip label="Email" variant="outlined" /><Button variant="text">Thêm thông báo</Button></Stack></ScheduleRow>
        <ScheduleRow icon={<CalendarMonthRoundedIcon />}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 190px" } }}>
            <Box sx={{ alignItems: "center", bgcolor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 2, display: "flex", minHeight: 40, px: 1.5 }}><Typography sx={{ fontSize: 14, fontWeight: 700 }}>Lịch dạy của tôi</Typography></Box>
            <TextField label="Trạng thái" onChange={(event) => updateDraft("status", event.target.value)} select value={draft.status}>{statusOptions.map((status) => <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>)}</TextField>
          </Box>
        </ScheduleRow>
        <ScheduleRow icon={<AlignHorizontalLeftRoundedIcon />}><TextField fullWidth label="Mô tả và ghi chú" minRows={3} multiline onChange={(event) => updateDraft("note", event.target.value)} value={draft.note} /></ScheduleRow>
      </DialogContent>

      <DialogActions sx={{ bgcolor: "background.default", justifyContent: "space-between", px: 3, py: 1.5 }}>
        <Button variant="text">Tùy chọn khác</Button>
        <Button onClick={onSave} startIcon={<CheckRoundedIcon />}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}

function ScheduleRow({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "28px minmax(0, 1fr)" } }}><Box sx={{ color: "text.secondary", display: { xs: "none", md: "flex" }, pt: 1, "& .MuiSvgIcon-root": { fontSize: 20 } }}>{icon}</Box><Box sx={{ minWidth: 0 }}>{children}</Box></Box>;
}
