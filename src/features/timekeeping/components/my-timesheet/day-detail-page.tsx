import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateVi } from "@/domain/formatters/format-date";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { usePendingExplanation } from "../../api/timekeeping-request-query";
import { useTimekeepingDay, useTimekeepingMonth } from "../../api/timekeeping-query";
import type { DayDetailView } from "../../api/timekeeping-types";
import { dayCodeFor } from "../../model/day-codes";
import { PunchCard } from "../punch/punch-card";
import { hhmm } from "../punch/punch-format";
import { PunchRow } from "./punch-row";
import { PendingExplanationNote } from "./pending-explanation-note";
import { MISSING_TITLE, unitsVi } from "./timesheet-summary";

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Typography component="div" sx={{ display: "flex", gap: 2, justifyContent: "space-between", py: 0.5 }} variant="body2">
      <span>{label}</span>
      <Typography component="span" sx={{ textAlign: "right" }} variant="subtitle2">{value}</Typography>
    </Typography>
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

  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 480, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
        <ErgIconButton label="Quay lại bảng công" onClick={() => go(`/timekeeping/timesheet?period=${date.slice(0, 7)}`)}><ArrowBackIcon /></ErgIconButton>
        <Typography component="h1" variant="h5">{formatDateVi(date)}</Typography>
        {code ? <ErgStatusChip label={explainable && day?.missing ? MISSING_TITLE[day.missing] : code.label} tone={code.tone} /> : null}
      </Box>
      {isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được chi tiết ngày." title="Có lỗi xảy ra" />
      ) : !day ? (
        <ErgSkeleton height={240} />
      ) : (
        <>
          <PunchCard>
            {day.shift ? <Line label="Ca" value={`${day.shift.name ?? ""} · ${hhmm(day.shift.start)} – ${hhmm(day.shift.end)}`} /> : null}
            <PunchRow dayPunch={day.in} label="Vào" lateMinutes={day.lateMinutes} />
            <PunchRow dayPunch={day.out} label="Ra" missing={day.missing === "OUT"} missingReason={day.missingReason} />
          </PunchCard>
          <PunchCard>
            <Line label="Lịch dạy" value={teachingSummary(day)} />
            <Line label="Công" value={provisionalText(day)} />
            {(day.periods?.length ?? 0) > 0 ? <Line label="Minh chứng tự đính kèm" value={`Lịch dạy ${day.shift?.name?.toLowerCase() ?? "trong ngày"}`} /> : null}
          </PunchCard>
          {explainable && !monthPending && !pending.loading ? (
            pending.request?.id ? (
              <PendingExplanationNote onOpen={() => go(`/timekeeping/requests?id=${encodeURIComponent(pending.request?.id as string)}`)} />
            ) : blockedText ? (
              <Typography color="text.secondary" variant="body2">{blockedText}</Typography>
            ) : (
              <ErgButton fullWidth onClick={() => go(`/timekeeping/requests?new=explanation&date=${date}`)}>Giải trình chấm công</ErgButton>
            )
          ) : null}
        </>
      )}
    </Box>
  );
}
