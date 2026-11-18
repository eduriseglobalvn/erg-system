import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { todayInput } from "@/domain/formatters/format-date";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { PanelState } from "../components/class-log-ui";
import { classLogText } from "../domain/class-log-copy";
import { addDays, currentWeekStart, shortDateVi, weekdayVi } from "../domain/class-log-week";
import { useConfirmWeek, useTeacherWeek } from "../hooks/use-class-log-queries";
import { dayDot, groupPeriods, lessonLines, whenText, type DayDot, type PeriodGroup } from "./lesson-report-mobile-model";
import { LessonReportPeriodSheet } from "./lesson-report-period-sheet";

const dots: Record<DayDot, string> = { ok: t.classLog.present.color, late: t.classLog.late.color, miss: t.statusTint.error.dot, none: "transparent" };
const DAYS_SHOWN = 6;

/** Phone «Sổ đầu bài» (6.11): the week's unconfirmed periods first, with «Đổi» (lesson sheet) and «Xác nhận». */
export function LessonReportMobile() {
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [day, setDay] = useState("");
  const [editing, setEditing] = useState<PeriodGroup | null>(null);
  const [asking, setAsking] = useState(false);
  const query = useTeacherWeek(weekStart, "", "");
  const confirm = useConfirmWeek(weekStart);
  const week = query.data;
  const groups = week ? groupPeriods(week) : [];
  const shown = day ? groups.filter((g) => g.date === day) : groups;
  const todo = shown.filter((g) => !g.confirmed);
  const done = shown.filter((g) => g.confirmed);
  const today = todayInput();
  const navigate = useNavigate();
  const step = (days: number) => { setWeekStart(addDays(weekStart, days)); setDay(""); };

  return (
    <Box sx={{ bgcolor: t.color.surfaceSubtle, display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <Box component="header" sx={{ bgcolor: "background.paper", borderBottom: `1px solid ${t.color.border}`, display: "flex", flexDirection: "column", gap: 1.25, px: 2, py: 1.5 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
          <Typography component="h1" sx={{ flex: 1, fontSize: t.type.pageLead.fontSize + 5, fontWeight: t.type.label.fontWeight }}>Sổ đầu bài</Typography>
          <ErgIconButton label="Tuần trước" onClick={() => step(-7)} size="small"><ChevronLeftIcon /></ErgIconButton>
          <Typography sx={{ color: t.color.textMuted, fontSize: t.type.small.fontSize }}>{`${weekStart.slice(8, 10)} – ${shortDateVi(addDays(weekStart, 4))}`}</Typography>
          <ErgIconButton label="Tuần sau" onClick={() => step(7)} size="small"><ChevronRightIcon /></ErgIconButton>
        </Box>
        <Box sx={{ display: "flex", gap: 0.75 }}>
          {Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(weekStart, i)).map((date) => {
            const on = date === day || (!day && date === today);
            const name = weekdayVi(date);
            return (
              <ButtonBase
                aria-label={`${name} ${shortDateVi(date)}`}
                aria-pressed={date === day}
                key={date}
                onClick={() => setDay(date === day ? "" : date)}
                sx={{ alignItems: "center", bgcolor: on ? t.color.primary : t.color.surfaceSubtle, borderRadius: `${t.radius.control}px`, color: on ? "common.white" : t.color.textSecondary, flex: 1, flexDirection: "column", gap: 0.25, height: 60, justifyContent: "center" }}
              >
                <Box component="span" sx={{ fontSize: t.type.label.fontSize }}>{`T${name.slice(-1)}`}</Box>
                <Box component="strong" sx={{ fontSize: t.type.small.fontSize, fontWeight: t.type.label.fontWeight }}>{date.slice(8, 10)}</Box>
                <Box component="span" sx={{ bgcolor: dots[dayDot(groups, date)], borderRadius: "50%", height: 6, width: 6 }} />
              </ButtonBase>
            );
          })}
        </Box>
      </Box>
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 1.25, px: 2, py: 1.5 }}>
        <PanelState isError={query.isError} isPending={query.isPending} onRetry={() => void query.refetch()}>
          {groups.length === 0 ? <ErgEmptyState title={classLogText.emptyWeek} /> : null}
          {todo.map((g) => <TodoCard confirming={confirm.isPending} group={g} key={g.key} onConfirm={() => setAsking(true)} onEdit={() => setEditing(g)} />)}
          {done.length ? (
            <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, overflow: "hidden" }}>
              {done.map((g, i) => <DoneRow first={i === 0} group={g} key={g.key} />)}
            </Box>
          ) : null}
        </PanelState>
        <ErgButton onClick={() => void navigate({ href: teacherPath("/class-log?tab=class") })} variant="text">Mở sổ đầu bài ›</ErgButton>
      </Box>
      {/* The server confirms the whole week at once, so the card says so before it happens (BUG-D-005). */}
      <ErgConfirmDialog confirmLabel="Xác nhận" description="Mọi tiết đã dạy trong tuần này sẽ được xác nhận cùng lúc, không chỉ tiết vừa chọn." loading={confirm.isPending} onCancel={() => setAsking(false)} onConfirm={() => confirm.mutate(undefined, { onSettled: () => setAsking(false) })} open={asking} title={`Xác nhận ${week?.stats?.pending ?? 0} tiết đã dạy trong tuần?`} />
      <LessonReportPeriodSheet group={editing} onClose={() => setEditing(null)} />
    </Box>
  );
}

function TodoCard({ group, confirming, onEdit, onConfirm }: { group: PeriodGroup; confirming: boolean; onEdit: () => void; onConfirm: () => void }) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, display: "flex", flexDirection: "column", gap: 1.25, px: 1.75, py: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.25 }}>
        <Box component="span" sx={{ alignItems: "center", bgcolor: t.color.primarySofter, borderRadius: "8px", color: t.statusTint.info.color, display: "inline-flex", flex: "none", fontWeight: t.type.label.fontWeight, height: 36, justifyContent: "center", width: 48 }}>{group.className}</Box>
        <Box component="span" sx={{ flex: 1, fontWeight: t.type.label.fontWeight }}>{whenText(group)}</Box>
        {group.upcoming ? null : <Box component="span" sx={{ bgcolor: t.color.danger, borderRadius: "50%", height: 8, width: 8 }} />}
      </Box>
      <ButtonBase aria-label={`Đổi bài dạy ${group.className}`} onClick={onEdit} sx={{ alignItems: "center", bgcolor: t.color.primarySofter, borderRadius: `${t.radius.control}px`, color: t.statusTint.info.color, display: "flex", fontSize: t.type.small.fontSize, gap: 1, justifyContent: "flex-start", minHeight: 44, px: 1.5, py: 1.25, textAlign: "left" }}>
        <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 0.25 }}>{lessonLines(group).map((line) => <span key={line}>{line}</span>)}</Box>
        <Box component="span" sx={{ fontWeight: t.type.label.fontWeight }}>Đổi</Box>
      </ButtonBase>
      {/* An upcoming period is filled in ahead but confirmed only after it was taught. */}
      {group.upcoming ? null : <ErgButton loading={confirming} onClick={onConfirm} sx={{ minHeight: 44 }} variant="outlined">Xác nhận</ErgButton>}
    </Box>
  );
}

function DoneRow({ group, first }: { group: PeriodGroup; first: boolean }) {
  return (
    <Box sx={{ alignItems: "center", borderTop: first ? 0 : `1px solid ${t.color.divider}`, display: "flex", gap: 1.25, minHeight: 56, px: 1.75, py: 1.25 }}>
      <Box component="span" sx={{ alignItems: "center", bgcolor: t.color.surfaceSubtle, borderRadius: "8px", display: "inline-flex", flex: "none", fontSize: t.type.small.fontSize, fontWeight: t.type.label.fontWeight, height: 32, justifyContent: "center", width: 48 }}>{group.className}</Box>
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
        <Typography sx={{ color: t.color.textMuted, fontSize: t.type.label.fontSize }}>{`${whenText(group)}${group.late ? " · muộn" : ""}`}</Typography>
        <Typography noWrap sx={{ fontSize: t.type.small.fontSize }}>{lessonLines(group).join(" · ")}</Typography>
      </Box>
      <Box aria-label={group.late ? "Đã xác nhận muộn" : "Đã xác nhận"} component="span" role="img" sx={{ color: group.late ? t.classLog.late.color : t.classLog.present.color, fontWeight: t.type.label.fontWeight }}>✓</Box>
    </Box>
  );
}

/** Teacher class-log route on a phone shows the report flow, unless `?tab=class|log` asks for the books. */
export function LessonReportMobileGate({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"), { noSsr: true });
  const tab = new URLSearchParams(useLocation().searchStr).get("tab");
  return isMobile && tab !== "class" && tab !== "log" ? <LessonReportMobile /> : <>{children}</>;
}
