import CheckIcon from "@mui/icons-material/Check";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { ActionItem, ApprovalItem, RecentPunch } from "../api/timekeeping-types";
import { PunchCard } from "../components/punch/punch-card";
import { requestTimeText, requestTitle } from "../components/requests/request-model";
import { PUNCH_STATUS, punchTimeText, verifyText } from "./punch-status";

type Handlers = { busy: boolean; onDetail: () => void };

/** "Phạm Quốc Bảo" → "PB": first and last word. */
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length ? `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ""}`.toUpperCase() : "?";
}

/** Canvas A05 card: avatar, name and kind, status chip, detail line, then the actions spread across the card. */
function ItemCard({ actions, chip, detail, meta, title }: { title: string; meta: string; detail?: string; chip?: ReactNode; actions: ReactNode }) {
  const tint = ergEnterpriseTokens.statusTint.info;
  return (
    <PunchCard sx={{ display: "grid", gap: 1.5, px: 2, py: 1.75 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, minWidth: 0 }}>
        <Box aria-hidden sx={{ alignItems: "center", bgcolor: tint.bg, borderRadius: "50%", color: tint.color, display: "flex", flexShrink: 0, height: 36, justifyContent: "center", typography: "subtitle2", width: 36 }}>{initials(title)}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap variant="subtitle2">{title}</Typography>
          <Typography color="text.secondary" component="div" sx={{ overflowWrap: "anywhere" }} variant="caption">{meta}</Typography>
        </Box>
        {chip}
      </Box>
      {detail ? <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }} variant="body2">{detail}</Typography> : null}
      <Box sx={{ display: "flex", gap: 1, "& > .MuiButton-outlined": { flex: 1, whiteSpace: "nowrap" } }}>{actions}</Box>
    </PunchCard>
  );
}

const approveIcon = <CheckIcon color="success" />;

/** Pending request: Từ chối asks for a reason, Xem chi tiết opens A03, Duyệt approves at the current step. */
export function ApprovalCard({ busy, item, onApprove, onDetail, onReject }: Handlers & { item: ApprovalItem; onApprove: () => void; onReject: () => void }) {
  const request = item.request ?? {};
  const code = request.code ?? request.id ?? "";
  return (
    <ItemCard
      actions={
        <>
          <ErgButton aria-label={`Từ chối đơn ${code}`} color="error" disabled={busy} onClick={onReject} size="small" sx={{ color: "error.main" }} variant="text">Từ chối</ErgButton>
          <ErgButton aria-label={`Xem chi tiết đơn ${code}`} onClick={onDetail} size="small" variant="outlined">Xem chi tiết</ErgButton>
          <ErgButton aria-label={`Duyệt đơn ${code}`} disabled={busy} onClick={onApprove} size="small" startIcon={approveIcon} variant="outlined">Duyệt</ErgButton>
        </>
      }
      chip={item.overdue ? <ErgStatusChip label="Quá hạn" tone="error" /> : undefined}
      detail={[request.note, code].filter(Boolean).join(" · ")}
      meta={`${requestTitle(request)} · ${requestTimeText(request)}`}
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
          <ErgButton aria-label={`Từ chối lượt chấm của ${name}`} color="error" disabled={busy} onClick={onReject} size="small" sx={{ color: "error.main" }} variant="text">Từ chối</ErgButton>
          <ErgButton aria-label={`Xem chi tiết lượt chấm của ${name}`} onClick={onDetail} size="small" variant="outlined">Xem chi tiết</ErgButton>
          <ErgButton aria-label={`Duyệt lượt chấm của ${name}`} disabled={busy} onClick={onAccept} size="small" startIcon={approveIcon} variant="outlined">Duyệt</ErgButton>
        </>
      }
      chip={status ? <ErgStatusChip label={status.label} tone={status.tone} /> : undefined}
      detail={punch ? `${punchTimeText(punch)} · ${verifyText(punch)}` : undefined}
      meta={item.label ?? "Lượt chấm cần duyệt"}
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
          <ErgButton aria-label={`Xem chi tiết ${name}`} onClick={onDetail} size="small" variant="outlined">Xem chi tiết</ErgButton>
          <ErgButton aria-label={`Nhắc ${name}`} disabled={busy} onClick={onRemind} size="small" variant="outlined">Nhắc</ErgButton>
        </>
      }
      meta={item.label ?? ""}
      title={name}
    />
  );
}
