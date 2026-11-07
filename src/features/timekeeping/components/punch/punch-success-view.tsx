import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useEffect, useRef } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import type { PunchResult } from "../../api/timekeeping-types";
import { PunchCard } from "./punch-card";
import { minutesVsShiftLabel } from "./punch-checks";
import { hhmm } from "./punch-format";

const METHOD_LABEL: Record<string, string> = {
  GPS: "GPS",
  GPS_FACE: "Khuôn mặt + GPS",
  REMOTE: "Từ xa",
  REMOTE_FACE: "Từ xa + khuôn mặt",
};

function Item({ label, value }: { label: string; value: string }) {
  return (
    <Typography component="div" sx={{ display: "flex", gap: 2, justifyContent: "space-between", py: 0.5 }} variant="body2">
      <Typography color="text.secondary" component="span" variant="body2">{label}</Typography>
      <Typography component="span" sx={{ textAlign: "right" }} variant="subtitle2">{value}</Typography>
    </Typography>
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
  const timing = result.minutesVsShift === undefined ? "" : minutesVsShiftLabel(result.minutesVsShift, shiftName, direction);
  const next = result.nextPeriod;
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const hasPhoto = Boolean(punch.method?.includes("FACE"));

  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 480, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ display: "grid", gap: 0.5, justifyItems: "center", textAlign: "center" }}>
        {review ? <HourglassEmptyIcon color="warning" /> : <CheckCircleIcon color="success" />}
        <Typography component="h1" ref={headingRef} sx={{ outline: "none" }} tabIndex={-1} variant="h2">{title}</Typography>
        {review ? <Typography color="text.secondary" variant="body2">{punch.reason || result.messageVi}</Typography> : null}
        {timing ? <Typography variant="subtitle1">{timing}</Typography> : null}
        {result.alreadyPunched ? <Typography color="text.secondary" variant="body2">{result.messageVi || "Bạn đã chấm vào trước đó."}</Typography> : null}
      </Box>
      <PunchCard>
        <Item label="Vị trí" value={punch.remote ? "Từ xa · không lưu vị trí" : `${punch.siteName ?? ""} · cách ${punch.distanceM ?? 0} m`} />
        <Item label="Xác thực" value={METHOD_LABEL[punch.method ?? ""] ?? punch.method ?? ""} />
        {hasPhoto ? <Item label="Ảnh" value="Lưu 60 ngày rồi tự xoá" /> : null}
        <Item label="Mã lượt" value={punch.code ?? ""} />
      </PunchCard>
      {next ? (
        <PunchCard sx={{ display: "grid", gap: 1 }}>
          <Typography component="h2" variant="subtitle1">Tiết dạy kế tiếp</Typography>
          <Typography color="text.secondary" variant="body2">
            {[hhmm(next.start), next.className, next.subject, next.room].filter(Boolean).join(" · ")}
          </Typography>
          <Button onClick={() => onNavigate(teacherPath("/attendance"))} variant="outlined">
            Mở điểm danh
          </Button>
        </PunchCard>
      ) : null}
      {direction === "IN" && reminderAt ? <Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body2">{`Nhắc chấm ra · ${reminderAt}`}</Typography> : null}
      <ErgButton fullWidth onClick={onDone} variant="contained">Xong</ErgButton>
    </Box>
  );
}
