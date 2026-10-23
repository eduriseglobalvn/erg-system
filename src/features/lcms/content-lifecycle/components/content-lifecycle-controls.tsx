import { useMemo, useState, type ReactNode } from "react";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import PublishOutlined from "@mui/icons-material/PublishOutlined";
import SendOutlined from "@mui/icons-material/SendOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import {
  canTransitionContentLifecycle,
  lifecycleStateLabel,
  lifecycleTransitionRequiresReason,
  lifecycleTransitionTargets,
  type ContentLifecycleState,
  type ContentLifecycleTarget,
  type ContentLifecycleTransitionResult,
} from "@/features/lcms/content-lifecycle/types/content-lifecycle-types";
import {
  createContentLifecycleIdempotencyKey,
} from "@/features/lcms/content-lifecycle/api/content-lifecycle-api";
import {
  createAdminContentLifecycleScope,
  useContentLifecycleTransitionMutation,
} from "@/features/lcms/content-lifecycle/api/content-lifecycle-query";
import { ContentLifecycleStateChip } from "@/features/lcms/content-lifecycle/components/content-lifecycle-state-chip";

const transitionCopy: Record<ContentLifecycleState, { label: string; icon: ReactNode }> = {
  DRAFT: { label: "Đưa về bản nháp", icon: <HistoryOutlined fontSize="small" /> },
  IN_REVIEW: { label: "Gửi duyệt", icon: <SendOutlined fontSize="small" /> },
  APPROVED: { label: "Phê duyệt", icon: <CheckCircleOutline fontSize="small" /> },
  PUBLISHED: { label: "Xuất bản", icon: <PublishOutlined fontSize="small" /> },
  ARCHIVED: { label: "Lưu trữ", icon: <ArchiveOutlined fontSize="small" /> },
};

export function ContentLifecycleControls({
  target,
  compact = false,
  onTransitioned,
}: {
  target: ContentLifecycleTarget;
  compact?: boolean;
  onTransitioned?: (result: ContentLifecycleTransitionResult) => void | Promise<void>;
}) {
  const auth = useAuthSession("lcms");
  const scope = createAdminContentLifecycleScope();
  const mutation = useContentLifecycleTransitionMutation(scope);
  const [dialogState, setDialogState] = useState<ContentLifecycleState | null>(null);
  const [reason, setReason] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const permissions = useMemo(() => ({
    grantedPermissions: auth.session?.permissions ?? [],
    deniedPermissions: auth.session?.deniedPermissions ?? [],
  }), [auth.session?.deniedPermissions, auth.session?.permissions]);
  const availableTransitions = useMemo(
    () => target.currentState
      ? lifecycleTransitionTargets(target.currentState, target.resourceKind).filter((state) => canTransitionContentLifecycle(target, state, permissions))
      : [],
    [permissions, target],
  );
  const requiresReason = Boolean(dialogState && target.currentState && lifecycleTransitionRequiresReason(target.currentState, dialogState));

  async function confirmTransition() {
    if (!dialogState || !target.currentState) return;
    if (requiresReason && !reason.trim()) return;
    try {
      const result = await mutation.mutateAsync({
        resourceKind: target.resourceKind,
        resourceId: target.resourceId,
        targetState: dialogState,
        expectedVersion: target.currentVersion,
        reason: reason.trim() || undefined,
        sourceVersionId: target.sourceVersionId,
        idempotencyKey: createContentLifecycleIdempotencyKey(target.resourceId, dialogState),
      });
      setDialogState(null);
      setReason("");
      setSuccessMessage(`${target.label || target.resourceId}: ${lifecycleStateLabel(result.previousState)} → ${lifecycleStateLabel(result.state)} đã được backend xác nhận.`);
      await onTransitioned?.(result);
    } catch {
      // The mutation error is rendered from the server response in the dialog.
    }
  }

  return (
    <Stack spacing={compact ? 0.75 : 1} sx={{ alignItems: "flex-start" }}>
      <ContentLifecycleStateChip state={target.currentState} />
      {target.currentState && availableTransitions.length ? (
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
          {availableTransitions.map((state) => (
            <Button
              key={state}
              disabled={mutation.isPending}
              onClick={() => { mutation.reset(); setSuccessMessage(""); setReason(""); setDialogState(state); }}
              size="small"
              startIcon={transitionCopy[state].icon}
              variant={state === "PUBLISHED" ? "contained" : "outlined"}
            >
              {compact ? transitionCopy[state].label : transitionCopy[state].label}
            </Button>
          ))}
        </Stack>
      ) : target.currentState ? (
        <Typography color="text.secondary" variant="caption">
          Không có quyền hoặc không có bước chuyển hợp lệ.
        </Typography>
      ) : null}
      {successMessage ? <Alert severity="success" sx={{ py: 0, width: "100%" }}>{successMessage}</Alert> : null}

      <Dialog fullWidth maxWidth="xs" onClose={() => { if (!mutation.isPending) setDialogState(null); }} open={Boolean(dialogState)}>
        <DialogTitle>{dialogState ? transitionCopy[dialogState].label : "Chuyển trạng thái"}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Typography color="text.secondary" variant="body2">
              {target.label || target.resourceId} · trạng thái hiện tại: {lifecycleStateLabel(target.currentState)}
            </Typography>
            <TextField
              autoFocus
              disabled={mutation.isPending}
              error={requiresReason && !reason.trim()}
              helperText={requiresReason ? "Bắt buộc ghi lý do để tạo audit trail." : "Lý do sẽ được lưu trong audit trail (không bắt buộc)."}
              label="Lý do chuyển trạng thái"
              minRows={3}
              multiline
              onChange={(event) => setReason(event.target.value)}
              value={reason}
            />
            {mutation.error ? <Alert severity="error">{mutation.error.message || "Không thể chuyển trạng thái."}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={mutation.isPending} onClick={() => setDialogState(null)}>Hủy</Button>
          <Button disabled={mutation.isPending || (requiresReason && !reason.trim())} onClick={() => void confirmTransition()} variant="contained">
            {mutation.isPending ? "Đang lưu…" : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
