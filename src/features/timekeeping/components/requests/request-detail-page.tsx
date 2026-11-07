import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { toast } from "sonner";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgErrorState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { useCancelRequest, useRemindRequest, useRequest } from "../../api/timekeeping-request-query";
import type { RequestView } from "../../api/timekeeping-types";
import { unitsVi } from "../my-timesheet/timesheet-summary";
import { PunchCard } from "../punch/punch-card";
import { ApprovalTimeline } from "./approval-timeline";
import { requestErrorText, requestTimeText, requestTitle, STATUS_CHIP, timelineSteps } from "./request-model";
import { useRequestsNav } from "./use-requests-nav";

const REMIND_EVERY_MS = 24 * 60 * 60 * 1000; // backend: one reminder per request per 24 h

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Typography component="div" sx={{ display: "flex", gap: 2, justifyContent: "space-between", py: 0.5 }} variant="body2">
      <span>{label}</span>
      <Typography component="span" sx={{ textAlign: "right" }} variant="subtitle2">{value}</Typography>
    </Typography>
  );
}

function deduction(r: RequestView): string | null {
  if (r.type !== "LEAVE") return null;
  return r.leaveKind === "ANNUAL" ? `${unitsVi(r.days)} ngày phép năm` : "Không trừ phép năm";
}

function RequestActions({ request }: { request: RequestView }) {
  const nav = useRequestsNav();
  const cancel = useCancelRequest();
  const remind = useRemindRequest();
  const [confirming, setConfirming] = useState(false);
  const [openedAt] = useState(() => Date.now()); // a reminder made after this page opened is later than it, so it still counts as recent
  const id = request.id as string;
  const untouched = !request.steps?.some((s) => s.status === "APPROVED" || s.status === "REJECTED");
  const remindedAt = request.lastRemindedAt ? new Date(request.lastRemindedAt) : null;
  const remindLocked = remindedAt !== null && openedAt - remindedAt.getTime() < REMIND_EVERY_MS;
  const error = cancel.error ?? remind.error;

  if (request.status !== "PENDING" && request.status !== "DRAFT") return null;
  const pending = request.status === "PENDING";
  const closeAfterCancel = () => cancel.mutate(id, { onSuccess: () => { setConfirming(false); toast.success("Đã huỷ đơn"); } });
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      {error ? <Alert severity="error">{requestErrorText(error)}</Alert> : null}
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
        {untouched ? <ErgButton color="error" onClick={() => setConfirming(true)} variant="text">Huỷ đơn</ErgButton> : null}
        {untouched ? <ErgButton onClick={() => nav.toEdit(id)} variant={pending ? "outlined" : "contained"}>Sửa</ErgButton> : null}
        {pending ? (
          <ErgButton
            disabled={remindLocked}
            loading={remind.isPending}
            onClick={() => remind.mutate(id, { onSuccess: () => toast.success("Đã nhắc người duyệt") })}
            variant="contained"
          >
            Nhắc duyệt
          </ErgButton>
        ) : null}
      </Box>
      {pending && remindLocked ? (
        <Typography color="text.secondary" sx={{ textAlign: "right" }} variant="caption">
          {`Đã nhắc lúc ${formatDateTimeVi(remindedAt)}, nhắc lại được sau 24 giờ`}
        </Typography>
      ) : null}
      <ErgConfirmDialog
        cancelLabel="Giữ đơn"
        confirmLabel="Huỷ đơn"
        description="Đơn sẽ bị huỷ và người duyệt không còn thấy đơn này trong hàng chờ."
        destructive
        loading={cancel.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={closeAfterCancel}
        open={confirming}
        title="Huỷ đơn này?"
      />
    </Box>
  );
}

/** G10: request detail with the approval timeline and the actions the status allows. */
export function RequestDetailPage({ id }: { id: string }) {
  const nav = useRequestsNav();
  const { data, isLoading, isError, refetch } = useRequest(id);
  const back = <ErgIconButton label="Quay lại" onClick={() => nav.toList()} sx={{ justifySelf: "start" }}><ArrowBackIcon /></ErgIconButton>;
  const frame = { display: "grid", gap: 2, maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 } as const;

  if (isError) {
    return (
      <Box sx={frame}>
        {back}
        <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được đơn." title="Có lỗi xảy ra" />
      </Box>
    );
  }
  if (isLoading || !data) return <Box sx={frame}>{back}<ErgSkeleton height={320} /></Box>;

  const status = data.status ?? "PENDING";
  const steps = timelineSteps(data);
  const stepNo = steps.findIndex((s) => s.state === "current");
  const chip = status === "PENDING" && stepNo > 0 ? `Chờ duyệt · bước ${stepNo}/${steps.length - 1}` : STATUS_CHIP[status].label;
  const sent = data.submittedAt ? `Gửi ${formatDateTimeVi(data.submittedAt)}` : "Chưa gửi";
  const deducts = deduction(data);

  return (
    <Box sx={frame}>
      {back}
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 2, justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" variant="h5">{requestTitle(data)}</Typography>
          <Typography color="text.secondary" variant="body2">{[data.code, sent].filter(Boolean).join(" · ")}</Typography>
        </Box>
        <ErgStatusChip label={chip} tone={STATUS_CHIP[status].tone} />
      </Box>
      <PunchCard>
        <Line label="Thời gian" value={requestTimeText(data)} />
        {deducts ? <Line label="Trừ quỹ phép" value={deducts} /> : null}
        {data.note ? <Line label="Lý do" value={data.note} /> : null}
      </PunchCard>
      {data.status !== "DRAFT" ? (
        <PunchCard>
          <Typography component="h2" sx={{ mb: 1.5 }} variant="subtitle1">Luồng duyệt</Typography>
          <ApprovalTimeline request={data} />
        </PunchCard>
      ) : null}
      <RequestActions request={data} />
    </Box>
  );
}
