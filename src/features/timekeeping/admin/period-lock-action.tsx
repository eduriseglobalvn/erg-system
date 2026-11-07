import { useState } from "react";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { usePeriodLock } from "../api/timekeeping-admin-query";
import type { Timesheet } from "../api/timekeeping-types";
import { monthLabel } from "../components/my-timesheet/timesheet-summary";
import { requestErrorText } from "../components/requests/request-model";

type PeriodLockActionProps = { stage: NonNullable<Timesheet["stage"]>; period: string; schoolId: string };

/**
 * "Chốt công tháng" (the page's only contained button) or, once locked, "Mở lại kỳ" (outlined, reason required).
 * A refusal such as 409 "Còn 2 đơn chưa duyệt trong kỳ" stays inside the dialog and the stage does not change.
 */
export function PeriodLockAction({ period, schoolId, stage }: PeriodLockActionProps) {
  const { lock, reopen } = usePeriodLock(period, schoolId);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const locked = stage === "LOCKED";
  const mutation = locked ? reopen : lock;
  const close = () => {
    setOpen(false);
    setReason("");
    lock.reset();
    reopen.reset();
  };
  const done = (message: string) => ({ onSuccess: () => { close(); toast.success(message); } });
  const confirm = () => (locked ? reopen.mutate(reason.trim(), done("Đã mở lại kỳ công")) : lock.mutate(undefined, done("Đã chốt công tháng")));

  return (
    <>
      <ErgButton onClick={() => setOpen(true)} variant={locked ? "outlined" : "contained"}>{locked ? "Mở lại kỳ" : "Chốt công tháng"}</ErgButton>
      <ErgConfirmDialog
        confirmDisabled={locked && !reason.trim()}
        confirmLabel={locked ? "Mở lại kỳ" : "Chốt công"}
        description={locked ? "Bảng công sẽ được mở để chỉnh sửa. Lý do được ghi lại trong nhật ký." : "Sau khi chốt, bảng công bị khoá và dùng để tính lương."}
        loading={mutation.isPending}
        onCancel={close}
        onConfirm={confirm}
        open={open}
        title={`${locked ? "Mở lại kỳ" : "Chốt công"} ${monthLabel(period)}?`}
      >
        {locked ? (
          <ErgTextField label="Lý do" multiline onChange={(event) => setReason(event.target.value)} required rows={2} sx={{ mt: 2 }} value={reason} />
        ) : null}
        {mutation.isError ? <Typography color="error" role="alert" sx={{ mt: 2 }} variant="body2">{requestErrorText(mutation.error)}</Typography> : null}
      </ErgConfirmDialog>
    </>
  );
}
