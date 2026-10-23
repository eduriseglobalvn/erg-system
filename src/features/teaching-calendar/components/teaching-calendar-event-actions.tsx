import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import type {
  ErgCalendarEvent,
  ErgCalendarPermissions,
} from "@/components/shared/erg-calendar-workspace";

export type TeachingCalendarEventUpdate = {
  note?: string;
  roomId?: string;
  roomName?: string;
};

type Props = {
  event: ErgCalendarEvent;
  onDelete?: (event: ErgCalendarEvent) => Promise<void> | void;
  onUpdate?: (event: ErgCalendarEvent, update: TeachingCalendarEventUpdate) => Promise<void> | void;
  permissions?: ErgCalendarPermissions;
};

export function TeachingCalendarEventActions({ event, onDelete, onUpdate, permissions }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [roomName, setRoomName] = useState(event.location);
  const [note, setNote] = useState(event.note ?? "");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveUpdate() {
    if (!onUpdate) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      await onUpdate(event, {
        note: note.trim() || undefined,
        roomId: event.roomId,
        roomName: roomName.trim() || undefined,
      });
      setEditOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể cập nhật lịch. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteEvent() {
    if (!onDelete || !window.confirm("Xóa lịch giảng dạy này? Hành động này sẽ hủy sự kiện khỏi lịch giáo viên.")) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      await onDelete(event);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể xóa lịch. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        {permissions?.canDelete && onDelete ? (
          <Button color="error" disabled={isSaving} onClick={() => void deleteEvent()} size="small" variant="outlined">
            Xóa lịch
          </Button>
        ) : null}
        {permissions?.canUpdate && onUpdate ? (
          <Button disabled={isSaving} onClick={() => setEditOpen(true)} size="small" variant="contained">
            Chỉnh lịch
          </Button>
        ) : null}
      </Stack>
      {errorMessage && !editOpen ? <Alert severity="error" sx={{ mt: 1 }}>{errorMessage}</Alert> : null}
      <Dialog fullWidth maxWidth="sm" onClose={() => setEditOpen(false)} open={editOpen}>
        <DialogTitle>Chỉnh lịch giảng dạy</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            <TextField label="Tên phòng" onChange={(changeEvent) => setRoomName(changeEvent.target.value)} value={roomName} />
            <TextField label="Ghi chú" minRows={3} multiline onChange={(changeEvent) => setNote(changeEvent.target.value)} value={note} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isSaving} onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button disabled={isSaving} onClick={() => void saveUpdate()} variant="contained">Lưu thay đổi</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
