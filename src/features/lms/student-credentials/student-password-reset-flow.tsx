import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { resetStudentCredential, type StudentCredentialReset } from "@/features/lms/api/lms-student-credential-api";

export type StudentPasswordResetTarget = { classId: string; studentId: string; studentName: string };

/** Confirm, then show the new password once (it cannot be read back from the server). */
export function StudentPasswordResetFlow({
  onClose,
  portal,
  target,
}: {
  onClose: () => void;
  portal: "lms" | "lcms";
  target: StudentPasswordResetTarget | null;
}) {
  const [result, setResult] = useState<StudentCredentialReset | null>(null);
  const [copied, setCopied] = useState(false);
  const mutation = useMutation({
    mutationFn: (value: StudentPasswordResetTarget) =>
      resetStudentCredential({ classId: value.classId, portal, studentId: value.studentId }),
    onSuccess: setResult,
  });

  function close() {
    setResult(null);
    setCopied(false);
    mutation.reset();
    onClose();
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(`Tên đăng nhập: ${result.username}\nMật khẩu: ${result.password}`);
    setCopied(true);
  }

  if (result) {
    return (
      <Dialog fullWidth maxWidth="xs" onClose={close} open>
        <DialogTitle>Mật khẩu mới của {target?.studentName}</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
            Mật khẩu chỉ hiện ở lần này, không xem lại được. Hãy sao chép và đưa cho học sinh.
          </Typography>
          <Box sx={{ display: "grid", gap: 0.5 }}>
            <Typography variant="body2">Tên đăng nhập: <strong>{result.username}</strong></Typography>
            <Typography variant="body2">Mật khẩu: <strong>{result.password}</strong></Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => void copy()} startIcon={<ContentCopyRoundedIcon />} variant="outlined">
            {copied ? "Đã sao chép" : "Sao chép"}
          </Button>
          <Button onClick={close} variant="contained">Đóng</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <ErgConfirmDialog
      confirmLabel="Cấp lại mật khẩu"
      description={`Hệ thống tạo mật khẩu mới cho ${target?.studentName ?? "học sinh"} và đăng xuất các phiên đang đăng nhập. Mật khẩu cũ không dùng được nữa.`}
      loading={mutation.isPending}
      onCancel={close}
      onConfirm={() => target && mutation.mutate(target)}
      open={target !== null}
      title="Cấp lại mật khẩu học sinh?"
    />
  );
}
