import CalendarViewMonthIcon from "@mui/icons-material/CalendarViewMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ergMobileDockClearance } from "@/components/portal/erg-mobile-dock";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { useTimekeepingToday } from "../../api/timekeeping-query";
import type { TodayView } from "../../api/timekeeping-types";
import { useGeolocation, type GeoReading } from "../../hooks/use-geolocation";
import { useOnline } from "../../hooks/use-online";
import { useServerClock } from "../../hooks/use-server-clock";
import { useServerNow } from "../../hooks/use-server-now";
import { MonthStatsCard } from "../month-stats-card";
import { PunchCard, type TkTone } from "./punch-card";
import { geoErrorDetail, nearestSite } from "./punch-checks";
import { hhmm, hms, weekdayDateVi } from "./punch-format";
import { TodaySummaryCard } from "./today-summary-card";

function shiftLine(today: TodayView) {
  const shift = today.shift;
  if (!shift) return "Hôm nay không có ca làm việc";
  const periods = today.periods?.length ?? 0;
  return `${shift.name ?? "Ca"} · ${hhmm(shift.start)} – ${hhmm(shift.end)} · ${periods} tiết dạy`;
}

function zoneStatus(today: TodayView, geo: GeoReading | null, geoError: string | null): { text: string; tone: TkTone } {
  if (geoError) return { text: geoErrorDetail(geoError), tone: "error" };
  if (!geo) return { text: "Đang xác định vị trí…", tone: "neutral" };
  const near = nearestSite(today.sites, geo);
  if (!near) return { text: "Trường chưa có địa điểm chấm công", tone: "warning" };
  const inside = near.distanceM <= (near.site.radiusM ?? 0);
  return { text: `${inside ? "Trong vùng" : "Ngoài vùng"} ${near.site.name ?? ""} · cách ${near.distanceM} m`, tone: inside ? "success" : "warning" };
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

/** Tinted status line under the punch button (canvas: green "Trong vùng …" row). */
function StatusLine({ text, tone }: { text: string; tone: TkTone }) {
  const tint = ergEnterpriseTokens.statusTint[tone];
  return (
    <Box sx={{ alignItems: "center", bgcolor: tint.bg, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: tint.color, display: "flex", gap: 1, px: 1.5, py: 1, width: "100%" }}>
      <LocationOnIcon aria-hidden fontSize="small" sx={{ color: tint.dot }} />
      <Typography role="status" sx={{ flex: 1, minWidth: 0 }} variant="body2">{text}</Typography>
      {tone === "success" ? <CheckCircleIcon aria-hidden fontSize="small" sx={{ color: tint.dot }} /> : null}
    </Box>
  );
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
  const status = blocked && (today || !online)
    ? { text: blocked, tone: (online ? "neutral" : "error") as TkTone }
    : today && !today.remote ? zoneStatus(today, geo.reading, geo.error) : null;
  const direction = today?.in ? "OUT" : "IN";
  const time = clock.ready ? hms(serverNow) : "--:--:--";
  const { color, radius } = ergEnterpriseTokens;

  return (
    <Box sx={{ display: "grid", gap: 1.75, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 480, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
        <Typography component="h1" sx={{ flex: 1 }} variant="h1">Chấm công</Typography>
        <ErgIconButton label="Bảng công của tôi" onClick={() => go("/timekeeping/timesheet")} sx={{ border: 1, borderColor: "divider" }}>
          <CalendarViewMonthIcon />
        </ErgIconButton>
      </Box>
      <PunchCard sx={{ alignItems: "center", display: "grid", gap: 1.75, justifyItems: "center", px: 2, py: 2.5 }}>
        <Box sx={{ display: "grid", justifyItems: "center" }}>
          <Typography color="text.secondary" variant="caption">{weekdayDateVi(serverNow)}</Typography>
          <Typography component="p" sx={{ fontVariantNumeric: "tabular-nums" }} variant="h1">
            {time.slice(0, 5)}
            <Box component="span" sx={{ color: "text.secondary" }}>{time.slice(5)}</Box>
          </Typography>
          <ErgStatusChip dot={false} label={today ? shiftLine(today) : "Đang tải ca làm việc…"} sx={{ mt: 0.5 }} tone="info" />
        </Box>
        {isError ? (
          <ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton>
        ) : (
          <ErgButton
            disabled={blocked !== null}
            onClick={() => go("/timekeeping/punch")}
            sx={{ border: `10px solid ${color.primarySofter}`, borderRadius: `${radius.chip}px`, flexDirection: "column", gap: 0.75, height: 156, typography: "h5", width: 156, "&.Mui-disabled": { borderColor: "action.hover" } }}
            variant="contained"
          >
            <FingerprintIcon aria-hidden fontSize="large" />
            {today?.out ? "Đã chấm ra" : direction === "IN" ? "Chấm vào" : "Chấm ra"}
          </ErgButton>
        )}
        {status ? <StatusLine text={status.text} tone={status.tone} /> : null}
        {today?.remote ? <ErgStatusChip label="Từ xa · không lưu vị trí" tone="info" /> : null}
      </PunchCard>
      {today ? <TodaySummaryCard today={today} /> : null}
      <MonthStatsCard onOpenTimesheet={() => go("/timekeeping/timesheet")} serverNow={serverNow} />
      <ErgButton
        onClick={() => go("/timekeeping/requests?new=")}
        startIcon={<EditDocumentIcon />}
        sx={{ bgcolor: "background.paper", borderRadius: `${radius.chip}px`, bottom: ergMobileDockClearance(16), boxShadow: ergEnterpriseTokens.shadow.float, justifySelf: "end", position: "sticky", zIndex: 4 }}
        variant="outlined"
      >
        Tạo đơn
      </ErgButton>
    </Box>
  );
}
