import { useEffect, useRef, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { useApprovalDecision, useApprovalDetail } from "../../api/timekeeping-approval-query";
import { requestErrorText, STATUS_CHIP } from "../../components/requests/request-model";
import { onBehalfText, stepPosition } from "./approval-model";
import { ApprovalDetailBody } from "./approval-detail-body";

type ApprovalDetailProps = {
  id: string;
  /** School name of the requester's school id. */
  schoolName?: (schoolId?: string) => string | undefined;
  /** Full-screen mode (below `md`): shows a back button and moves focus to the heading on open. */
  fullScreen?: boolean;
  onClose: () => void;
};

/** Right-hand panel of A03. "Duyệt đơn" here is the page's only contained button. */
export function ApprovalDetail({ fullScreen = false, id, onClose, schoolName }: ApprovalDetailProps) {
  const { data, isError, refetch } = useApprovalDetail(id);
  const decision = useApprovalDecision();
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const ready = Boolean(data);
  useEffect(() => { if (fullScreen) heading.current?.focus(); }, [fullScreen, ready]);

  const request = data?.item?.request;
  const decide = (kind: "approve" | "reject") => {
    if (kind === "reject" && !comment.trim()) return setCommentError("Nhập lý do từ chối");
    decision.mutate({ id, decision: kind, comment: comment.trim() }, {
      onSuccess: () => { toast.success(kind === "approve" ? `Đã duyệt đơn ${request?.code ?? ""}` : `Đã từ chối đơn ${request?.code ?? ""}`); onClose(); },
    });
  };

  if (isError) return <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được đơn này." title="Có lỗi xảy ra" />;
  if (!data || !request) return <ErgSkeleton height={320} />;

  const position = stepPosition(request);
  const status = request.status ? STATUS_CHIP[request.status] : undefined;
  const school = schoolName?.(data.item?.schoolId);
  const actionable = data.canAct && request.status === "PENDING";
  return (
    <Box>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1 }}>
        {fullScreen ? <ErgIconButton label="Quay lại danh sách" onClick={onClose}><ArrowBackIcon /></ErgIconButton> : null}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" ref={heading} sx={{ outline: "none" }} tabIndex={-1} variant="h6">{data.item?.requesterName}</Typography>
          <Typography color="text.secondary" variant="body2">{[school, position?.label].filter(Boolean).join(" · ")}</Typography>
          <Typography color="text.secondary" variant="caption">{[request.code, request.submittedAt ? `Gửi ${formatDateTimeVi(request.submittedAt)}` : ""].filter(Boolean).join(" · ")}</Typography>
        </Box>
        {data.item?.overdue ? <ErgStatusChip label="Quá hạn" tone="error" /> : status && request.status !== "PENDING" ? <ErgStatusChip label={status.label} tone={status.tone} /> : null}
      </Box>
      <Box sx={{ mt: 2 }}>
        <ApprovalDetailBody detail={data} />
      </Box>
      {actionable ? (
        <Box sx={{ borderTop: 1, borderColor: "divider", display: "grid", gap: 1.5, mt: 2, pt: 2 }}>
          <ErgTextField
            error={Boolean(commentError)}
            helperText={commentError || "Nhận xét sẽ gửi cho người nộp đơn. Bắt buộc khi từ chối."}
            label="Nhận xét (gửi cho người nộp)"
            multiline
            onChange={(event) => { setComment(event.target.value); setCommentError(""); }}
            rows={2}
            value={comment}
          />
          {data.actingOnBehalf ? <Alert severity="info">{onBehalfText(position)}</Alert> : null}
          {decision.isError ? <Alert severity="error">{requestErrorText(decision.error)}</Alert> : null}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <ErgButton color="error" disabled={decision.isPending} onClick={() => decide("reject")} variant="outlined">Từ chối</ErgButton>
            <ErgButton loading={decision.isPending} onClick={() => decide("approve")} variant="contained">Duyệt đơn</ErgButton>
          </Box>
        </Box>
      ) : request.status === "PENDING" ? (
        <Alert severity="info" sx={{ mt: 2 }}>Bạn không có quyền xử lý ở bước này.</Alert>
      ) : null}
    </Box>
  );
}
