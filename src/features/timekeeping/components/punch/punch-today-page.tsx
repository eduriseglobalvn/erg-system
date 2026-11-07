import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { useTimekeepingToday } from "../../api/timekeeping-query";
import type { TodayView } from "../../api/timekeeping-types";
import { useGeolocation, type GeoReading } from "../../hooks/use-geolocation";
import { useOnline } from "../../hooks/use-online";
import { useServerClock } from "../../hooks/use-server-clock";
import { useServerNow } from "../../hooks/use-server-now";
import { MonthStatsCard } from "../month-stats-card";
import { geoErrorDetail, nearestSite } from "./punch-checks";
import { hhmm, hms, weekdayDateVi } from "./punch-format";
import { TodaySummaryCard } from "./today-summary-card";

function shiftLine(today: TodayView) {
  const shift = today.shift;
  if (!shift) return "Hôm nay không có ca làm việc";
  const periods = today.periods?.length ?? 0;
  return `${shift.name ?? "Ca"} · ${hhmm(shift.start)} – ${hhmm(shift.end)} · ${periods} tiết dạy`;
}

function zoneLine(today: TodayView, geo: GeoReading | null, geoError: string | null) {
  if (geoError) return geoErrorDetail(geoError);
  if (!geo) return "Đang xác định vị trí…";
  const near = nearestSite(today.sites, geo);
  if (!near) return "Trường chưa có địa điểm chấm công";
  const inside = near.distanceM <= (near.site.radiusM ?? 0);
  return `${inside ? "Trong vùng" : "Ngoài vùng"} ${near.site.name ?? ""} · cách ${near.distanceM} m`;
}

/** Why the big button is disabled, or null when the teacher can punch. */
function blockedReason(today: TodayView | undefined, online: boolean): string | null {
  if (!online) return "Cần có mạng để chấm công";
  if (!today) return "Đang tải…";
  if (today.out) return "Hôm nay đã chấm ra";
  if (!today.shift) return "Hôm nay không có ca làm việc";
  if (today.periodLocked) return "Kỳ công đã chốt";
  return null;
}

/** G01: today's punch status and the entry to G02. */
export function PunchTodayPage() {
  const navigate = useNavigate();
  const online = useOnline();
  const clock = useServerClock();
  const serverNow = useServerNow(clock.now);
  const { data: today, isError, refetch } = useTimekeepingToday();
  const geo = useGeolocation();
  const requestGps = geo.request;
  const needsGps = Boolean(today) && !today?.remote;
  useEffect(() => {
    if (needsGps) requestGps();
  }, [needsGps, requestGps]);

  const go = (path: string) => void navigate({ href: teacherPath(path) });
  const blocked = blockedReason(today, online);
  const status = blocked && (today || !online) ? blocked : today && !today.remote ? zoneLine(today, geo.reading, geo.error) : "";
  const direction = today?.in ? "OUT" : "IN";

  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 480, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgPageHeader description={weekdayDateVi(serverNow)} title="Chấm công" />
      <Box sx={{ textAlign: "center" }}>
        <Typography component="p" sx={{ fontVariantNumeric: "tabular-nums" }} variant="h1">{clock.ready ? hms(serverNow) : "--:--:--"}</Typography>
        <Typography color="text.secondary" variant="body2">{today ? shiftLine(today) : "Đang tải ca làm việc…"}</Typography>
      </Box>
      {isError ? (
        <ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton>
      ) : (
        <Box sx={{ display: "grid", justifyItems: "center", gap: 1 }}>
          <ErgButton
            disabled={blocked !== null}
            onClick={() => go("/timekeeping/punch")}
            sx={{ borderRadius: "50%", height: 144, typography: "h5", width: 144 }}
            variant="contained"
          >
            {today?.out ? "Đã chấm ra" : direction === "IN" ? "Chấm vào" : "Chấm ra"}
          </ErgButton>
          <Typography color={online ? "text.secondary" : "error"} role="status" variant="body2">
            {status}
          </Typography>
          {today?.remote ? <ErgStatusChip label="Từ xa · không lưu vị trí" tone="info" /> : null}
        </Box>
      )}
      {today ? <TodaySummaryCard today={today} /> : null}
      <MonthStatsCard onCreateRequest={() => go("/timekeeping/requests")} onOpenTimesheet={() => go("/timekeeping/timesheet")} serverNow={serverNow} />
    </Box>
  );
}
