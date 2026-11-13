import { useState } from "react";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";

/** "Đặt câu hỏi": a question plus an optional subject picked from the subjects already in the class feed. */
export function AskQuestionDialog({ onClose, onSubmit, open, subjects }: {
  onClose: () => void;
  onSubmit: (content: string, subject: string | undefined) => void;
  open: boolean;
  subjects: string[];
}) {
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const canSubmit = content.trim().length > 0;

  function submit() {
    if (!canSubmit) return;
    onSubmit(content.trim(), subject || undefined);
    setContent("");
    setSubject("");
  }

  return (
    <ErgDialog
      open={open}
      title="Đặt câu hỏi"
      description="Viết rõ câu hỏi và phần bạn chưa hiểu. Giáo viên xem và duyệt mọi bài viết."
      onClose={onClose}
      actions={(
        <>
          <Button variant="text" onClick={onClose}>Hủy</Button>
          <Button disabled={!canSubmit} variant="contained" onClick={submit}>Đăng câu hỏi</Button>
        </>
      )}
    >
      <TextField autoFocus fullWidth multiline minRows={3} maxRows={8} label="Câu hỏi" value={content} onChange={(event) => setContent(event.target.value)} sx={{ mt: 1 }} />
      {subjects.length ? (
        <TextField select fullWidth label="Môn học" value={subject} onChange={(event) => setSubject(event.target.value)} sx={{ mt: 2 }}>
          <MenuItem value="">Không chọn môn</MenuItem>
          {subjects.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
        </TextField>
      ) : null}
    </ErgDialog>
  );
}
