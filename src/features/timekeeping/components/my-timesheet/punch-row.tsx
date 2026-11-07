import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import type { DayPunchView } from "../../api/timekeeping-types";
import { hhmm } from "../punch/punch-format";

const METHOD_LABEL: Record<string, string> = {
  GPS: "GPS",
  GPS_FACE: "GPS + khuôn mặt",
  REMOTE: "Từ xa",
  REMOTE_FACE: "Từ xa + khuôn mặt",
};

type PunchRowProps = { label: string; dayPunch?: DayPunchView; lateMinutes?: number; missing?: boolean; missingReason?: string };

/** One Vào/Ra row of G05; the selfie is a signed URL, or a note once the 60-day retention purged it (never a broken image). */
export function PunchRow({ label, dayPunch, lateMinutes, missing, missingReason }: PunchRowProps) {
  const punch = dayPunch?.punch;
  const time = hhmm(punch?.serverTime);
  const details = punch
    ? [
        punch.method ? (METHOD_LABEL[punch.method] ?? punch.method) : "",
        punch.siteName ?? "",
        punch.distanceM === undefined ? "" : `cách ${punch.distanceM} m`,
        label === "Vào" && !lateMinutes ? "Đúng giờ" : "",
      ].filter(Boolean).join(" · ")
    : "";
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, py: 1 }}>
      <Typography sx={{ width: 40 }} variant="body2">{label}</Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontVariantNumeric: "tabular-nums" }} variant="subtitle1">{time || "—"}</Typography>
        {details ? <Typography color="text.secondary" variant="caption">{details}</Typography> : null}
        {!punch && missing && missingReason ? <Typography color="text.secondary" variant="caption">{missingReason}</Typography> : null}
        {dayPunch?.photoPurged ? <Typography color="text.secondary" component="div" variant="caption">Ảnh đã xoá theo hạn lưu</Typography> : null}
      </Box>
      {!dayPunch?.photoPurged && dayPunch?.photoUrl ? (
        <Box alt={`Ảnh chấm ${label.toLowerCase()}`} component="img" loading="lazy" src={dayPunch.photoUrl} sx={{ borderRadius: 1, height: 48, objectFit: "cover", width: 48 }} />
      ) : null}
    </Box>
  );
}
