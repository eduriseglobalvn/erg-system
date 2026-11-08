import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import { todayInput } from "@/domain/formatters/format-date";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
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

function Summary({ title, value, caption }: { title: string; value: string | null; caption: string }) {
  return (
    <Box sx={{ minWidth: 0, px: 1.75, py: 1.5 }}>
      <Typography color="text.secondary" component="div" variant="caption">{title}</Typography>
      {value === null ? <ErgSkeleton height={28} /> : <Typography component="div" sx={{ fontVariantNumeric: "tabular-nums" }} variant="h4">{value}</Typography>}
      <Typography color="text.secondary" component="div" variant="caption">{caption}</Typography>
    </Box>
  );
}

/** G06: leave and explanation balances, status filter and the teacher's requests. */
export function MyRequestsPage() {
  const nav = useRequestsNav();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("ALL");
  const today = todayInput();
  const month = useTimekeepingMonth(periodOf(new Date()));
  const explanation = useExplanationContext(today);
  const list = useMyRequests(filter === "ALL" ? undefined : filter);
  const items = list.data?.items ?? [];
  const remaining = explanation.data?.remaining;

  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, mx: -1 }}>
        <ErgIconButton label="Quay lại" onClick={() => void navigate({ href: teacherPath("/timekeeping") })}><ArrowBackIcon /></ErgIconButton>
        <Typography component="h1" sx={{ flex: 1, minWidth: 0 }} variant="h4">Đơn từ</Typography>
      </Box>
      <PunchCard sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", p: 0, "& > * + *": { borderLeft: 1, borderColor: "divider" } }}>
        <Summary
          caption={`Còn trong năm ${today.slice(0, 4)}`}
          title="Phép năm"
          value={month.data ? `${unitsVi(month.data.annualLeaveRemaining)} ngày` : month.isError ? "—" : null}
        />
        <Summary
          caption={`Còn trong T${today.slice(5, 7)}`}
          title="Giải trình"
          value={remaining !== undefined ? `${remaining} / ${MONTHLY_LIMIT} lượt` : explanation.isError ? "—" : null}
        />
      </PunchCard>
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
      <ErgButton
        onClick={() => nav.toPicker()}
        size="large"
        startIcon={<AddIcon />}
        sx={{ borderRadius: `${ergEnterpriseTokens.radius.chip}px`, bottom: ergMobileDockAnchor(16), boxShadow: ergEnterpriseTokens.shadow.float, justifySelf: "end", position: "sticky", zIndex: 4 }}
        variant="contained"
      >
        Tạo đơn
      </ErgButton>
    </Box>
  );
}
