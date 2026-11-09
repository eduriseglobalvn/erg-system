import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { FormEvent, ReactNode } from "react";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";

/** Below md the portal dock floats at the bottom: the primary action bar sticks just above it (G08–G10). */
export const stickyActionsSx = {
  bgcolor: "background.default",
  borderColor: "divider",
  borderTop: { xs: 1, md: 0 },
  bottom: { xs: ergMobileDockAnchor(8), md: "auto" },
  mx: { xs: -2, sm: -3, md: 0 },
  position: { xs: "sticky", md: "static" },
  px: { xs: 2, sm: 3, md: 0 },
  py: { xs: 1.5, md: 0 },
  transition: "bottom 220ms cubic-bezier(0.16, 1, 0.3, 1)",
  zIndex: 4,
} as const;

const EDIT_PENDING_NOTICE = "Sửa đơn đang chờ sẽ huỷ đơn hiện tại và gửi lại đơn mới; đơn mới có mã mới và người duyệt phải xem lại.";

type RequestFormFrameProps = {
  title: string;
  description?: string;
  /** Shown at the right end of the title bar instead of "Lưu nháp" (e.g. the explanations left). */
  badge?: ReactNode;
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

/** Title bar (back, title, "Lưu nháp" text button), the fields, then the page's single contained submit at full width. */
export function RequestFormFrame({ title, description, badge, submitLabel, pending, error, submitDisabled, editingPending, onBack, onSubmit, onSaveDraft, children }: RequestFormFrameProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <Box component="form" noValidate onSubmit={submit} sx={{ display: "grid", gap: 2, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, mx: -1 }}>
        <ErgIconButton label="Quay lại" onClick={onBack}><ArrowBackIcon /></ErgIconButton>
        <Typography component="h1" sx={{ flex: 1, minWidth: 0 }} variant="h4">{title}</Typography>
        {badge}
        {onSaveDraft ? <ErgButton disabled={pending} onClick={onSaveDraft} size="small" variant="text">Lưu nháp</ErgButton> : null}
      </Box>
      {description ? <Typography color="text.secondary" sx={{ mt: -1 }} variant="body2">{description}</Typography> : null}
      {editingPending ? <Alert severity="info">{EDIT_PENDING_NOTICE}</Alert> : null}
      {children}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box sx={stickyActionsSx}>
        <ErgButton disabled={submitDisabled} fullWidth loading={pending} size="large" type="submit" variant="contained">{submitLabel}</ErgButton>
      </Box>
    </Box>
  );
}
