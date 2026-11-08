import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CalculateIcon from "@mui/icons-material/Calculate";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { usePendingExplanation } from "../../api/timekeeping-request-query";
import { useTimekeepingDay, useTimekeepingMonth } from "../../api/timekeeping-query";
import type { DayDetailView } from "../../api/timekeeping-types";
import { dayCodeFor } from "../../model/day-codes";
import { CardRow, PunchCard } from "../punch/punch-card";
import { hhmm, longDate } from "../punch/punch-format";
import { PunchRow } from "./punch-row";
import { PendingExplanationNote } from "./pending-explanation-note";
import { MISSING_TITLE, unitsVi } from "./timesheet-summary";

const MONTHLY_LIMIT = 3;

function Detail({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <CardRow icon={icon} sx={{ minHeight: 56 }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography color="text.secondary" component="div" variant="caption">{text}</Typography>
    </CardRow>
  );
}

function teachingSummary(day: DayDetailView): string {
  const periods = [...(day.periods ?? [])].sort((a, b) => (a.end ?? "").localeCompare(b.end ?? ""));
  const last = periods[periods.length - 1];
  if (!last) return "Không có tiết dạy";
  return `${periods.length} tiết · tiết cuối ${last.className ?? ""} kết thúc ${hhmm(last.end)}`.replace("  ", " ");
}

function provisionalText(day: DayDetailView): string {
  const full = unitsVi(day.shift?.workUnits ?? 1);
  return day.status === "MISSING_PUNCH"
    ? `Công tạm tính ${unitsVi(day.units)} / ${full} công · đủ ${full} khi giải trình được duyệt`
    : `Công ${unitsVi(day.units)} / ${full} công`;
}

type DayDetailPageProps = { date: string };

/** G05: one day's punches, teaching summary and the explanation entry. Back returns to the month of that day. */
export function DayDetailPage({ date }: DayDetailPageProps) {
  const navigate = useNavigate();
  const { data: day, isError, refetch } = useTimekeepingDay(date);
  const { data: month, isPending: monthPending } = useTimekeepingMonth(date.slice(0, 7));
  const pending = usePendingExplanation(date);
  const go = (path: string) => void navigate({ href: teacherPath(path) });
  const code = day?.status ? dayCodeFor(day.status, day.leaveKind) : null;

  const explainable = day?.status === "MISSING_PUNCH";
  const locked = Boolean(month?.locked);
  const remaining = day?.explanationsRemaining ?? 0;
  const blockedText = locked ? "Kỳ công đã chốt, không thể giải trình." : remaining <= 0 ? "Đã hết lượt giải trình trong tháng." : null;
  const shift = day?.shift ? `${day.shift.name ?? ""} ${hhmm(day.shift.start)} – ${hhmm(day.shift.end)}`.trim() : "";

  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 480, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, ml: -1 }}>
        <ErgIconButton label="Quay lại bảng công" onClick={() => go(`/timekeeping/timesheet?period=${date.slice(0, 7)}`)}><ArrowBackIcon /></ErgIconButton>
        <Box sx={{ flex: 1, minWidth: 0, pt: 0.75 }}>
          <Typography component="h1" variant="h4">{longDate(date)}</Typography>
          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mt: 0.75 }}>
            {code ? <ErgStatusChip label={explainable && day?.missing ? MISSING_TITLE[day.missing] : code.label} tone={code.tone} /> : null}
            {shift ? <Typography color="text.secondary" variant="caption">{shift}</Typography> : null}
          </Box>
        </Box>
      </Box>
      {isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được chi tiết ngày." title="Có lỗi xảy ra" />
      ) : !day ? (
        <ErgSkeleton height={240} />
      ) : (
        <>
          <PunchCard sx={{ p: 0 }}>
            <PunchRow dayPunch={day.in} label="Vào" lateMinutes={day.lateMinutes} />
            <PunchRow dayPunch={day.out} label="Ra" missing={day.missing === "OUT"} missingReason={day.missingReason} />
            <Detail icon={<MenuBookIcon color="primary" />} text={teachingSummary(day)} title="Lịch dạy" />
            <Detail icon={<CalculateIcon />} text={provisionalText(day)} title={day.status === "MISSING_PUNCH" ? "Công tạm tính" : "Công"} />
          </PunchCard>
          {(day.periods?.length ?? 0) > 0 ? (
            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography color="text.secondary" component="h2" variant="overline">Minh chứng</Typography>
              <PunchCard sx={{ p: 0 }}>
                <Detail icon={<AttachFileIcon />} text={`Lịch dạy ${day.shift?.name?.toLowerCase() ?? "trong ngày"}`} title="Minh chứng tự đính kèm" />
              </PunchCard>
              {explainable && !blockedText && !pending.request?.id ? (
                <Typography color="text.secondary" variant="caption">{`Còn ${remaining}/${MONTHLY_LIMIT} lượt giải trình trong tháng`}</Typography>
              ) : null}
            </Box>
          ) : null}
          {explainable && !monthPending && !pending.loading ? (
            pending.request?.id ? (
              <PendingExplanationNote onOpen={() => go(`/timekeeping/requests?id=${encodeURIComponent(pending.request?.id as string)}`)} />
            ) : blockedText ? (
              <Typography color="text.secondary" variant="body2">{blockedText}</Typography>
            ) : (
              <ErgButton fullWidth onClick={() => go(`/timekeeping/requests?new=explanation&date=${date}`)} size="large" startIcon={<EditDocumentIcon />}>Giải trình chấm công</ErgButton>
            )
          ) : null}
        </>
      )}
    </Box>
  );
}
