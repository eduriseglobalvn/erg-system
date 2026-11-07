import { ErgMetricStrip, type ErgMetricItem } from "@/components/erg-mui/erg-metric-card";
import type { TodayDashboard } from "../api/timekeeping-types";

/** A01 KPI strip. Counts shown as numbers with a plain-text hint, so nothing depends on colour. */
export function TodayKpiRow({ data }: { data: TodayDashboard }) {
  const items: ErgMetricItem[] = [
    { label: "Có mặt", value: data.present, hint: `/ ${data.total ?? 0}` },
    { label: "Đi muộn", value: data.late, hint: `Tổng ${data.lateMinutesTotal ?? 0} phút` },
    { label: "Chưa chấm", value: data.notPunched, hint: `${data.notPunchedWithPeriodSoon ?? 0} có tiết trong 30 phút` },
    { label: "Nghỉ có phép", value: data.leave },
    { label: "Công tác", value: data.business },
    { label: "Đơn chờ duyệt", value: data.pendingRequests, hint: `${data.overdueRequests ?? 0} quá hạn` },
  ];
  return <ErgMetricStrip items={items} />;
}
