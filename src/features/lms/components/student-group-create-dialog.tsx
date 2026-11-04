import { useState } from "react";
import Button from "@mui/material/Button";

import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";

export function CreateStudentGroupDialog({
  onClose,
  onSubmit,
  open,
  pending = false,
}: {
  onClose: () => void;
  onSubmit: (name: string) => Promise<boolean>;
  open: boolean;
  pending?: boolean;
}) {
  const [name, setName] = useState("");
  const trimmed = name.trim();

  async function submit() {
    if (!trimmed || pending) return;
    if (await onSubmit(trimmed)) {
      setName("");
      onClose();
    }
  }

  return (
    <ErgDialog
      actions={(
        <>
          <Button onClick={onClose} sx={{ minHeight: 44 }} variant="text">Hủy</Button>
          <Button disabled={!trimmed || pending} onClick={() => void submit()} sx={{ minHeight: 44 }} variant="contained">Tạo nhóm</Button>
        </>
      )}
      description="Đặt tên cho nhóm, sau đó chọn học sinh từ các lớp để thêm vào nhóm."
      onClose={onClose}
      open={open}
      title="Tạo nhóm học sinh"
    >
      <ErgTextField
        autoFocus
        fullWidth
        label="Tên nhóm"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void submit();
        }}
        placeholder="Ví dụ: Nhóm ôn luyện cuối kỳ"
        required
        value={name}
      />
    </ErgDialog>
  );
}
