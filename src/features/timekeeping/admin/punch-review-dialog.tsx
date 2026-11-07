import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { usePunchReview } from "../api/timekeeping-admin-query";
import type { ActionItem, RecentPunch } from "../api/timekeeping-types";
import { requestErrorText } from "../components/requests/request-model";
import { PUNCH_STATUS, verifyText } from "./punch-status";

type PunchReviewDialogProps = {
  /** The "Cần xử lý ngay" item (kind PUNCH_REVIEW): `targetId` is the punch id, `label` the verdict reason the server recorded. */
  item: ActionItem;
  /** The row from "Lượt chấm gần nhất", when the punch is still in that list. */
  punch?: RecentPunch;
  onClose: () => void;
};

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Typography component="div" sx={{ display: "flex", gap: 2, justifyContent: "space-between", py: 0.5 }} variant="body2">
      <span>{label}</span>
      <Typography component="span" sx={{ textAlign: "right" }} variant="subtitle2">{value}</Typography>
    </Typography>
  );
}

/**
 * Review of a FLAGGED / PENDING_REVIEW punch. "Chấp nhận" counts it, "Từ chối" voids it and needs a reason (no API call without one).
 * The admin API carries no distance or photo URL for a punch, so the dialog shows what the list row and the item label hold.
 */
export function PunchReviewDialog({ item, onClose, punch }: PunchReviewDialogProps) {
  const review = usePunchReview();
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const decide = (decision: "ACCEPT" | "REJECT") => {
    if (decision === "REJECT" && !comment.trim()) return setCommentError("Nhập lý do từ chối");
    review.mutate({ id: item.targetId as string, decision, comment: comment.trim() }, {
      onSuccess: () => { toast.success(decision === "ACCEPT" ? "Đã chấp nhận lượt chấm" : "Đã từ chối lượt chấm"); onClose(); },
    });
  };
  const status = punch?.status ? PUNCH_STATUS[punch.status].label : undefined;
  return (
    <ErgDialog
      actions={
        <>
          <ErgButton disabled={review.isPending} onClick={onClose} variant="text">Đóng</ErgButton>
          <ErgButton color="error" disabled={review.isPending} onClick={() => decide("REJECT")} variant="outlined">Từ chối</ErgButton>
          <ErgButton loading={review.isPending} onClick={() => decide("ACCEPT")} variant="contained">Chấp nhận</ErgButton>
        </>
      }
      maxWidth="xs"
      onClose={review.isPending ? undefined : onClose}
      open
      title="Duyệt lượt chấm công"
    >
      <Box>
        <Line label="Nhân sự" value={punch?.userName ?? item.userName ?? "—"} />
        {punch?.time ? <Line label="Giờ chấm" value={`${formatDateTimeVi(punch.time)} · ${punch.direction === "OUT" ? "Ra" : "Vào"}`} /> : null}
        {punch?.siteName ? <Line label="Địa điểm" value={punch.siteName} /> : null}
        {punch ? <Line label="Xác thực" value={verifyText(punch)} /> : null}
        {status ? <Line label="Trạng thái" value={status} /> : null}
        <Line label="Lý do hệ thống ghi nhận" value={item.label ?? "Lượt chấm cần duyệt"} />
        {punch && !punch.hasPhoto ? <Typography color="text.secondary" variant="caption">Không có ảnh chấm công (đã xoá theo hạn lưu hoặc không chụp).</Typography> : null}
        <ErgTextField
          error={Boolean(commentError)}
          helperText={commentError || "Bắt buộc khi từ chối."}
          label="Nhận xét"
          multiline
          onChange={(event) => { setComment(event.target.value); setCommentError(""); }}
          rows={2}
          sx={{ mt: 2 }}
          value={comment}
        />
        {review.isError ? <Alert severity="error" sx={{ mt: 1 }}>{requestErrorText(review.error)}</Alert> : null}
      </Box>
    </ErgDialog>
  );
}
