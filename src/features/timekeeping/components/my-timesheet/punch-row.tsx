import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import type { DayPunchView } from "../../api/timekeeping-types";
import { CardRow } from "../punch/punch-card";
import { hhmm } from "../punch/punch-format";

const METHOD_LABEL: Record<string, string> = {
  GPS: "GPS",
  GPS_FACE: "Khuôn mặt + GPS",
  REMOTE: "Từ xa",
  REMOTE_FACE: "Từ xa + khuôn mặt",
};

type PunchRowProps = { label: "Vào" | "Ra"; dayPunch?: DayPunchView; lateMinutes?: number; missing?: boolean; missingReason?: string };

/** One Vào/Ra row of G05; the selfie is a signed URL, or a note once the 60-day retention purged it (never a broken image). */
export function PunchRow({ label, dayPunch, lateMinutes, missing, missingReason }: PunchRowProps) {
  const punch = dayPunch?.punch;
  const time = hhmm(punch?.serverTime);
  const details = punch
    ? [punch.method ? (METHOD_LABEL[punch.method] ?? punch.method) : "", punch.siteName ?? "", punch.distanceM === undefined ? "" : `cách ${punch.distanceM} m`].filter(Boolean).join(" · ")
    : "";
  const Icon = label === "Vào" ? LoginIcon : LogoutIcon;
  const chip = !punch && missing
    ? <ErgStatusChip label="Thiếu" tone="error" />
    : punch && label === "Vào"
      ? lateMinutes ? <ErgStatusChip label={`Muộn ${lateMinutes} phút`} tone="warning" /> : <ErgStatusChip label="Đúng giờ" tone="success" />
      : null;
  return (
    <CardRow icon={<Icon color={punch ? "success" : missing ? "error" : "inherit"} />} sx={{ minHeight: 56 }} trailing={chip}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontVariantNumeric: "tabular-nums" }} variant="subtitle2">{`${label} ${time || "—"}`}</Typography>
          {details ? <Typography color="text.secondary" component="div" variant="caption">{details}</Typography> : null}
          {!punch && missing && missingReason ? <Typography color="text.secondary" component="div" variant="caption">{missingReason}</Typography> : null}
          {dayPunch?.photoPurged ? <Typography color="text.secondary" component="div" variant="caption">Ảnh đã xoá theo hạn lưu</Typography> : null}
        </Box>
        {!dayPunch?.photoPurged && dayPunch?.photoUrl ? (
          <Box alt={`Ảnh chấm ${label.toLowerCase()}`} component="img" loading="lazy" src={dayPunch.photoUrl} sx={{ borderRadius: 1, height: 40, objectFit: "cover", width: 40 }} />
        ) : null}
      </Box>
    </CardRow>
  );
}
