import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { formatDateVi, formatTimeVi } from "@/domain/formatters/format-date";
import type { ApprovalDetail } from "../../api/timekeeping-types";
import { ApprovalTimeline } from "../../components/requests/approval-timeline";
import { requestTimeText, requestTitle } from "../../components/requests/request-model";
import { unitsVi } from "../../components/my-timesheet/timesheet-summary";

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Typography component="div" sx={{ display: "flex", gap: 2, justifyContent: "space-between", py: 0.5 }} variant="body2">
      <span>{label}</span>
      <Typography component="span" sx={{ textAlign: "right" }} variant="subtitle2">{value}</Typography>
    </Typography>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Box component="section" sx={{ borderTop: 1, borderColor: "divider", mt: 2, pt: 2 }}>
      <Typography component="h3" sx={{ mb: 1 }} variant="subtitle2">{title}</Typography>
      {children}
    </Box>
  );
}

/** Request facts, affected periods (information only, D15), context of the month and the approval flow. */
export function ApprovalDetailBody({ detail }: { detail: ApprovalDetail }) {
  const request = detail.item?.request ?? {};
  const periods = detail.affectedPeriods ?? [];
  const teammates = detail.teammatesOnLeave ?? [];
  const context = detail.context;
  return (
    <>
      <Line label="Loại đơn" value={requestTitle(request)} />
      <Line label="Thời gian" value={requestTimeText(request)} />
      {request.type === "LEAVE" ? <Line label="Trừ phép" value={request.leaveKind === "ANNUAL" ? `${unitsVi(request.days)} ngày phép năm` : "Không trừ phép năm"} /> : null}
      {request.note ? <Line label="Lý do" value={request.note} /> : null}
      {periods.length ? (
        <Section title="Tiết bị ảnh hưởng">
          <Table aria-label="Tiết bị ảnh hưởng" size="small">
            <TableHead>
              <TableRow>{["Ngày", "Tiết", "Lớp"].map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow>
            </TableHead>
            <TableBody>
              {periods.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{formatDateVi(p.start)}</TableCell>
                  <TableCell>{[formatTimeVi(p.start), formatTimeVi(p.end)].filter(Boolean).join(" – ")}</TableCell>
                  <TableCell>{[p.className, p.subject].filter(Boolean).join(" · ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      ) : null}
      <Section title="Ngữ cảnh">
        {teammates.length ? (
          <Typography variant="body2">Cùng nghỉ: {teammates.map((t) => `${t.name} (${requestTimeText({ type: "LEAVE", fromDate: t.fromDate, toDate: t.toDate })})`).join(", ")}</Typography>
        ) : (
          <Typography color="text.secondary" variant="body2">Không có ai khác nghỉ cùng thời gian.</Typography>
        )}
        {context ? <Typography variant="body2">Trong tháng: {context.lateCount ?? 0} lần đi muộn, {context.approvedExplanations ?? 0} giải trình đã duyệt</Typography> : null}
      </Section>
      <Section title="Luồng duyệt">
        <ApprovalTimeline request={request} />
      </Section>
    </>
  );
}
