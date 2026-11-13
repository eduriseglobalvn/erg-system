import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { formatDateVi, formatTimeVi } from "@/domain/formatters/format-date";
import { Pill, SubjectIcon, boardCardSx, rowButtonSx, tableHeadSx } from "@/features/elearning/student-dashboard/components/student-assignment-parts";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { overdueAgo, shortDue } from "@/features/elearning/student-dashboard/utils/assignment-board";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

const WEB_COLUMNS = "minmax(0,2.2fr) minmax(0,1.1fr) minmax(0,1.2fr) 84px 120px";
const lateUntil = (a: StudentDashboardAssignment) => {
  const ms = a.lateSubmitUntil ? Date.parse(a.lateSubmitUntil) : Number.NaN;
  return Number.isNaN(ms) ? "" : `đến ${formatDateVi(ms).slice(0, 5)} ${formatTimeVi(ms)}`;
};
const meta = (a: StudentDashboardAssignment) => [a.subjectLabel, a.totalQuestions ? `${a.totalQuestions} câu` : "", a.teacherName].filter(Boolean).join(" · ");

function AgoPill({ a, now }: { a: StudentDashboardAssignment; now: number }) {
  return <Pill icon={<HistoryRoundedIcon sx={{ fontSize: t.size.iconSm }} />} tone="error">{overdueAgo(a, now)}</Pill>;
}

function StateText({ a }: { a: StudentDashboardAssignment }) {
  return <Typography component="span" sx={{ ...t.type.small, color: a.closed ? "error.main" : "success.main" }}>{a.closed ? "Đã đóng" : "Còn mở"}</Typography>;
}

function Reward({ a }: { a: StudentDashboardAssignment }) {
  return a.closed || !a.xpReward ? <Pill tone="muted">Không còn XP</Pill> : <Pill tone="info">{`+${a.xpReward} XP`}</Pill>;
}

/** "Nộp muộn" while open; "Hỏi cô" (message the teacher) once closed. */
function LateAction({ a, onAsk, onOpen }: { a: StudentDashboardAssignment; onAsk: (a: StudentDashboardAssignment) => void; onOpen: (id: string) => void }) {
  return a.closed ? (
    <Button onClick={() => onAsk(a)} size="small" startIcon={<ChatOutlinedIcon />} sx={rowButtonSx} variant="outlined">Hỏi cô</Button>
  ) : (
    <Button disabled={!a.quizId} onClick={() => onOpen(a.id)} size="small" sx={rowButtonSx} variant="outlined">Nộp muộn</Button>
  );
}

function Notice({ count, mobile }: { count: number; mobile: boolean }) {
  const open = "Bài còn mở thì vẫn nộp muộn được và vẫn nhận XP hoàn thành, chỉ mất +10 XP nộp trước hạn.";
  return (
    <Box data-design="overdue-notice" sx={{ alignItems: "center", bgcolor: t.statusTint.error.bg, border: 1, borderColor: "error.light", borderRadius: `${t.radius.card}px`, color: t.statusTint.error.color, display: "flex", gap: 2, p: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}><EventBusyRoundedIcon sx={{ color: "error.main", fontSize: t.size.iconLg }} /></Box>
      <Box>
        {mobile ? (
          <Typography variant="body2"><Typography component="strong" variant="subtitle2">{`${count} bài đã quá hạn. `}</Typography>{open}</Typography>
        ) : (
          <>
            <Typography component="p" variant="h6">{`${count} bài đã quá hạn`}</Typography>
            <Typography sx={t.type.small}>{`${open} Bài đã đóng thì hỏi giáo viên.`}</Typography>
          </>
        )}
      </Box>
    </Box>
  );
}

/** Quá hạn (H11 web / H02d mobile). Late hand-in is a normal button, never the page's contained one. */
export function OverdueBoard({ items, now, mobile, onAsk, onOpen }: { items: StudentDashboardAssignment[]; now: number; mobile: boolean; onAsk: (a: StudentDashboardAssignment) => void; onOpen: (id: string) => void }) {
  const action = (a: StudentDashboardAssignment) => <LateAction a={a} onAsk={onAsk} onOpen={onOpen} />;
  return (
    <>
      {items.length ? <Notice count={items.length} mobile={mobile} /> : null}
      {mobile ? items.map((a) => (
        <Box data-design="overdue-card" key={a.id} sx={{ ...boardCardSx, display: "grid", gap: 1.5, p: 2 }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
            <SubjectIcon assignment={a} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2">{a.title}</Typography>
              <Typography color="text.secondary" variant="caption">{meta(a)}</Typography>
            </Box>
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <AgoPill a={a} now={now} />
            <StateText a={a} />
            <Typography color="text.secondary" variant="body2">{a.closed ? "cô đã chốt điểm" : lateUntil(a)}</Typography>
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}><Reward a={a} />{action(a)}</Box>
        </Box>
      )) : (
        <Box sx={boardCardSx}>
          <Box sx={{ ...tableHeadSx, gridTemplateColumns: WEB_COLUMNS }}>
            {["Bài", "Hạn nộp", "Nộp muộn", "Thưởng", ""].map((label, index) => <Typography color="text.secondary" key={index} variant="caption">{label}</Typography>)}
          </Box>
          {items.map((a) => (
            <Box data-design="overdue-row" key={a.id} sx={{ alignItems: "center", borderTop: 1, borderColor: "divider", columnGap: 2, display: "grid", gridTemplateColumns: WEB_COLUMNS, px: 2.5, py: 1.75 }}>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, minWidth: 0 }}>
                <SubjectIcon assignment={a} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap variant="subtitle2">{a.title}</Typography>
                  <Typography color="text.secondary" noWrap variant="caption">{meta(a)}</Typography>
                </Box>
              </Box>
              <Box><AgoPill a={a} now={now} /><Typography color="text.secondary" sx={{ mt: 0.25 }} variant="caption">{shortDue(a)}</Typography></Box>
              <Box>
                <StateText a={a} />
                <Typography color="text.secondary" component="p" variant="caption">{a.closed ? "giáo viên đã chốt điểm" : lateUntil(a)}</Typography>
              </Box>
              <Box><Reward a={a} /></Box>
              <Box sx={{ textAlign: "right" }}>{action(a)}</Box>
            </Box>
          ))}
        </Box>
      )}
      <Typography color="text.secondary" variant={mobile ? "body2" : "caption"}>
        {mobile ? "Quá hạn không làm mất chuỗi ngày: chỉ cần mỗi ngày nộp ít nhất 1 bài bất kỳ." : "Quá hạn không làm mất chuỗi ngày: chuỗi chỉ cần mỗi ngày nộp ít nhất 1 bài bất kỳ."}
      </Typography>
    </>
  );
}
