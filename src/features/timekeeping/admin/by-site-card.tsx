import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { PunchCard } from "../components/punch/punch-card";
import type { TodayDashboard } from "../api/timekeeping-types";

/** "Theo cơ sở": present / total and late count per school, as text. */
export function BySiteCard({ sites }: { sites: NonNullable<TodayDashboard["bySite"]> }) {
  return (
    <PunchCard sx={{ p: 3 }}>
      <Typography component="h2" variant="subtitle1">Theo cơ sở</Typography>
      {sites.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">Chưa có cơ sở nào.</Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1, p: 0 }}>
          {sites.map((site) => (
            <Box component="li" key={site.schoolId} sx={{ alignItems: "baseline", borderTop: 1, borderColor: "divider", display: "flex", gap: 2, justifyContent: "space-between", py: 1 }}>
              <Typography variant="body2">{site.name}</Typography>
              <Typography color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }} variant="body2">
                {site.present ?? 0} / {site.total ?? 0} có mặt · {site.late ?? 0} muộn
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </PunchCard>
  );
}
