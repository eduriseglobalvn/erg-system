import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import type { FormEvent, ReactNode } from "react";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";

const EDIT_PENDING_NOTICE = "Sửa đơn đang chờ sẽ huỷ đơn hiện tại và gửi lại đơn mới; đơn mới có mã mới và người duyệt phải xem lại.";

type RequestFormFrameProps = {
  title: string;
  description?: string;
  submitLabel: string;
  pending: boolean;
  /** Message from the last failed save/send, shown next to the buttons. */
  error?: string | null;
  submitDisabled?: boolean;
  /** Editing a request that is already pending: saving replaces it, so say what happens. */
  editingPending?: boolean;
  onBack: () => void;
  onSubmit: () => void;
  /** Omit for forms with no draft (the explanation form). */
  onSaveDraft?: () => void;
  children: ReactNode;
};

/** Header (back, title, "Lưu nháp" text button, the page's single contained submit) and the error line shared by the request forms. */
export function RequestFormFrame({ title, description, submitLabel, pending, error, submitDisabled, editingPending, onBack, onSubmit, onSaveDraft, children }: RequestFormFrameProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <Box component="form" noValidate onSubmit={submit} sx={{ display: "grid", gap: 2, maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgIconButton label="Quay lại" onClick={onBack} sx={{ justifySelf: "start" }}><ArrowBackIcon /></ErgIconButton>
      <ErgPageHeader
        description={description}
        primaryAction={
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            {onSaveDraft ? <ErgButton disabled={pending} onClick={onSaveDraft} variant="text">Lưu nháp</ErgButton> : null}
            <ErgButton disabled={submitDisabled} loading={pending} type="submit" variant="contained">{submitLabel}</ErgButton>
          </Box>
        }
        title={title}
      />
      {editingPending ? <Alert severity="info">{EDIT_PENDING_NOTICE}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {children}
    </Box>
  );
}
