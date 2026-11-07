import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { formatTimeVi, todayInput } from "@/domain/formatters/format-date";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { useAdminToday, usePunchReview, useRemind, useTimekeepingSchools } from "../api/timekeeping-admin-query";
import { useApprovalDecision, useApprovals } from "../api/timekeeping-approval-query";
import type { ActionItem } from "../api/timekeeping-types";
import { requestErrorText } from "../components/requests/request-model";
import { ApprovalCard, MissingCard, OutOfZoneCard } from "./admin-mobile-cards";
import { PunchReviewDialog } from "./punch-review-dialog";
import { RejectReasonDialog } from "./reject-reason-dialog";
import { SchoolFilter } from "./school-filter";
import { useAdminSearch } from "./use-admin-search";

const APPROVALS = "/employees/teacher-absence";
type Tab = "pending" | "missing" | "outside";
type Rejecting = { kind: "request" | "punch"; id: string; title: string };

const onError = (error: unknown) => toast.error(requestErrorText(error));

function Count({ label, value }: { label: string; value?: number }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, textAlign: "center" }}>
      <Typography color="text.secondary" variant="caption">{label}</Typography>
      <Typography sx={{ fontVariantNumeric: "tabular-nums" }} variant="h6">{value ?? "—"}</Typography>
    </Box>
  );
}

/** A05: admin phone view of A01 (counts, then the three queues that need a decision). Below `md` only. */
export function AdminTimekeepingMobile() {
  const { search, update } = useAdminSearch("/employees/timekeeping");
  const navigate = useNavigate();
  const schools = useTimekeepingSchools();
  const schoolId = search.schoolId ?? "";
  const date = todayInput();
  const today = useAdminToday(schoolId, date);
  const approvals = useApprovals({ box: "MINE", siteId: schoolId || undefined });
  const decision = useApprovalDecision();
  const punchReview = usePunchReview();
  const remind = useRemind();
  const [tab, setTab] = useState<Tab>("pending");
  const [rejecting, setRejecting] = useState<Rejecting | null>(null);
  const [reviewing, setReviewing] = useState<ActionItem | null>(null);
  const go = (href: string) => void navigate({ href: adminPath(href) });
  const busy = decision.isPending || punchReview.isPending || remind.isPending;

  const data = today.data;
  const items = data?.actionItems ?? [];
  const outside = items.filter((i) => i.kind === "PUNCH_REVIEW");
  const missing = items.filter((i) => i.kind === "NOT_PUNCHED_PERIOD_SOON");
  const school = schools.data?.find((s) => s.id === schoolId)?.name ?? "Tất cả cơ sở";
  const updated = today.dataUpdatedAt ? formatTimeVi(new Date(today.dataUpdatedAt)) : "";

  const approve = (id: string, code: string) => decision.mutate({ id, decision: "approve", comment: "" }, { onSuccess: () => toast.success(`Đã duyệt đơn ${code}`), onError });
  const accept = (id: string) => punchReview.mutate({ id, decision: "ACCEPT", comment: "" }, { onSuccess: () => toast.success("Đã chấp nhận lượt chấm"), onError });
  const reject = (reason: string) => {
    if (!rejecting) return;
    const done = { onSuccess: () => { toast.success("Đã từ chối"); setRejecting(null); }, onError };
    if (rejecting.kind === "request") decision.mutate({ id: rejecting.id, decision: "reject", comment: reason }, done);
    else punchReview.mutate({ id: rejecting.id, decision: "REJECT", comment: reason }, done);
  };
  const remindUser = (item: ActionItem) =>
    remind.mutate([item.userId as string], { onSuccess: (r) => toast.success(`Đã nhắc ${r.sent ?? 0} người`), onError });

  let body: ReactNode;
  if (tab === "pending") {
    body = approvals.isError ? <ErgErrorState description="Không tải được danh sách đơn." title="Có lỗi xảy ra" /> : approvals.isPending ? <ErgSkeleton height={160} /> : (approvals.data?.items ?? []).length === 0 ? (
      <ErgEmptyState description="Không có đơn nào chờ bạn duyệt." title="Chưa có đơn" />
    ) : (
      (approvals.data?.items ?? []).map((item) => {
        const id = item.request?.id as string;
        return <ApprovalCard busy={busy} item={item} key={id} onApprove={() => approve(id, item.request?.code ?? "")} onDetail={() => go(`${APPROVALS}?id=${encodeURIComponent(id)}`)} onReject={() => setRejecting({ kind: "request", id, title: `Từ chối đơn ${item.request?.code ?? ""}`.trim() })} />;
      })
    );
  } else if (tab === "missing") {
    body = missing.length === 0 ? <ErgEmptyState description="Không có ai sắp vào tiết mà chưa chấm." title="Không có ai cần nhắc" /> : missing.map((item) => (
      <MissingCard busy={busy} item={item} key={item.targetId} onDetail={() => go(`/employees/timesheet${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""}`)} onRemind={() => remindUser(item)} />
    ));
  } else {
    body = outside.length === 0 ? <ErgEmptyState description="Không có lượt chấm nào cần duyệt." title="Không có lượt ngoài vùng" /> : outside.map((item) => (
      <OutOfZoneCard
        busy={busy}
        item={item}
        key={item.targetId}
        onAccept={() => accept(item.targetId as string)}
        onDetail={() => setReviewing(item)}
        onReject={() => setRejecting({ kind: "punch", id: item.targetId as string, title: `Từ chối lượt chấm của ${item.userName ?? ""}`.trim() })}
        punch={data?.recentPunches?.find((p) => p.id === item.targetId)}
      />
    ));
  }

  return (
    <Box sx={{ display: "grid", gap: 2, minWidth: 0, px: 2, py: 2 }}>
      <Box>
        <Typography component="h1" variant="h5">Chấm công · {school}</Typography>
        <Typography color="text.secondary" variant="body2">Hôm nay, {date.slice(8, 10)}/{date.slice(5, 7)}{updated ? ` · ${updated}` : ""}</Typography>
      </Box>
      <SchoolFilter allowAll onChange={(next) => update({ schoolId: next })} schools={schools.data ?? []} value={schoolId} />
      {today.isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void today.refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được dữ liệu chấm công." title="Có lỗi xảy ra" />
      ) : !data ? (
        <ErgSkeleton height={240} />
      ) : (
        <>
          <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, display: "flex", gap: 0.5, py: 1 }}>
            <Count label="Có mặt" value={data.present} />
            <Count label="Muộn" value={data.late} />
            <Count label="Chưa chấm" value={data.notPunched} />
            <Count label="Nghỉ" value={data.leave} />
          </Box>
          <Tabs aria-label="Việc cần xử lý" onChange={(_, next: Tab) => setTab(next)} scrollButtons={false} value={tab} variant="scrollable">
            <Tab label={`Chờ duyệt (${data.pendingRequests ?? 0})`} value="pending" />
            <Tab label={`Chưa chấm (${data.notPunched ?? 0})`} value="missing" />
            <Tab label={`Ngoài vùng (${outside.length})`} value="outside" />
          </Tabs>
          <Box sx={{ display: "grid", gap: 1.5 }}>{body}</Box>
          {tab === "missing" && missing.length < (data.notPunched ?? 0) ? (
            <Typography color="text.secondary" variant="caption">Chỉ hiện những người sắp vào tiết ({missing.length}/{data.notPunched}). Xem đủ ở bảng chấm công.</Typography>
          ) : null}
        </>
      )}
      {rejecting ? <RejectReasonDialog onClose={() => setRejecting(null)} onSubmit={reject} pending={decision.isPending || punchReview.isPending} title={rejecting.title} /> : null}
      {reviewing ? <PunchReviewDialog item={reviewing} onClose={() => setReviewing(null)} punch={data?.recentPunches?.find((p) => p.id === reviewing.targetId)} /> : null}
    </Box>
  );
}
