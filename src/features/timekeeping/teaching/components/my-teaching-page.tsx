import { useState } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { todayInput } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import type { MyTeachingMonth } from "../../api/timekeeping-teaching-api";
import { useMyTeachingMonth } from "../api/teaching-hours-query";
import { myBanner } from "../domain/teaching-copy";
import { hasTeaching, myMonthState, schoolCount } from "../domain/teaching-model";
import { MissingReportCard, MissingReportStrips } from "./missing-report-card";
import { MyCongTabs } from "./my-cong-tabs";
import { MyPeriodsList } from "./my-periods-list";
import { MyTeachingBanner } from "./my-teaching-banner";
import { MyTeachingConfirmCard } from "./my-teaching-confirm-card";
import { MyTeachingHeader } from "./my-teaching-header";
import { WeekList, WeekMatrix } from "./my-teaching-tables";

const card = { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px` } as const;
const muted = { ...t.type.note, color: "text.secondary" } as const;

function Stat({ label, sub, value }: { label: string; sub: string; value: string }) {
  return (
    <Box sx={{ ...card, display: "flex", flexDirection: "column", gap: 0.5, px: 2, py: "14px" }}>
      <Box component="span" sx={muted}>{label}</Box>
      <Box component="strong" sx={{ fontVariantNumeric: "tabular-nums", typography: "h1" }}>{value}</Box>
      <Box component="span" sx={muted}>{sub}</Box>
    </Box>
  );
}

/** Phone 6.4 summary: big total, the school line and the counts as three plain lines on the right. */
function MobileTotal({ data, missingPeriods }: { data: MyTeachingMonth; missingPeriods: number }) {
  const rows = data.rows ?? [];
  const first = rows[0];
  return (
    <Box sx={{ ...card, alignItems: "center", display: "flex", gap: 1.5, p: "14px" }}>
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
        <Box component="span" sx={muted}>Tổng tiết tính công</Box>
        <Box component="strong" sx={{ fontSize: "2rem", fontWeight: t.type.label.fontWeight, lineHeight: 1.2 }}>{data.total ?? 0}</Box>
        <Box component="span" sx={muted}>{[first?.schoolName, first?.subjectName, first?.level].filter(Boolean).join(" · ")}</Box>
      </Box>
      <Box sx={{ ...muted, color: "text.primary", display: "flex", flexDirection: "column", gap: 0.5, textAlign: "right" }}>
        <span>{rows.length} lớp</span>
        {missingPeriods ? <Box component="span" sx={{ color: t.color.brandRed, fontWeight: t.type.label.fontWeight }}>{missingPeriods} chưa báo giảng</Box> : null}
        {data.cancelled?.length ? <Box component="span" sx={{ color: "text.secondary" }}>{data.cancelled.length} buổi huỷ</Box> : null}
      </Box>
    </Box>
  );
}

/** «Công của tôi» · tab «Tiết dạy» (6.3 desktop, 6.4 phone): the month's periods, what is missing a report, confirm or report an issue. */
export function MyTeachingPage({ period }: { period: string }) {
  const navigate = useNavigate();
  const mobile = useMediaQuery(useTheme().breakpoints.down("md"), { noSsr: true });
  const { data, isLoading, isError, refetch } = useMyTeachingMonth(period);
  const [showPeriods, setShowPeriods] = useState(false);
  const setPeriod = (next: string) => void navigate({ href: teacherPath(`/timekeeping/timesheet?tab=periods&period=${next}`), replace: true });
  const state = data ? myMonthState(data, period, todayInput()) : "COLLECTING";
  const missing = data?.missingReports ?? [];
  const rows = data?.rows ?? [];
  const missingPeriods = missing.reduce((sum, m) => sum + (m.periodCount ?? 0), 0);
  const periodsLink = (
    <Link component="button" onClick={() => setShowPeriods((v) => !v)} sx={{ font: "inherit", textDecoration: "none", verticalAlign: "baseline" }} type="button">
      {showPeriods ? "Ẩn danh sách tiết" : "Xem từng tiết ›"}
    </Link>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: mobile ? "10px" : 1.75, px: { xs: 2, md: 1 }, py: { xs: 1.5, md: 1 } }}>
      <MyTeachingHeader mobile={mobile} onPeriod={setPeriod} period={period} />
      <MyCongTabs mobile={mobile} period={period} tab="periods" />
      {isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Thử lại</ErgButton>} description="Không tải được dữ liệu." title="Có lỗi xảy ra" />
      ) : isLoading || !data ? (
        <ErgSkeleton height={320} />
      ) : !hasTeaching(data) ? (
        <ErgEmptyState description="Tháng này bạn không có tiết nào theo thời khoá biểu." title="Chưa có tiết dạy" />
      ) : (
        <>
          <MyTeachingBanner banner={myBanner(state, data, period, mobile)} mobile={mobile} />
          {mobile ? (
            <>
              <MobileTotal data={data} missingPeriods={missingPeriods} />
              <WeekList data={data} />
              <MissingReportStrips missing={missing} />
              {data.assistantRows?.length ? <WeekMatrix data={data} rows={data.assistantRows} showCancelled={false} title="Tiết trợ giảng" /> : null}
              <MyTeachingConfirmCard data={data} mobile month={period} state={state} />
            </>
          ) : (
            <>
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <Stat label="Tổng tiết tính công" sub={`tháng ${period.slice(5)} · ${schoolCount(rows)} trường`} value={String(data.total ?? 0)} />
                <Stat label="Lớp dạy" sub={rows.map((r) => r.className).join(", ")} value={String(rows.length)} />
              </Box>
              <Box sx={{ alignItems: "stretch", display: "grid", gap: 1.75, gridTemplateColumns: "minmax(0, 1fr) 380px" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, minWidth: 0 }}>
                  <WeekMatrix data={data} footer={periodsLink} rows={rows} title="Theo tuần và lớp" />
                  <MyPeriodsList closed={state === "CLOSED"} month={period} open={showPeriods} />
                  {data.assistantRows?.length ? <WeekMatrix data={data} rows={data.assistantRows} showCancelled={false} title="Tiết trợ giảng" /> : null}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
                  <MissingReportCard missing={missing} />
                  <MyTeachingConfirmCard data={data} mobile={false} month={period} state={state} />
                </Box>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}
