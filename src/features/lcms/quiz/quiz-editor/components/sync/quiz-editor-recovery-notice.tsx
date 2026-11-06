import Alert from "@mui/material/Alert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { formatDateTimeVi, formatTimeVi } from "@/domain/formatters/format-date";

import type { DeviceDraftBackup } from "../../sync/quiz-draft-device-store";

export type RecoveryDismissed = { recovered: boolean; backups: boolean };

export function QuizEditorRecoveryNotice({ backups, dismissed, onDismiss, onRestore, recovered }: {
  dismissed: RecoveryDismissed;
  onDismiss: (which: keyof RecoveryDismissed) => void;
  recovered: { pendingEdits: number; editedAt: string } | null;
  backups: DeviceDraftBackup[];
  onRestore: (createdAt: string) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const sorted = [...backups].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const restore = (createdAt: string) => {
    setAnchor(null);
    onRestore(createdAt);
  };

  const showRecovered = recovered !== null && !dismissed.recovered;
  const showBackups = sorted.length > 0 && !dismissed.backups;
  if (!showRecovered && !showBackups) return null;

  return (
    <Stack spacing={1}>
      {showRecovered ? (
        <Alert closeText="Đóng" onClose={() => onDismiss("recovered")} severity="info">
          Có {recovered?.pendingEdits} thay đổi từ {formatTimeVi(recovered?.editedAt)} chưa gửi. Đang gửi lên máy chủ.
        </Alert>
      ) : null}
      {showBackups ? (
        <Alert
          action={
            <ErgButton
              onClick={(e) => (sorted.length === 1 ? restore(sorted[0].createdAt) : setAnchor(e.currentTarget))}
              variant="text"
            >
              Khôi phục bản sao
            </ErgButton>
          }
          onClose={() => onDismiss("backups")}
          severity="info"
        >
          Có {sorted.length} bản sao của bài này trên máy.
          <Menu anchorEl={anchor} onClose={() => setAnchor(null)} open={anchor !== null}>
            {sorted.map((b) => (
              <MenuItem key={b.createdAt} onClick={() => restore(b.createdAt)}>
                {formatDateTimeVi(b.createdAt)}
              </MenuItem>
            ))}
          </Menu>
        </Alert>
      ) : null}
    </Stack>
  );
}
