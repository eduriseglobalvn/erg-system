import Stack from "@mui/material/Stack";
import { useMutation } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { ApiClientError } from "@/lib/api-client/errors";
import { changeMyPassword } from "@/platform/auth/api/account-security-api";

// The server rule (ChangePasswordRequest: 8–128 characters).
export const STUDENT_PASSWORD_MIN = 8;

/** Why the form cannot be sent yet, or null when it can. */
export function studentPasswordError(current: string, next: string, confirm: string): string | null {
  if (!current) return "Nhập mật khẩu hiện tại.";
  if (next.length < STUDENT_PASSWORD_MIN) return `Mật khẩu mới cần ít nhất ${STUDENT_PASSWORD_MIN} ký tự.`;
  if (next === current) return "Mật khẩu mới phải khác mật khẩu hiện tại.";
  if (next !== confirm) return "Xác nhận mật khẩu chưa khớp.";
  return null;
}

/**
 * A student changes their own password: the current one and a new one, nothing else (a teacher can reset a
 * forgotten password, so there is no e-mail or OTP step).
 */
export function StudentPasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const formId = useId();
  const mutation = useMutation({
    mutationFn: () => changeMyPassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      toast.success("Đã đổi mật khẩu. Các thiết bị khác sẽ bị đăng xuất.");
      close();
    },
    onError: (failure) => {
      // The form already checked the new password, so a 400 means the current one is wrong ("invalid old password").
      const wrongCurrent = failure instanceof ApiClientError ? failure.status === 400 : /old password/i.test(String(failure));
      setError(wrongCurrent ? "Mật khẩu hiện tại không đúng." : "Chưa đổi được mật khẩu. Thử lại sau.");
    },
  });

  function close() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
    mutation.reset();
    onClose();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = studentPasswordError(current, next, confirm);
    setError(invalid);
    if (!invalid) mutation.mutate();
  }

  const field = { autoCapitalize: "none", spellCheck: false } as const;
  return (
    <ErgDialog
      open={open}
      onClose={mutation.isPending ? undefined : close}
      title="Đổi mật khẩu"
      description="Quên mật khẩu thì nhờ giáo viên đặt lại."
      actions={
        <>
          <ErgButton variant="text" onClick={close} disabled={mutation.isPending}>Huỷ</ErgButton>
          <ErgButton type="submit" form={formId} loading={mutation.isPending}>Đổi mật khẩu</ErgButton>
        </>
      }
    >
      <Stack component="form" id={formId} noValidate onSubmit={submit} spacing={2} sx={{ pt: 0.5 }}>
        <ErgTextField
          autoFocus
          fullWidth
          type="password"
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          slotProps={{ htmlInput: field }}
        />
        <ErgTextField
          fullWidth
          type="password"
          label="Mật khẩu mới"
          autoComplete="new-password"
          helperText={`Ít nhất ${STUDENT_PASSWORD_MIN} ký tự.`}
          value={next}
          onChange={(event) => setNext(event.target.value)}
          slotProps={{ htmlInput: field }}
        />
        <ErgTextField
          fullWidth
          type="password"
          label="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          error={Boolean(error)}
          helperText={error ?? " "}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          slotProps={{ htmlInput: field }}
        />
      </Stack>
    </ErgDialog>
  );
}
