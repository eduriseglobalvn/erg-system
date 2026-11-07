import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import type { ActionItem, ApprovalItem, RecentPunch } from "../api/timekeeping-types";
import { PunchCard } from "../components/punch/punch-card";
import { requestTimeText, requestTitle } from "../components/requests/request-model";
import { PUNCH_STATUS, punchTimeText, verifyText } from "./punch-status";

type Handlers = { busy: boolean; onDetail: () => void };

function ItemCard({ actions, chip, meta, title }: { title: string; meta: string; chip?: ReactNode; actions: ReactNode }) {
  return (
    <PunchCard>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <Typography noWrap variant="subtitle2">{title}</Typography>
        {chip}
      </Box>
      <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }} variant="body2">{meta}</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "flex-end", mt: 1 }}>{actions}</Box>
    </PunchCard>
  );
}

/** Pending request: Từ chối asks for a reason, Xem chi tiết opens A03, Duyệt approves at the current step. */
export function ApprovalCard({ busy, item, onApprove, onDetail, onReject }: Handlers & { item: ApprovalItem; onApprove: () => void; onReject: () => void }) {
  const request = item.request ?? {};
  const code = request.code ?? request.id ?? "";
  return (
    <ItemCard
      actions={
        <>
          <ErgButton aria-label={`Từ chối đơn ${code}`} color="error" disabled={busy} onClick={onReject} size="small" variant="text">Từ chối</ErgButton>
          <ErgButton aria-label={`Xem chi tiết đơn ${code}`} onClick={onDetail} size="small" variant="text">Xem chi tiết</ErgButton>
          <ErgButton aria-label={`Duyệt đơn ${code}`} disabled={busy} onClick={onApprove} size="small" variant="outlined">Duyệt</ErgButton>
        </>
      }
      chip={item.overdue ? <ErgStatusChip label="Quá hạn" tone="error" /> : undefined}
      meta={`${requestTitle(request)} · ${requestTimeText(request)} · ${code}`}
      title={item.requesterName ?? "—"}
    />
  );
}

/** Out-of-zone / flagged punch: Duyệt accepts it, Từ chối voids it (reason required). */
export function OutOfZoneCard({ busy, item, onAccept, onDetail, onReject, punch }: Handlers & { item: ActionItem; punch?: RecentPunch; onAccept: () => void; onReject: () => void }) {
  const name = punch?.userName ?? item.userName ?? "—";
  const status = punch?.status ? PUNCH_STATUS[punch.status] : undefined;
  return (
    <ItemCard
      actions={
        <>
          <ErgButton aria-label={`Từ chối lượt chấm của ${name}`} color="error" disabled={busy} onClick={onReject} size="small" variant="text">Từ chối</ErgButton>
          <ErgButton aria-label={`Xem chi tiết lượt chấm của ${name}`} onClick={onDetail} size="small" variant="text">Xem chi tiết</ErgButton>
          <ErgButton aria-label={`Duyệt lượt chấm của ${name}`} disabled={busy} onClick={onAccept} size="small" variant="outlined">Duyệt</ErgButton>
        </>
      }
      chip={status ? <ErgStatusChip label={status.label} tone={status.tone} /> : undefined}
      meta={[item.label, punch ? `${punchTimeText(punch)} · ${verifyText(punch)}` : ""].filter(Boolean).join(" · ")}
      title={name}
    />
  );
}

/** Not punched yet: Nhắc sends the reminder, Xem chi tiết opens the timesheet. */
export function MissingCard({ busy, item, onDetail, onRemind }: Handlers & { item: ActionItem; onRemind: () => void }) {
  const name = item.userName ?? "—";
  return (
    <ItemCard
      actions={
        <>
          <ErgButton aria-label={`Nhắc ${name}`} disabled={busy} onClick={onRemind} size="small" variant="text">Nhắc</ErgButton>
          <ErgButton aria-label={`Xem chi tiết ${name}`} onClick={onDetail} size="small" variant="text">Xem chi tiết</ErgButton>
        </>
      }
      meta={item.label ?? ""}
      title={name}
    />
  );
}
