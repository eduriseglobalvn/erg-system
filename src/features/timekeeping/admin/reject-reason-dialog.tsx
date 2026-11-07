import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";

type RejectReasonDialogProps = { title: string; pending: boolean; onClose: () => void; onSubmit: (reason: string) => void };

/** Reason first, then the reject call: nothing is sent without a reason. */
export function RejectReasonDialog({ onClose, onSubmit, pending, title }: RejectReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <ErgDialog
      actions={
        <>
          <ErgButton disabled={pending} onClick={onClose} variant="text">Đóng</ErgButton>
          <ErgButton color="error" loading={pending} onClick={() => (reason.trim() ? onSubmit(reason.trim()) : setError("Nhập lý do từ chối"))} variant="outlined">Từ chối</ErgButton>
        </>
      }
      maxWidth="xs"
      onClose={pending ? undefined : onClose}
      open
      title={title}
    >
      <ErgTextField error={Boolean(error)} helperText={error || "Bắt buộc."} label="Lý do" multiline onChange={(event) => { setReason(event.target.value); setError(""); }} rows={2} value={reason} />
    </ErgDialog>
  );
}
