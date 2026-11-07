import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { useBulkApprove, useBulkReject } from "../../api/timekeeping-approval-query";
import type { BulkApproveResult } from "../../api/timekeeping-types";
import { requestErrorText } from "../../components/requests/request-model";
import { bulkSummary } from "./approval-model";

type BulkApproveBarProps = {
  /** Selected requests: id and code (codes label the skipped list). */
  selected: readonly { id: string; code: string }[];
  /** Ids that are no longer pending after the action; the page drops them from the selection (skipped ones stay ticked). */
  onSettled: (doneIds: string[]) => void;
};

/**
 * "Đã chọn n đơn" + "Từ chối" / "Duyệt n đơn". Neither is the page's contained button (the detail's "Duyệt đơn" is).
 * Skipped requests stay selected and are listed with the server's reason in a polite live region.
 */
export function BulkApproveBar({ onSettled, selected }: BulkApproveBarProps) {
  const approve = useBulkApprove();
  const reject = useBulkReject();
  const [skipped, setSkipped] = useState<BulkApproveResult["skipped"]>([]);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [message, setMessage] = useState("");
  const codeOf = (id?: string) => selected.find((s) => s.id === id)?.code ?? id ?? "";
  const ids = selected.map((s) => s.id);

  const runApprove = () =>
    approve.mutate(ids, {
      onSuccess: (result) => {
        const summary = bulkSummary(result);
        setMessage(summary);
        setSkipped(result.skipped ?? []);
        if (result.approved?.length) toast.success(summary);
        else toast.error(summary);
        onSettled([...(result.approved ?? [])]);
      },
    });
  const closeReject = () => { setRejecting(false); setReason(""); setReasonError(""); };
  const runReject = () => {
    if (!reason.trim()) return setReasonError("Nhập lý do từ chối");
    reject.mutate({ ids, comment: reason.trim() }, {
      onSuccess: ({ failed, rejected }) => {
        const summary = `Đã từ chối ${rejected.length} đơn${failed ? ` · ${failed} đơn lỗi, thử lại` : ""}`;
        setMessage(summary);
        setSkipped([]);
        if (failed) toast.error(summary);
        else toast.success(summary);
        closeReject();
        onSettled(rejected);
      },
    });
  };

  return (
    <Box sx={{ borderTop: 1, borderColor: "divider", p: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}>
        <Typography variant="subtitle2">Đã chọn {selected.length} đơn hợp lệ</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <ErgButton color="error" disabled={selected.length === 0 || approve.isPending} onClick={() => setRejecting(true)} size="small" variant="outlined">Từ chối</ErgButton>
          <ErgButton disabled={selected.length === 0 || reject.isPending} loading={approve.isPending} onClick={runApprove} size="small" variant="outlined">Duyệt {selected.length} đơn</ErgButton>
        </Box>
      </Box>
      <Box aria-live="polite" role="status">
        {message ? <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">{message}</Typography> : null}
        {skipped?.length ? (
          <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2 }}>
            {skipped.map((s) => <Typography component="li" key={s.id} variant="caption">{codeOf(s.id)}: {s.reason}</Typography>)}
          </Box>
        ) : null}
      </Box>
      {approve.isError ? <Alert severity="error" sx={{ mt: 1 }}>{requestErrorText(approve.error)}</Alert> : null}
      <ErgConfirmDialog
        confirmLabel={`Từ chối ${selected.length} đơn`}
        description="Lý do được gửi cho từng người nộp đơn."
        destructive
        loading={reject.isPending}
        onCancel={closeReject}
        onConfirm={runReject}
        open={rejecting}
        title="Từ chối các đơn đã chọn?"
      >
        <ErgTextField error={Boolean(reasonError)} helperText={reasonError} label="Lý do từ chối" multiline onChange={(e) => { setReason(e.target.value); setReasonError(""); }} rows={2} sx={{ mt: 2 }} value={reason} />
      </ErgConfirmDialog>
    </Box>
  );
}
