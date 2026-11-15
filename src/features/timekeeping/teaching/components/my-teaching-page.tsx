import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateViHcm, todayInput } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { monthLabel, shiftPeriod } from "../../components/my-timesheet/timesheet-summary";
import { periodOf } from "../../components/punch/punch-format";
import type { MyTeachingMonth } from "../../api/timekeeping-teaching-api";
import { useMyTeachingMonth } from "../api/teaching-hours-query";
import { dayMonthVi, hasTeaching, myMonthState, type MyMonthState } from "../domain/teaching-model";
import { MissingReportCard } from "./missing-report-card";
import { MyCongTabs } from "./my-cong-tabs";
import { MyPeriodsList } from "./my-periods-list";
import { MyTeachingConfirmCard } from "./my-teaching-confirm-card";
import { WeekList, WeekMatrix } from "./my-teaching-tables";

const bordered = { border: 1, borderColor: "divider" } as const;

function banner(state: MyMonthState, data: MyTeachingMonth, month: string): { tone: "info" | "warning" | "success" | "neutral"; title: string; hint: string } {
  const m = month.slice(5);
  if (state === "AWAITING") return { tone: "warning", title: `Bảng công tháng ${m} đang chờ bạn xác nhận · hạn ${dayMonthVi(data.deadline)}`, hint: "Kiểm tra số tiết. Sai thì bấm «Báo sai sót» để trưởng phòng đào tạo sửa lịch; không sửa số tay." };
  if (state === "ISSUE") return { tone: "warning", title: `Bạn đã báo sai sót tháng ${m}`, hint: "Chờ trưởng phòng đào tạo sửa lịch. Số tiết đổi thì bạn xác nhận lại." };
  if (state === "CONFIRMED") return { tone: "success", title: `Bạn đã xác nhận bảng công tháng ${m}`, hint: "Chờ HR chốt tháng." };
  if (state === "CLOSED") return { tone: "neutral", title: `Đã chốt${data.closedAt ? ` ${formatDateViHcm(data.closedAt)}` : ""} · HR đã gửi tính lương`, hint: "" };
  return { tone: "info", title: `Tháng ${m} chưa kết thúc`, hint: "Số tiết tự tính từ lịch dạy đã xuất bản và còn thay đổi." };
}

/** «Công của tôi» · tab «Tiết dạy» (6.3 desktop, 6.4 phone): the month's periods, what is missing a report, confirm or report an issue. */
export function MyTeachingPage({ period }: { period: string }) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"), { noSsr: true });
  const { data, isLoading, isError, refetch } = useMyTeachingMonth(period);
  const setPeriod = (next: string) => void navigate({ href: teacherPath(`/timekeeping/timesheet?tab=periods&period=${next}`), replace: true });
  const state = data ? myMonthState(data, period, todayInput()) : "COLLECTING";
  const head = data ? banner(state, data, period) : null;
  const missing = data?.missingReports ?? [];
  const cancelled = data?.cancelled ?? [];

  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 1100, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography component="h1" variant="h4">Công của tôi</Typography>
          <Typography color="text.secondary" variant="body2">Ngày công từ chấm công, tiết dạy từ lịch dạy đã xuất bản</Typography>
        </Box>
        {isMobile ? null : <ErgButton onClick={() => window.print()} variant="outlined">Tải PDF</ErgButton>}
      </Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <ErgIconButton label="Tháng trước" onClick={() => setPeriod(shiftPeriod(period, -1))} sx={bordered}><ChevronLeftIcon /></ErgIconButton>
        <Typography component="div" variant="subtitle1">{monthLabel(period)}</Typography>
        <ErgIconButton disabled={period >= periodOf(new Date())} label="Tháng sau" onClick={() => setPeriod(shiftPeriod(period, 1))} sx={bordered}><ChevronRightIcon /></ErgIconButton>
      </Box>
      <MyCongTabs period={period} tab="periods" />
      {isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Thử lại</ErgButton>} description="Không tải được dữ liệu." title="Có lỗi xảy ra" />
      ) : isLoading || !data ? (
        <ErgSkeleton height={320} />
      ) : !hasTeaching(data) ? (
        <ErgEmptyState description="Tháng này bạn không có tiết nào theo thời khoá biểu." title="Chưa có tiết dạy" />
      ) : (
        <>
          {head ? (
            <Box sx={{ bgcolor: t.statusTint.warning.bg, borderRadius: `${t.radius.card}px`, color: t.statusTint.warning.color, p: 1.5 }}>
              <Typography component="div" variant="subtitle2">{head.title}</Typography>
              {head.hint ? <Typography component="div" variant="caption">{head.hint}</Typography> : null}
            </Box>
          ) : null}
          {isMobile ? null : (
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <Stat label="Tổng tiết tính công" sub={`tháng ${period.slice(5)}`} value={String(data.total ?? 0)} />
              <Stat label="Lớp dạy" sub={(data.rows ?? []).map((r) => r.className).join(", ")} value={String((data.rows ?? []).length)} />
            </Box>
          )}
          <Box sx={{ alignItems: "start", display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 380px" } }}>
          {isMobile ? (
            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography component="div" variant="subtitle1">Tổng tiết tính công {data.total ?? 0}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                <ErgStatusChip label={`${data.rows?.length ?? 0} lớp`} tone="info" />
                {missing.length ? <ErgStatusChip label={`${missing.reduce((s, m) => s + (m.periodCount ?? 0), 0)} chưa báo giảng`} tone="warning" /> : null}
                {cancelled.length ? <ErgStatusChip label={`${cancelled.length} buổi huỷ`} tone="neutral" /> : null}
              </Box>
              <WeekList data={data} />
            </Box>
          ) : (
            <WeekMatrix data={data} rows={data.rows ?? []} title="Theo tuần và lớp" />
          )}
          <Box sx={{ display: "grid", gap: 1.5, gridColumn: { md: 2 }, gridRow: { md: "1 / span 2" } }}>
            <MissingReportCard missing={missing} />
            <MyTeachingConfirmCard data={data} month={period} state={state} />
          </Box>
          <Box sx={{ gridColumn: { md: 1 } }}><MyPeriodsList closed={state === "CLOSED"} month={period} /></Box>
          {data.assistantRows?.length ? <WeekMatrix data={data} rows={data.assistantRows} showCancelled={false} title="Tiết trợ giảng" /> : null}
          </Box>
        </>
      )}
    </Box>
  );
}

function Stat({ label, sub, value }: { label: string; sub: string; value: string }) {
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, p: 2 }}>
      <Typography color="text.secondary" component="div" variant="caption">{label}</Typography>
      <Typography component="div" sx={{ fontVariantNumeric: "tabular-nums" }} variant="h5">{value}</Typography>
      <Typography color="text.secondary" component="div" variant="caption">{sub}</Typography>
    </Box>
  );
}
