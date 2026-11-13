import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { formatTimeVi } from "@/domain/formatters/format-date";
import { formatViNumber } from "@/domain/student-tier/tiers";
import { Pill, ProgressBar, SubjectIcon, boardCardSx, rowButtonSx, tableHeadSx, type PillTone } from "@/features/elearning/student-dashboard/components/student-assignment-parts";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  dueChip, dueClock, dueShort, groupSummary, groupTodo, pickResume, progressPercent, type BoardGroup,
} from "@/features/elearning/student-dashboard/utils/assignment-board";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

const WEB_COLUMNS = "minmax(0,2.2fr) minmax(0,1.1fr) minmax(0,1.2fr) 84px 120px";
const CHIP_TONE: Record<"warn" | "muted" | "error", PillTone> = { error: "error", muted: "muted", warn: "warn" };
const actionLabel = (a: StudentDashboardAssignment) => (a.status === "in_progress" ? "Làm tiếp" : "Bắt đầu");

function metaLine(a: StudentDashboardAssignment, mobile: boolean): string {
  const test = a.kind === "TEST";
  const minutes = a.estimatedMinutes ? (test ? `${a.estimatedMinutes} phút` : `khoảng ${a.estimatedMinutes} phút`) : "";
  return [a.subjectLabel, a.totalQuestions ? `${a.totalQuestions} câu` : "", mobile ? "" : minutes, test ? "làm 1 lần" : ""].filter(Boolean).join(" · ");
}

function RowAction({ a, contained, onOpen }: { a: StudentDashboardAssignment; contained: boolean; onOpen: (id: string) => void }) {
  return (
    <Button disabled={!a.quizId} onClick={() => onOpen(a.id)} size="small" sx={rowButtonSx} variant={contained ? "contained" : "outlined"}>
      {actionLabel(a)}
    </Button>
  );
}

/** "Đang làm dở" card (H10 / H02c): the one contained button of the screen, recoloured white on the primary card. */
function ResumeCard({ a, now, mobile, onOpen }: { a: StudentDashboardAssignment; now: number; mobile: boolean; onOpen: (id: string) => void }) {
  const left = a.estimatedMinutes && a.totalQuestions ? Math.max(1, Math.round((a.estimatedMinutes * (a.totalQuestions - (a.answeredCount ?? 0))) / a.totalQuestions)) : null;
  const clock = dueClock(a, now);
  const progress = `${a.answeredCount}/${a.totalQuestions} câu`;
  const sub = [mobile ? progress : `Đã làm ${progress}`, left ? `còn khoảng ${left} phút` : "", clock ? `hạn ${clock}` : "", mobile ? "" : a.teacherName].filter(Boolean).join(" · ");
  const xp = a.xpReward ? (mobile ? `+${a.xpReward} XP` : `+${a.xpReward} XP nếu nộp trước ${formatTimeVi(a.dueAt)}`) : "";
  const action = (
    <Button disabled={!a.quizId} onClick={() => onOpen(a.id)} sx={{ bgcolor: "background.paper", color: "primary.main", minHeight: mobile ? 44 : 52, px: mobile ? 3 : 4, "&:hover": { bgcolor: t.color.primarySofter } }} variant="contained">
      Làm tiếp
    </Button>
  );
  const xpPill = xp ? (
    <Box component="span" sx={{ alignItems: "center", bgcolor: "rgba(255,255,255,.2)", borderRadius: `${t.radius.chip}px`, display: "inline-flex", gap: 0.5, minHeight: 24, px: 1.25, ...t.type.label, whiteSpace: "nowrap" }}>
      <BoltRoundedIcon sx={{ fontSize: t.size.iconMd }} />{xp}
    </Box>
  ) : null;
  return (
    <Box data-design="resume-card" sx={{ bgcolor: "primary.main", borderRadius: `${t.radius.shell}px`, color: "primary.contrastText", display: "flex", flexDirection: mobile ? "column" : "row", gap: 2, justifyContent: "space-between", p: mobile ? 2 : 3 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="p" sx={{ alignItems: "center", display: "flex", gap: 0.75, textTransform: "uppercase", ...(mobile ? t.type.label : null) }} variant="caption">
          <PlayCircleOutlineRoundedIcon sx={{ fontSize: t.size.iconMd }} />{`Đang làm dở${a.subjectLabel ? ` · ${a.subjectLabel}` : ""}`}
        </Typography>
        <Typography component="h2" sx={{ my: mobile ? 0.5 : 1 }} variant={mobile ? "h4" : "h2"}>{a.title}</Typography>
        <Typography sx={{ opacity: 0.9, ...(mobile ? t.type.small : null) }} variant="body2">{sub}</Typography>
        <Box sx={{ bgcolor: "rgba(255,255,255,.25)", borderRadius: `${t.radius.chip}px`, height: mobile ? 6 : 8, maxWidth: 460, mt: mobile ? 1.5 : 1, overflow: "hidden" }}>
          <Box sx={{ bgcolor: "common.white", height: "100%", width: `${progressPercent(a)}%` }} />
        </Box>
      </Box>
      {mobile ? (
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>{xpPill}{action}</Box>
      ) : (
        <Box sx={{ alignItems: "flex-end", display: "flex", flexDirection: "column", gap: 1.5, justifyContent: "space-between" }}>{xpPill}{action}</Box>
      )}
    </Box>
  );
}

function WebRow({ a, now, contained, onOpen }: { a: StudentDashboardAssignment; now: number; contained: boolean; onOpen: (id: string) => void }) {
  const chip = dueChip(a, now);
  const doing = a.status === "in_progress" && a.answeredCount !== null && a.totalQuestions;
  return (
    <Box data-design="todo-row" sx={{ alignItems: "center", borderTop: 1, borderColor: "divider", columnGap: 2, display: "grid", gridTemplateColumns: WEB_COLUMNS, px: 2.5, py: 1.75 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, minWidth: 0 }}>
        <SubjectIcon assignment={a} />
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap variant="subtitle2">{a.title}</Typography>
          <Typography color="textSecondary" noWrap variant="caption">{metaLine(a, false)}</Typography>
        </Box>
      </Box>
      <Box>
        {chip ? <Pill block icon={<ScheduleRoundedIcon sx={{ fontSize: t.size.iconSm }} />} tone={CHIP_TONE[chip.tone]}>{chip.text}</Pill> : null}
        <Typography color="textSecondary" sx={{ mt: 0.25 }} variant="caption">{dueClock(a, now)}</Typography>
      </Box>
      <Box>
        <Typography sx={t.type.small}>{doing ? `Đang làm ${a.answeredCount}/${a.totalQuestions}` : "Chưa làm"}</Typography>
        <Box sx={{ mt: 0.75 }}><ProgressBar label="Tiến độ" percent={progressPercent(a)} /></Box>
      </Box>
      <Box>{a.xpReward ? <Pill tone="info">{`+${formatViNumber(a.xpReward)} XP`}</Pill> : null}</Box>
      <Box sx={{ textAlign: "right" }}><RowAction a={a} contained={contained} onOpen={onOpen} /></Box>
    </Box>
  );
}

function MobileCard({ a, now, contained, onOpen }: { a: StudentDashboardAssignment; now: number; contained: boolean; onOpen: (id: string) => void }) {
  const chip = dueChip(a, now);
  const today = chip?.tone === "warn";
  return (
    <Box data-design="todo-card" sx={{ ...boardCardSx, p: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
        <SubjectIcon assignment={a} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2">{a.title}</Typography>
          <Typography color="textSecondary" variant="caption">{metaLine(a, true)}</Typography>
        </Box>
      </Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, mt: 0.75 }}>
        {chip ? <Pill icon={<ScheduleRoundedIcon sx={{ fontSize: t.size.iconSm }} />} tone={today ? "warn" : "muted"}>{today ? chip.text : dueShort(a, now)}</Pill> : null}
        {a.xpReward ? <Pill tone="info">{`+${formatViNumber(a.xpReward)} XP`}</Pill> : null}
        <Box sx={{ ml: "auto" }}><RowAction a={a} contained={contained} onOpen={onOpen} /></Box>
      </Box>
    </Box>
  );
}

function GroupHeader({ group, mobile }: { group: BoardGroup; mobile: boolean }) {
  return (
    <Box sx={{ alignItems: "center", bgcolor: mobile ? "transparent" : t.color.surfaceMuted, borderTop: mobile ? 0 : 1, borderColor: "divider", display: "flex", justifyContent: "space-between", ...(mobile ? { px: 0.5, py: 0.5 } : { borderBottom: 1, pb: 1, pt: 1.5, px: 2.5 }) }}>
      <Typography color="textSecondary" variant="caption">{group.label}</Typography>
      <Typography color="textSecondary" variant="caption">{groupSummary(group)}</Typography>
    </Box>
  );
}

/** Cần làm (H10 web / H02c mobile): resume card, then rows grouped by deadline. */
export function TodoBoard({ items, now, mobile, onOpen }: { items: StudentDashboardAssignment[]; now: number; mobile: boolean; onOpen: (id: string) => void }) {
  const resume = pickResume(items);
  // Mobile hides the resumed work from the list (it is the card above); web keeps it as a row.
  const groups = groupTodo(mobile && resume ? items.filter((a) => a.id !== resume.id) : items, now);
  // Without a started assignment the first startable row carries the page's contained button.
  const containedId = resume ? undefined : items.find((a) => a.quizId)?.id;
  const rowProps = (a: StudentDashboardAssignment) => ({ a, contained: a.id === containedId, now, onOpen });
  return (
    <>
      {resume ? <ResumeCard a={resume} mobile={mobile} now={now} onOpen={onOpen} /> : null}
      {mobile ? (
        groups.map((group) => (
          <Box key={group.key} sx={{ display: "grid", gap: 1 }}>
            <GroupHeader group={group} mobile />
            {group.items.map((a) => <MobileCard key={a.id} {...rowProps(a)} />)}
          </Box>
        ))
      ) : (
        <Box sx={boardCardSx}>
          <Box sx={{ ...tableHeadSx, gridTemplateColumns: WEB_COLUMNS }}>
            {["Bài", "Hạn nộp", "Trạng thái", "Thưởng", ""].map((label, index) => <Typography color="textSecondary" key={index} variant="caption">{label}</Typography>)}
          </Box>
          {groups.map((group) => (
            <Box key={group.key}>
              <GroupHeader group={group} mobile={false} />
              {group.items.map((a) => <WebRow key={a.id} {...rowProps(a)} />)}
            </Box>
          ))}
        </Box>
      )}
      {!mobile ? (
        <Typography color="textSecondary" variant="caption">
          Nộp trước hạn được thêm +10 XP. Bài kiểm tra chỉ làm 1 lần; bài luyện tập làm lại được nhưng chỉ tính XP lần nộp đầu.
        </Typography>
      ) : null}
    </>
  );
}
