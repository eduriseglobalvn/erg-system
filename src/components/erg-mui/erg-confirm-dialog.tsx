import type { ReactNode } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

import { ErgButton } from "./erg-actions";

type ErgConfirmDialogProps = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  /** Tóm tắt ảnh hưởng, ví dụ "Ảnh hưởng 6 nhóm quyền / 12 người". */
  impact?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  /** Khoá nút xác nhận, ví dụ khi chưa nhập lý do. */
  confirmDisabled?: boolean;
  /** Nội dung thêm dưới phần mô tả: ô nhập lý do, thông báo lỗi. */
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ErgConfirmDialog({
  cancelLabel = "Huỷ",
  children,
  confirmDisabled = false,
  confirmLabel,
  description,
  destructive = false,
  impact,
  loading = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ErgConfirmDialogProps) {
  return (
    <Dialog fullWidth maxWidth="xs" onClose={loading ? undefined : onCancel} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {description ? <Typography sx={{ color: "text.secondary", fontSize: 14 }}>{description}</Typography> : null}
        {impact ? (
          <Typography sx={{ fontSize: 14, fontWeight: 500, mt: description ? 1.5 : 0 }}>{impact}</Typography>
        ) : null}
        {children}
      </DialogContent>
      <DialogActions>
        <ErgButton disabled={loading} onClick={onCancel} variant="text">
          {cancelLabel}
        </ErgButton>
        <ErgButton color={destructive ? "error" : "primary"} disabled={confirmDisabled} loading={loading} onClick={onConfirm} variant="contained">
          {confirmLabel}
        </ErgButton>
      </DialogActions>
    </Dialog>
  );
}
