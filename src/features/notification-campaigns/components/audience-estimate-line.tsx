import Typography from "@mui/material/Typography";

import { useCampaignEstimate } from "../api/campaign-query";
import type { AudienceBreakdown, CampaignAudience } from "../api/campaign-types";

type ViewProps = { breakdown?: AudienceBreakdown; error?: unknown; loading?: boolean };

export function formatBreakdown(b: AudienceBreakdown): string {
  const parts = [
    `Ước tính ${b.total ?? 0} người nhận`,
    ...(b.teachers ? [`${b.teachers} GV`] : []),
    ...(b.students ? [`${b.students} HS`] : []),
    ...(b.staff ? [`${b.staff} NV`] : []),
    ...(b.picked ? [`${b.picked} chọn riêng`] : []),
  ];
  return parts.join(" · ") + (b.duplicatesMerged ? ` (trùng ${b.duplicatesMerged} đã gộp)` : "");
}

/** Presentational: the 422 "Tối đa 5.000 người nhận mỗi lần gửi" arrives as `error` and is shown as is. */
export function AudienceEstimateView({ breakdown, error, loading }: ViewProps) {
  const failed = Boolean(error);
  return (
    <div aria-live="polite" role={failed ? "alert" : "status"}>
      {failed ? (
        <Typography color="error" variant="body2">
          {error instanceof Error && error.message ? error.message : "Không ước tính được số người nhận."}
        </Typography>
      ) : breakdown ? (
        <Typography variant="body2">{formatBreakdown(breakdown)}</Typography>
      ) : (
        <Typography color="text.secondary" variant="body2">{loading ? "Đang ước tính…" : "Chọn người nhận để xem ước tính."}</Typography>
      )}
      <Typography color="text.secondary" variant="caption">Chỉ tính người có tài khoản.</Typography>
    </div>
  );
}

export function AudienceEstimateLine({ audience }: { audience: CampaignAudience }) {
  const { data, error, isFetching } = useCampaignEstimate(audience);
  return <AudienceEstimateView breakdown={data} error={error} loading={isFetching} />;
}
