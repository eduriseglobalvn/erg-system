import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { todayInput } from "@/domain/formatters/format-date";
import { useExplanationContext, useMyRequests } from "../../api/timekeeping-request-query";
import { useTimekeepingMonth } from "../../api/timekeeping-query";
import { unitsVi } from "../my-timesheet/timesheet-summary";
import { PunchCard } from "../punch/punch-card";
import { periodOf } from "../punch/punch-format";
import { ChipChoice } from "./chip-choice";
import { RequestListItem } from "./request-list-item";
import { useRequestsNav } from "./use-requests-nav";

const FILTERS = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];
const MONTHLY_LIMIT = 3;

function SummaryCard({ title, value, caption }: { title: string; value: string | null; caption: string }) {
  return (
    <PunchCard>
      <Typography color="text.secondary" variant="caption">{title}</Typography>
      {value === null ? <ErgSkeleton height={28} /> : <Typography sx={{ fontVariantNumeric: "tabular-nums" }} variant="h6">{value}</Typography>}
      <Typography color="text.secondary" variant="caption">{caption}</Typography>
    </PunchCard>
  );
}

/** G06: leave and explanation balances, status filter and the teacher's requests. */
export function MyRequestsPage() {
  const nav = useRequestsNav();
  const [filter, setFilter] = useState<Filter>("ALL");
  const today = todayInput();
  const month = useTimekeepingMonth(periodOf(new Date()));
  const explanation = useExplanationContext(today);
  const list = useMyRequests(filter === "ALL" ? undefined : filter);
  const items = list.data?.items ?? [];
  const remaining = explanation.data?.remaining;

  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgPageHeader
        description="Nghỉ phép, giải trình, làm việc tại nhà và công tác."
        primaryAction={<ErgButton onClick={() => nav.toPicker()} startIcon={<AddIcon />} variant="contained">Tạo đơn</ErgButton>}
        title="Đơn từ của tôi"
      />
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
        <SummaryCard
          caption={`Còn trong năm ${today.slice(0, 4)}`}
          title="Phép năm"
          value={month.data ? `${unitsVi(month.data.annualLeaveRemaining)} ngày` : month.isError ? "—" : null}
        />
        <SummaryCard
          caption={`Còn trong T${today.slice(5, 7)}`}
          title="Giải trình"
          value={remaining !== undefined ? `${remaining} / ${MONTHLY_LIMIT} lượt` : explanation.isError ? "—" : null}
        />
      </Box>
      <ChipChoice hideLabel label="Lọc đơn theo trạng thái" onChange={setFilter} options={FILTERS} value={filter} />
      {list.isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void list.refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được danh sách đơn." title="Có lỗi xảy ra" />
      ) : list.isLoading ? (
        <ErgSkeleton height={240} />
      ) : items.length === 0 ? (
        <ErgEmptyState description={filter === "ALL" ? "Bấm Tạo đơn để gửi đơn đầu tiên." : "Không có đơn nào ở trạng thái này."} title="Chưa có đơn nào" />
      ) : (
        <Box component="ul" sx={{ display: "grid", gap: 1.5, listStyle: "none", m: 0, p: 0 }}>
          {items.map((request) => (
            <li key={request.id}>
              <RequestListItem onOpen={(id) => nav.toDetail(id)} request={request} />
            </li>
          ))}
        </Box>
      )}
    </Box>
  );
}
