import { ErgMetricStrip } from "@/components/erg-mui";

import type { CampaignSummary } from "../api/campaign-types";
import { formatCountVi } from "../model/campaign-form-schema";

const count = (value: number | undefined) => (value === undefined ? undefined : formatCountVi(value));

/** W1 KPIs of the sender's campaigns; "—" until the summary arrives. */
export function CampaignKpiRow({ summary }: { summary: CampaignSummary | undefined }) {
  return (
    <ErgMetricStrip
      items={[
        { label: "Đã gửi tháng này", value: count(summary?.sentThisMonth) },
        { label: "Tỉ lệ đã xem trung bình", value: summary?.avgViewedRate === undefined ? undefined : `${Math.round(summary.avgViewedRate * 100)}%` },
        {
          label: "Chưa xác nhận đã đọc",
          value: count(summary?.unackedTotal),
          hint: summary?.unackedCampaigns === undefined ? undefined : `ở ${formatCountVi(summary.unackedCampaigns)} thông báo bắt buộc xác nhận`,
        },
      ]}
    />
  );
}
