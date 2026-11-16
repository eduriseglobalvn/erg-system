import { useState } from "react";
import Box from "@mui/material/Box";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { todayInput } from "@/domain/formatters/format-date";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";
import { getAuthScope } from "@/platform/auth/api/auth-storage";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import { useTimekeepingSchools } from "../../api/timekeeping-admin-query";
import { monthLabel } from "../../components/my-timesheet/timesheet-summary";
import { timekeepingTeachingApi } from "../../api/timekeeping-teaching-api";
import { useTeachingMonthSheet, useTeachingPeriods } from "../api/teaching-hours-query";
import { exportTeachingExcel } from "../domain/teaching-excel";
import { monthRange, yearMonths, yearRange } from "../domain/teaching-model";
import { MonthCloseButton, MonthStatusStrip } from "./month-close-card";
import { MonthSheet } from "./month-sheet";
import { SheetTabs } from "./sheet-tabs";
import { RoleSwitch, TeachingToolbar } from "./teaching-toolbar";
import { TotalSheet } from "./total-sheet";
import { useTeachingSearch } from "./use-teaching-search";

/** Closing a month is `timekeeping.manage` (HR); the page itself is `timekeeping.approve`. */
function canCloseMonth(): boolean {
  if (AUTH_BYPASS_ENABLED) return true;
  const session = getAuthScope("lcms").session;
  return evaluatePermission({ permission: "timekeeping.manage", grantedPermissions: session?.permissions ?? [], deniedPermissions: session?.deniedPermissions ?? [] });
}

const noPrint = { "@media print": { display: "none" } } as const;
const bar = { borderColor: "divider", fontWeight: "fontWeightMedium", px: 2 } as const;

/** «Công tiết dạy» (Main board = Total, CongThang boards = month sheets): one page, one card, sheet tabs at the foot, `?sheet=total|yyyy-MM`. */
export function TeachingHoursPage() {
  const { search, update } = useTeachingSearch();
  const today = todayInput();
  const schools = useTimekeepingSchools();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const isTotal = search.sheet === "total";
  const months = yearMonths(search.year, today);
  const range = search.month ? monthRange(search.month) : yearRange(search.year);
  const periods = useTeachingPeriods({ role: search.role, ...range, schoolId: search.schoolId, teacherId: search.teacherId, q: debouncedQ || undefined, page }, isTotal);
  const month = useTeachingMonthSheet(isTotal ? "" : search.sheet, search.role, !isTotal);
  // Teacher options come from the latest month sheet of the year (no separate teacher list endpoint).
  const roster = useTeachingMonthSheet(months.at(-1) ?? "", search.role, isTotal && months.length > 0);
  const teachers = [...new Map((roster.data?.rows ?? []).filter((r) => r.teacherId).map((r) => [r.teacherId as string, r.teacherName ?? ""])).entries()].map(([value, label]) => ({ label, value }));
  if (search.teacherId && !teachers.some((x) => x.value === search.teacherId)) teachers.push({ label: "Giáo viên đã chọn", value: search.teacherId });
  const active = isTotal ? periods : month;
  const years = [Number(today.slice(0, 4)) - 1, Number(today.slice(0, 4))].filter((y) => y >= 2025);

  const [exporting, setExporting] = useState(false);
  const runExport = async () => {
    setExporting(true);
    await exportTeachingExcel(() => timekeepingTeachingApi.adminExport(search.year), search.year);
    setExporting(false);
  };
  const change = (patch: Parameters<typeof update>[0]) => { setPage(0); update(patch); };
  const title = isTotal ? (search.role === "ASSISTANT" ? "Bảng chi tiết TKB trợ giảng" : "Bảng chi tiết TKB giáo viên") : `Thống kê số tiết · ${monthLabel(search.sheet)}`;
  const description = isTotal
    ? "Mỗi dòng là 1 tiết đã dạy, tự lấy từ lịch dạy. Cột «Nội dung giảng dạy» lấy từ sổ đầu bài: bài tra KCT theo tiết thực tế GV ghi."
    : "Số tiết mỗi tuần cộng từ bảng Total. Giáo viên xem và bấm xác nhận thay cho ký giấy.";
  const count = periods.data ? `${periods.data.rows?.length ?? 0} / ${(periods.data.total ?? 0).toLocaleString("vi-VN")} tiết` : "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, px: { xs: 2, md: 1 }, py: 1 }}>
      <Box sx={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 0.5, minWidth: 240 }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ ...t.type.note, color: "text.secondary", ...noPrint }}>Chấm công / Công tiết dạy</Box>
          <Box component="h1" sx={{ color: "text.primary", m: 0, typography: "h1" }}>{title}</Box>
          <Box component="span" sx={{ ...t.type.small, color: "text.secondary" }}>{description}</Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, ...noPrint }}>
          <ErgButton onClick={() => window.print()} sx={bar} variant="outlined">{isTotal ? "In" : "In bảng ký"}</ErgButton>
          {isTotal ? (
            <ErgButton loading={exporting} onClick={() => void runExport()} sx={{ px: "18px" }} variant="contained">Xuất Excel (Total + từng tháng)</ErgButton>
          ) : (
            month.data ? <MonthCloseButton canClose={canCloseMonth()} data={month.data} month={search.sheet} /> : null
          )}
        </Box>
      </Box>
      <Box component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {isTotal ? (
          <TeachingToolbar
            count={count}
            months={months}
            onChange={change}
            onQuery={(value) => { setQ(value); setPage(0); }}
            q={q}
            schools={(schools.data ?? []).map((s) => ({ label: s.name, value: s.id }))}
            search={search}
            teachers={teachers}
            years={years}
          />
        ) : month.data ? <MonthStatusStrip data={month.data} leading={<RoleSwitch onChange={(role) => change({ role })} value={search.role} />} month={search.sheet} /> : null}
        {active.isError ? (
          <Box sx={{ p: 2 }}><ErgErrorState action={<ErgButton onClick={() => void active.refetch()} variant="outlined">Thử lại</ErgButton>} description="Không tải được dữ liệu." title="Có lỗi xảy ra" /></Box>
        ) : isTotal && periods.data ? (
          (periods.data.rows ?? []).length === 0 ? <ErgEmptyState description="Thử đổi bộ lọc hoặc từ khoá." title="Không có tiết nào" /> : <TotalSheet data={periods.data} onPage={setPage} role={search.role} />
        ) : !isTotal && month.data ? (
          <MonthSheet data={month.data} month={search.sheet} onOpenTeacher={(teacherId) => change({ sheet: "total", teacherId, month: search.sheet, year: Number(search.sheet.slice(0, 4)) })} role={search.role} />
        ) : (
          <Box sx={{ p: 2 }}><ErgSkeleton height={360} /></Box>
        )}
        <SheetTabs months={months} onChange={(sheet) => change({ sheet })} value={search.sheet} />
      </Box>
    </Box>
  );
}
