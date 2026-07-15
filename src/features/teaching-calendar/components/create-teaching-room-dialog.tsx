import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import type {
  CreateRoomInput,
  TeachingScheduleRoomOption,
} from "@/features/teaching-calendar/api/teaching-calendar-api";

type Props = {
  onClose: () => void;
  onCreate: (input: Omit<CreateRoomInput, "tenantId">) => Promise<TeachingScheduleRoomOption> | TeachingScheduleRoomOption;
  onCreated: (room: TeachingScheduleRoomOption) => void;
  open: boolean;
  schoolId: string;
};

export function CreateTeachingRoomDialog({ onClose, onCreate, onCreated, open, schoolId }: Props) {
  const [roomName, setRoomName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function closeDialog() {
    setRoomName("");
    setErrorMessage("");
    onClose();
  }

  async function submit() {
    const normalizedRoomName = roomName.trim();
    if (!schoolId || !normalizedRoomName) {
      setErrorMessage("Vui lòng chọn trường và nhập tên phòng.");
      return;
    }
    setIsSaving(true);
    setErrorMessage("");
    try {
      const room = await onCreate({ roomName: normalizedRoomName, schoolId });
      onCreated(room);
      closeDialog();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tạo phòng. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog fullWidth maxWidth="xs" onClose={closeDialog} open={open}>
      <DialogTitle>Tạo phòng học</DialogTitle>
      <DialogContent>
        {errorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}
        <TextField
          autoFocus
          fullWidth
          label="Tên phòng mới"
          onChange={(event) => setRoomName(event.target.value)}
          sx={{ mt: 1 }}
          value={roomName}
        />
      </DialogContent>
      <DialogActions>
        <Button disabled={isSaving} onClick={closeDialog}>Hủy</Button>
        <Button disabled={isSaving} onClick={() => void submit()} variant="contained">Tạo phòng</Button>
      </DialogActions>
    </Dialog>
  );
}
