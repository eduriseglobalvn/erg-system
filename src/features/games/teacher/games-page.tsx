import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgTable } from "@/components/erg-mui/erg-table";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { fetchGameRooms } from "@/features/games/game-api";
import type { RoomStatus, RoomSummary } from "@/features/games/game-types";
import { HACK_GAME_DISPLAY_NAME } from "@/features/games/hack/hack-tokens";
import { HACK_FACTS } from "@/features/games/teacher/game-catalog";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

const STATUS_LABEL: Record<RoomStatus, { label: string; tone: "info" | "success" | "warning" | "neutral" | "error" }> = {
  LOBBY: { label: "Đang chờ", tone: "info" },
  COUNTDOWN: { label: "Sắp chạy", tone: "warning" },
  RUNNING: { label: "Đang chơi", tone: "warning" },
  PAUSED: { label: "Tạm dừng", tone: "warning" },
  ENDING: { label: "Đang chốt", tone: "warning" },
  ENDED: { label: "Đã xong", tone: "success" },
  CANCELLED: { label: "Đã hủy", tone: "neutral" },
};
const isOpen = (status: RoomStatus) => status !== "ENDED" && status !== "CANCELLED";

type GamesViewProps = {
  rooms: RoomSummary[];
  loading: boolean;
  onNew: () => void;
  onEnter: (roomId: string) => void;
  /** "Chơi lại" on an ended room: new room on the same quiz and class. */
  onReplay: (room: RoomSummary) => void;
};

/** "64%", or "—" while nobody has answered. */
const formatAccuracy = (accuracy: number | null) => (accuracy === null ? "—" : `${Math.round(accuracy * 100)}%`);

/** One row of the open-rooms / history table. */
function RoomRow({ room, onEnter, onReplay }: { room: RoomSummary; onEnter: (roomId: string) => void; onReplay: (room: RoomSummary) => void }) {
  const status = STATUS_LABEL[room.status];
  return (
    <TableRow hover>
      <TableCell>{HACK_GAME_DISPLAY_NAME}</TableCell>
      <TableCell sx={{ fontWeight: "fontWeightMedium" }}>{room.quizTitle}</TableCell>
      <TableCell>{room.className}</TableCell>
      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTimeVi(room.createdAt)} · {room.durationMinutes} phút</TableCell>
      <TableCell><ErgStatusChip label={status.label} tone={status.tone} /></TableCell>
      <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "fontWeightMedium" }}>{formatAccuracy(room.accuracy)}</TableCell>
      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
        {isOpen(room.status) ? (
          <ErgButton size="small" variant="outlined" onClick={() => onEnter(room.id)}>Vào phòng</ErgButton>
        ) : (
          // The report screen arrives with the report wave.
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>Báo cáo: sắp có</Typography>
            {room.status === "ENDED" ? <ErgButton size="small" variant="outlined" onClick={() => onReplay(room)}>Chơi lại</ErgButton> : null}
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
}

/** LMS 3 · Trang Trò chơi (LmsArena): game cards, open rooms and history. */
export function GamesView({ rooms, loading, onNew, onEnter, onReplay }: GamesViewProps) {
  const open = rooms.filter((room) => isOpen(room.status));
  const history = rooms.filter((room) => !isOpen(room.status));
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="h4" component="h1">Trò chơi</Typography>
        <ErgButton variant="contained" onClick={onNew}>Mở phòng mới</ErgButton>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 1.5 }}>
        <Paper variant="outlined" sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "fontWeightBold" }}>{HACK_GAME_DISPLAY_NAME}</Typography>
            <ErgStatusChip label="Sẵn sàng" tone="success" />
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>{HACK_FACTS.blurb}</Typography>
          <ErgButton variant="outlined" size="small" onClick={onNew} sx={{ mt: "auto" }}>Chọn bài để chơi</ErgButton>
        </Paper>
        {[2, 3, 4].map((n) => (
          <Paper key={n} variant="outlined" sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1, opacity: 0.7 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "fontWeightBold" }}>Trò chơi {n}</Typography>
              <ErgStatusChip label="Sắp có" tone="neutral" />
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>Chỗ dành cho trò tiếp theo.</Typography>
          </Paper>
        ))}
      </Box>
      {rooms.length === 0 && !loading ? (
        <ErgEmptyState title="Chưa có phòng nào" description="Chọn một bài trong Kho bài tập rồi bấm Mở trò chơi để tạo phòng đầu tiên." />
      ) : (
        <Paper variant="outlined" sx={{ overflow: "auto" }}>
          <ErgTable sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Trò chơi</TableCell>
                <TableCell>Bài</TableCell>
                <TableCell>Lớp</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Tỉ lệ đúng</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...open, ...history].map((room) => <RoomRow key={room.id} room={room} onEnter={onEnter} onReplay={onReplay} />)}
            </TableBody>
          </ErgTable>
        </Paper>
      )}
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Mục &quot;Trò chơi&quot; là nơi chứa mọi trò sau này; mỗi trò là một thẻ. Phòng đang mở vào lại được bằng nút &quot;Vào phòng&quot;.
      </Typography>
    </Box>
  );
}

/** /teacher/games: the teacher's own rooms (GET /rooms), open ones first. */
export function TeacherGamesPage() {
  const navigate = useNavigate();
  const rooms = useQuery({ queryKey: ["games", "rooms"], queryFn: () => fetchGameRooms(), refetchInterval: 15_000 });
  return (
    <GamesView
      rooms={rooms.data ?? []}
      loading={rooms.isPending}
      onNew={() => { void navigate({ href: teacherPath("/homework/exercise-bank") }); }}
      onEnter={(roomId) => { void navigate({ href: teacherPath(`/games/${encodeURIComponent(roomId)}`) }); }}
      onReplay={(room) => { void navigate({ href: `${teacherPath("/games/new")}?quizId=${encodeURIComponent(room.quizId)}&classId=${encodeURIComponent(room.classId)}` }); }}
    />
  );
}

export default TeacherGamesPage;
