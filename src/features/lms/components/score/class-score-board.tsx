import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { ergChipTabsSx } from "@/components/erg-mui/erg-tabs";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import {
  attemptMinutes, awaitsGrading, buildTopicBoard, loadClassScoreBoard, scoreText,
  type ClassScoreBoard as Board, type ScoreBoardAttempt, type ScoreBoardStudent,
} from "@/features/lms/api/lms-class-score-board-api";

type View = "topic" | "all" | "manual";

const studentName = (student: ScoreBoardStudent) => student.fullName || student.studentCode || "Học sinh";
const containerSx = { border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", maxHeight: "70vh" } as const;
const stickySx = { position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 1, minWidth: 180 } as const;
const minutesText = (attempt: ScoreBoardAttempt) => {
  const seconds = attempt.durationSeconds;
  if (seconds === null || seconds === undefined) return "";
  return seconds < 60 ? `${Math.max(1, Math.round(seconds))} giây` : `${attemptMinutes(attempt)} phút`;
};

function Score({ attempt, note }: { attempt: ScoreBoardAttempt; note?: string }) {
  const sub = awaitsGrading(attempt) ? "Chờ chấm" : note;
  return (
    <Box title={`${attempt.quizTitle ?? attempt.assignmentTitle ?? ""} · nộp ${formatDateTimeVi(attempt.submittedAt)}${minutesText(attempt) ? ` · làm ${minutesText(attempt)}` : ""}`}>
      <Typography component="span" variant="body2" sx={{ fontWeight: "fontWeightMedium" }}>{scoreText(attempt.score)}</Typography>
      {sub ? <Typography component="div" variant="caption" sx={{ color: "text.secondary" }}>{sub}</Typography> : null}
    </Box>
  );
}

/** Board 2: one pair «Cao nhất | Gần nhất» per topic (or per quiz when the quiz is not of one topic). */
function TopicBoard({ board }: { board: Board }) {
  const model = buildTopicBoard(board);
  return (
    <TableContainer sx={containerSx}>
      <Table stickyHeader size="small" aria-label="Bảng điểm theo chủ đề">
        <TableHead>
          <TableRow>
            <TableCell rowSpan={2} sx={{ ...stickySx, zIndex: 3 }}>Học sinh</TableCell>
            {model.columns.map((column) => (
              <TableCell key={column.key} align="center" colSpan={2} sx={{ borderLeft: 1, borderLeftColor: "divider", minWidth: 150 }}>
                {column.title}
                {column.maxScore === null ? null : <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}> /{scoreText(column.maxScore)}</Typography>}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            {model.columns.flatMap((column) => [
              <TableCell key={`${column.key}-best`} align="center" sx={{ top: 37, borderLeft: 1, borderLeftColor: "divider" }}>Cao nhất</TableCell>,
              <TableCell key={`${column.key}-latest`} align="center" sx={{ top: 37 }}>Gần nhất</TableCell>,
            ])}
          </TableRow>
        </TableHead>
        <TableBody>
          {board.students.map((student) => (
            <TableRow key={student.id} hover>
              <TableCell component="th" scope="row" sx={stickySx}>{studentName(student)}</TableCell>
              {model.columns.flatMap((column) => {
                const cell = model.cellOf(student.id, column.key);
                return [
                  <TableCell key={`${column.key}-best`} align="center" sx={{ borderLeft: 1, borderLeftColor: "divider" }}>
                    {cell ? <Score attempt={cell.best} note={cell.tieMinutes === null ? undefined : `${cell.tieMinutes} phút`} /> : "–"}
                  </TableCell>,
                  <TableCell key={`${column.key}-latest`} align="center">{cell ? <Score attempt={cell.latest} /> : "–"}</TableCell>,
                ];
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Board 1: every handed-in attempt, newest first, optionally of one student. */
function AllAttempts({ board }: { board: Board }) {
  const [studentId, setStudentId] = useState("");
  const names = new Map(board.students.map((student) => [student.id, studentName(student)]));
  const rows = board.attempts.filter((attempt) => !studentId || attempt.studentId === studentId);
  return (
    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      <TextField select size="small" label="Học sinh" value={studentId} onChange={(event) => setStudentId(event.target.value)} sx={{ maxWidth: 320 }} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
        <MenuItem value="">Tất cả học sinh</MenuItem>
        {board.students.map((student) => <MenuItem key={student.id} value={student.id}>{studentName(student)}</MenuItem>)}
      </TextField>
      <TableContainer sx={containerSx}>
        <Table stickyHeader size="small" aria-label="Tất cả lượt làm bài">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...stickySx, zIndex: 3 }}>Học sinh</TableCell>
              <TableCell>Bài tập</TableCell>
              <TableCell>Chủ đề</TableCell>
              <TableCell align="right">Điểm</TableCell>
              <TableCell align="right">Thời gian làm</TableCell>
              <TableCell>Nộp lúc</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((attempt) => (
              <TableRow key={attempt.id} hover>
                <TableCell component="th" scope="row" sx={stickySx}>{names.get(attempt.studentId) ?? "Học sinh"}</TableCell>
                <TableCell>{attempt.assignmentTitle || attempt.quizTitle || "Bài tập"}</TableCell>
                <TableCell>{attempt.topicName || "–"}</TableCell>
                <TableCell align="right">
                  {scoreText(attempt.score)}{attempt.maxScore === null || attempt.maxScore === undefined ? "" : ` / ${scoreText(attempt.maxScore)}`}
                  {awaitsGrading(attempt) ? <Typography component="div" variant="caption" sx={{ color: "text.secondary" }}>Chờ chấm</Typography> : null}
                </TableCell>
                <TableCell align="right">{minutesText(attempt) || "–"}</TableCell>
                <TableCell>{formatDateTimeVi(attempt.submittedAt) || "–"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

/** Scores of the work the class handed in. `manual` adds the hand-entered sheet as a third tab (teachers only). */
export function ClassScoreBoard({ classId, manual }: { classId?: string; manual?: ReactNode }) {
  const [view, setView] = useState<View>("topic");
  const query = useQuery({
    enabled: Boolean(classId),
    queryFn: ({ signal }) => loadClassScoreBoard(classId ?? "", signal),
    queryKey: ["lms", "class-score-board", classId],
  });
  const board = query.data;

  let body: ReactNode;
  if (view === "manual") body = manual;
  else if (!classId) body = <ErgEmptyState title="Chọn một lớp để xem điểm" />;
  else if (query.isPending) body = <ErgLoadingSkeleton rows={6} />;
  else if (query.isError || !board) body = <ErgErrorState title="Không tải được bảng điểm" description="Kiểm tra kết nối rồi thử lại." />;
  else if (!board.attempts.length) body = <ErgEmptyState title="Chưa có bài nào được nộp" description="Điểm sẽ hiện ở đây ngay khi học sinh nộp bài." />;
  else body = view === "topic" ? <TopicBoard board={board} /> : <AllAttempts board={board} />;

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Tabs aria-label="Kiểu bảng điểm" value={view} variant="scrollable" scrollButtons={false} sx={ergChipTabsSx} onChange={(_, next: View) => setView(next)}>
        <Tab label="Theo chủ đề" value="topic" />
        <Tab label="Tất cả lượt làm" value="all" />
        {manual ? <Tab label="Sổ điểm nhập tay" value="manual" /> : null}
      </Tabs>
      {view === "topic" && board?.attempts.length ? (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          «Cao nhất» là lượt điểm cao nhất; nếu nhiều lượt bằng điểm thì lấy lượt làm nhanh hơn và ghi số phút. «Gần nhất» là lượt nộp sau cùng.
        </Typography>
      ) : null}
      {board?.truncated && view !== "manual" ? <Alert severity="warning">Lớp có quá nhiều lượt làm, bảng chỉ tính trên các lượt gần đây nhất.</Alert> : null}
      {body}
    </Stack>
  );
}
