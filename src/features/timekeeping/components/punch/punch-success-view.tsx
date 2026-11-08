import AlarmIcon from "@mui/icons-material/Alarm";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CoPresentIcon from "@mui/icons-material/CoPresent";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useEffect, useRef } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { PunchResult } from "../../api/timekeeping-types";
import { CardRow, IconTile, PunchCard } from "./punch-card";
import { minutesVsShiftLabel } from "./punch-checks";
import { hhmm } from "./punch-format";

/** Minutes before the shift end at which the check-out reminder is sent. */
export const REMIND_BEFORE_END_MIN = 10;

const METHOD_LABEL: Record<string, string> = {
  GPS: "GPS",
  GPS_FACE: "Khuôn mặt + GPS",
  REMOTE: "Từ xa",
  REMOTE_FACE: "Từ xa + khuôn mặt",
};

function Item({ label, value }: { label: string; value: string }) {
  return (
    <CardRow>
      <Typography component="div" sx={{ display: "flex", gap: 1.5 }} variant="body2">
        <Typography color="text.secondary" component="span" sx={{ flexShrink: 0, width: 96 }} variant="body2">{label}</Typography>
        <Typography component="span" sx={{ minWidth: 0, overflowWrap: "anywhere" }} variant="subtitle2">{value}</Typography>
      </Typography>
    </CardRow>
  );
}

type PunchSuccessViewProps = {
  result: PunchResult;
  shiftName?: string;
  /** "HH:mm" of the check-out reminder, shown after a check-in. */
  reminderAt?: string;
  onDone: () => void;
  onNavigate: (href: string) => void;
};

/** G03: outcome of a punch. Lives inside /timekeeping/punch as a view state, never in the URL. */
export function PunchSuccessView({ result, shiftName, reminderAt, onDone, onNavigate }: PunchSuccessViewProps) {
  const punch = result.punch ?? {};
  const direction = punch.direction === "OUT" ? "OUT" : "IN";
  const review = result.verdict === "FLAGGED" || result.verdict === "PENDING_REVIEW";
  const title = review ? "Đã ghi nhận, chờ xem xét" : `Đã chấm ${direction === "IN" ? "vào" : "ra"} lúc ${hhmm(punch.serverTime)}`;
  const minutes = result.minutesVsShift;
  const timing = minutes === undefined ? "" : minutesVsShiftLabel(minutes, shiftName, direction);
  const onTime = minutes !== undefined && (direction === "IN" ? minutes <= 0 : minutes >= 0);
  const next = result.nextPeriod;
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const hasPhoto = Boolean(punch.method?.includes("FACE"));
  const tint = ergEnterpriseTokens.statusTint[review ? "warning" : "success"];

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 480, mx: "auto", px: { xs: 2, sm: 3 }, pb: 2, pt: { xs: 5, sm: 3 } }}>
      <Box sx={{ display: "grid", gap: 1.5, justifyItems: "center", textAlign: "center" }}>
        <Box aria-hidden sx={{ alignItems: "center", bgcolor: tint.bg, borderRadius: "50%", color: tint.dot, display: "flex", height: 96, justifyContent: "center", width: 96 }}>
          {review ? <HourglassTopIcon fontSize="large" /> : <CheckCircleIcon fontSize="large" />}
        </Box>
        <Typography component="h1" ref={headingRef} sx={{ outline: "none" }} tabIndex={-1} variant="h1">{title}</Typography>
        {review ? <Typography color="text.secondary" variant="body2">{punch.reason || result.messageVi}</Typography> : null}
        {timing ? <ErgStatusChip label={timing} tone={onTime ? "success" : "warning"} /> : null}
        {result.alreadyPunched ? <Typography color="text.secondary" variant="body2">{result.messageVi || "Bạn đã chấm vào trước đó."}</Typography> : null}
      </Box>
      <PunchCard sx={{ p: 0 }}>
        <Item label="Vị trí" value={punch.remote ? "Từ xa · không lưu vị trí" : `${punch.siteName ?? ""} · cách ${punch.distanceM ?? 0} m`} />
        <Item label="Xác thực" value={METHOD_LABEL[punch.method ?? ""] ?? punch.method ?? ""} />
        {hasPhoto ? <Item label="Ảnh" value="Lưu 60 ngày rồi tự xoá" /> : null}
        <Item label="Mã lượt" value={punch.code ?? ""} />
      </PunchCard>
      {next ? (
        <PunchCard sx={{ display: "grid", gap: 1.5 }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
            <IconTile><CoPresentIcon /></IconTile>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2">{[next.className, next.subject].filter(Boolean).join(" · ") || "Tiết dạy kế tiếp"}</Typography>
              <Typography color="text.secondary" variant="caption">
                {[next.start ? `Bắt đầu ${hhmm(next.start)}` : "", next.room ? `Phòng ${next.room}` : ""].filter(Boolean).join(" · ")}
              </Typography>
            </Box>
          </Box>
          <Button onClick={() => onNavigate(teacherPath("/attendance"))} startIcon={<HowToRegIcon />} variant="outlined">
            {next.className ? `Mở điểm danh lớp ${next.className}` : "Mở điểm danh"}
          </Button>
        </PunchCard>
      ) : null}
      {direction === "IN" && reminderAt ? (
        <PunchCard sx={{ alignItems: "center", display: "flex", gap: 1.5, px: 2, py: 1.5 }}>
          <AlarmIcon aria-hidden sx={{ color: "text.secondary" }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">Nhắc chấm ra</Typography>
            <Typography color="text.secondary" variant="caption">{`${reminderAt} · trước giờ ra ca ${REMIND_BEFORE_END_MIN} phút`}</Typography>
          </Box>
        </PunchCard>
      ) : null}
      <ErgButton fullWidth onClick={onDone} size="large" variant="contained">Xong</ErgButton>
    </Box>
  );
}
