import type { ReactNode } from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { formatViNumber } from "@/domain/student-tier/tiers";
import { ProgressBar, SubjectIcon, boardCardSx } from "@/features/elearning/student-dashboard/components/student-assignment-parts";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  beforeDueLabel, percentBand, rawScoreLabel, score10, scoreBand, scorePercent, shortDateTime, submittedStats, type ScoreBand,
} from "@/features/elearning/student-dashboard/utils/assignment-board";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

const WEB_COLUMNS = "minmax(0,2fr) minmax(0,1.1fr) minmax(0,1.5fr) minmax(0,1fr) 72px 128px";
const BAND_COLOR: Record<ScoreBand, string> = { error: t.color.danger, ok: t.color.success, primary: t.color.primary };
const BAND_TILE: Record<ScoreBand, { bg: string; fg: string }> = {
  error: { bg: t.statusTint.error.bg, fg: t.statusTint.error.color },
  ok: { bg: t.statusTint.success.bg, fg: t.statusTint.success.color },
  primary: { bg: t.statusTint.info.bg, fg: t.statusTint.info.color },
};
const BAR_COLOR = { ok: t.color.success, primary: t.color.primary, warning: t.color.warning } as const;

const attemptsLabel = (a: StudentDashboardAssignment) => `${a.attemptCount && a.attemptCount > 0 ? a.attemptCount : 1} lần`;
const meta = (a: StudentDashboardAssignment) => [a.subjectLabel, a.totalQuestions ? `${a.totalQuestions} câu` : ""].filter(Boolean).join(" · ");
const correctText = (a: StudentDashboardAssignment) => (a.correctCount != null && a.totalQuestions ? `${a.correctCount}/${a.totalQuestions}` : "");

function Ring({ value, size, label }: { value: number; size: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value * 10));
  return (
    <Box aria-hidden sx={{ alignItems: "center", background: `conic-gradient(${t.color.primary} ${pct}%, ${t.color.divider} 0)`, borderRadius: "50%", display: "grid", flexShrink: 0, height: size, placeItems: "center", width: size }}>
      <Box sx={{ alignItems: "center", bgcolor: "background.paper", borderRadius: "50%", display: "flex", height: size - 12, justifyContent: "center", width: size - 12 }}>
        <Typography component="span" variant="subtitle2">{label}</Typography>
      </Box>
    </Box>
  );
}

function Kpi({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <Box sx={{ ...boardCardSx, p: 2 }}>
      <Typography color="text.secondary" variant="body2">{title}</Typography>
      <Box sx={{ alignItems: "baseline", display: "flex", gap: 0.5, my: 0.5 }}>{children}</Box>
      {note}
    </Box>
  );
}

const Big = ({ children, color }: { children: ReactNode; color?: string }) => <Typography component="span" sx={{ color, fontVariantNumeric: "tabular-nums" }} variant="h2">{children}</Typography>;
const Unit = ({ children }: { children: ReactNode }) => <Typography color="text.secondary" component="span" variant="body2">{children}</Typography>;

function WebKpis({ items }: { items: StudentDashboardAssignment[] }) {
  const s = submittedStats(items);
  if (!s.count) return null;
  const correctPct = s.correct ? Math.round((s.correct.right / s.correct.total) * 100) : 0;
  const best = s.best;
  const bestCorrect = best && correctText(best) ? ` · đúng ${correctText(best)} câu` : "";
  return (
    <Box data-design="submitted-kpis" sx={{ alignItems: "start", display: "grid", gap: 2, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
      <Box sx={{ ...boardCardSx, alignItems: "center", display: "flex", flexDirection: "column", gap: 1, p: 2 }}>
        <Ring label={s.averageTen} size={64} value={Number(s.averageTen.replace(",", "."))} />
        <Typography color="text.secondary" variant="body2">Điểm trung bình</Typography>
        <Box sx={{ alignItems: "baseline", display: "flex", gap: 0.5 }}><Big>{s.averageTen}</Big><Unit>/10</Unit></Box>
        <Typography color="text.secondary" variant="body2">{`${s.count} bài · lần nộp gần nhất`}</Typography>
      </Box>
      {s.correct ? (
        <Kpi note={<Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{`${correctPct}% số câu của ${s.count} bài`}</Typography>} title="Câu trả lời đúng">
          <Big>{s.correct.right}</Big><Unit>{`/${s.correct.total} câu`}</Unit>
        </Kpi>
      ) : null}
      {best ? (
        <Kpi note={<Typography color="text.secondary" noWrap variant="body2">{`${best.title}${bestCorrect}`}</Typography>} title="Bài cao nhất">
          <Big color={BAND_COLOR[scoreBand(best.score!, best.maxScore!)]}>{score10(best)}</Big><Unit>/10</Unit>
        </Kpi>
      ) : null}
      {s.onTime ? (
        <Kpi note={<Typography color="text.secondary" variant="body2">Được +10 XP mỗi bài nộp trước hạn</Typography>} title="Nộp đúng hạn">
          <Big>{s.onTime.done}</Big><Unit>{`/${s.onTime.total} bài`}</Unit>
        </Kpi>
      ) : null}
    </Box>
  );
}

function WebRow({ a, onOpen }: { a: StudentDashboardAssignment; onOpen: (id: string) => void }) {
  const percent = scorePercent(a);
  const band = a.score !== null && a.maxScore ? scoreBand(a.score, a.maxScore) : null;
  const before = beforeDueLabel(a);
  return (
    <Box data-design="submitted-row" sx={{ alignItems: "center", borderTop: 1, borderColor: "divider", columnGap: 2, display: "grid", gridTemplateColumns: WEB_COLUMNS, px: 2, py: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, minWidth: 0 }}>
        <SubjectIcon assignment={a} />
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap variant="subtitle2">{a.title}</Typography>
          <Typography color="text.secondary" noWrap variant="caption">{meta(a)}</Typography>
        </Box>
      </Box>
      <Box>
        <Typography variant="body2">{shortDateTime(a.submittedAt)}</Typography>
        {before ? <Typography sx={{ color: before.late ? "error.main" : "success.main" }} variant="caption">{before.text}</Typography> : null}
      </Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
        <Typography variant="subtitle2">{correctText(a)}</Typography>
        {percent !== null ? (
          <>
            <ProgressBar color={BAR_COLOR[percentBand(percent)]} label="Tỉ lệ đúng" percent={percent} />
            <Typography color="text.secondary" variant="body2">{`${percent}%`}</Typography>
          </>
        ) : null}
      </Box>
      <Box sx={{ textAlign: "right" }}>
        {band ? (
          <>
            <Box sx={{ alignItems: "baseline", display: "flex", gap: 0.25, justifyContent: "flex-end" }}>
              <Typography component="span" sx={{ color: BAND_COLOR[band], fontVariantNumeric: "tabular-nums" }} variant="h2">{score10(a)}</Typography>
              <Unit>/10</Unit>
            </Box>
            <Typography color="text.secondary" variant="caption">{rawScoreLabel(a)}</Typography>
          </>
        ) : null}
      </Box>
      <Typography color="text.secondary" variant="body2">{attemptsLabel(a)}</Typography>
      <Box sx={{ textAlign: "right" }}><Button disabled={!a.quizId} onClick={() => onOpen(a.id)} size="small" sx={{ minHeight: 40 }} variant="outlined">Xem bài làm</Button></Box>
    </Box>
  );
}

function MobileCard({ a, onOpen }: { a: StudentDashboardAssignment; onOpen: (id: string) => void }) {
  const percent = scorePercent(a);
  const band = a.score !== null && a.maxScore ? scoreBand(a.score, a.maxScore) : null;
  const done = [shortDateTime(a.submittedAt) ? `Nộp ${shortDateTime(a.submittedAt)}` : "", rawScoreLabel(a)].filter(Boolean).join(" · ");
  return (
    <ButtonBase data-design="submitted-card" disabled={!a.quizId} onClick={() => onOpen(a.id)} sx={{ ...boardCardSx, display: "grid", gap: 1, p: 2, textAlign: "left", width: "100%" }}>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1.5, justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1">{a.title}</Typography>
          <Typography color="text.secondary" variant="body2">{`${meta(a)} · ${attemptsLabel(a).replace("lần", "lần làm")}`}</Typography>
          {a.correctCount != null && a.totalQuestions ? (
            <Box sx={{ alignItems: "center", color: "success.main", display: "flex", gap: 0.75, mt: 1 }}>
              <CheckCircleRoundedIcon sx={{ fontSize: t.size.iconMd }} />
              <Typography color="text.primary" variant="subtitle2">{`Đúng ${a.correctCount}/${a.totalQuestions} câu`}</Typography>
              {percent !== null ? <Typography color="text.secondary" variant="body2">{`· ${percent}%`}</Typography> : null}
            </Box>
          ) : null}
        </Box>
        {band ? (
          <Box sx={{ bgcolor: BAND_TILE[band].bg, borderRadius: `${t.radius.lg}px`, color: BAND_TILE[band].fg, flexShrink: 0, px: 1.5, py: 1, textAlign: "center" }}>
            <Typography component="p" variant="subtitle2">{score10(a)}</Typography>
            <Typography component="p" variant="subtitle2">/10</Typography>
          </Box>
        ) : null}
      </Box>
      {percent !== null ? <ProgressBar color={BAR_COLOR[percentBand(percent)]} label="Tỉ lệ đúng" percent={percent} /> : null}
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <Typography color="text.secondary" sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }} variant="caption">
          <ScheduleRoundedIcon sx={{ fontSize: t.size.iconSm }} />{done}
        </Typography>
        <Typography color="primary" sx={{ alignItems: "center", display: "inline-flex" }} variant="subtitle2">Xem bài làm<ChevronRightRoundedIcon sx={{ fontSize: t.size.iconMd }} /></Typography>
      </Box>
    </ButtonBase>
  );
}

/** Đã nộp (H09 web / H02b mobile). */
export function SubmittedBoard({ items, mobile, onOpen }: { items: StudentDashboardAssignment[]; mobile: boolean; onOpen: (id: string) => void }) {
  const s = submittedStats(items);
  if (mobile) {
    return (
      <>
        {s.count ? (
          <Box data-design="submitted-summary" sx={{ ...boardCardSx, alignItems: "center", display: "flex", gap: 2, p: 2 }}>
            <Ring label={s.averageTen} size={60} value={Number(s.averageTen.replace(",", "."))} />
            <Box>
              <Typography color="text.secondary" variant="body2">{`Điểm trung bình · ${s.count} bài`}</Typography>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Box sx={{ alignItems: "baseline", display: "flex", gap: 0.25 }}><Big>{s.averageTen}</Big><Unit>/10</Unit></Box>
                {s.correct ? <Box component="span" sx={{ bgcolor: t.statusTint.success.bg, borderRadius: `${t.radius.chip}px`, color: t.statusTint.success.color, px: 1.25, py: 0.25, typography: "subtitle2" }}>{`Đúng ${formatViNumber(s.correct.right)}/${formatViNumber(s.correct.total)} câu`}</Box> : null}
              </Box>
              <Typography color="text.secondary" variant="body2">Mỗi bài lấy lần nộp gần nhất</Typography>
            </Box>
          </Box>
        ) : null}
        {items.map((a) => <MobileCard a={a} key={a.id} onOpen={onOpen} />)}
      </>
    );
  }
  return (
    <>
      <WebKpis items={items} />
      <Box sx={boardCardSx}>
        <Box sx={{ columnGap: 2, display: "grid", gridTemplateColumns: WEB_COLUMNS, px: 2, py: 1.5 }}>
          {["Bài", "Nộp lúc", "Câu đúng", "Điểm", "Lần làm", ""].map((label, index) => <Typography color="text.secondary" key={index} sx={{ textAlign: index === 3 ? "right" : "left" }} variant="caption">{label}</Typography>)}
        </Box>
        {items.map((a) => <WebRow a={a} key={a.id} onOpen={onOpen} />)}
      </Box>
    </>
  );
}
