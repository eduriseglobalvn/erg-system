import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import type { ClassStats, LeaderboardData, RoomStatus } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { formatClock, formatNumber, HackScreen, Panel, toHandle } from "@/features/games/hack/ui/hack-ui";
import { HostBar } from "@/features/games/teacher/host-bar";
import { useNow } from "@/features/games/use-now";

const c = hk.color;
const WORST_SHOWN = 3;
const FEED_SHOWN = 4;
const BOARD_ROWS = 8;

type LiveViewProps = {
  roomCode: string;
  teacherLabel: string;
  phase: RoomStatus;
  getRemainingMs: () => number;
  /** ms until the first question while COUNTDOWN. */
  getCountdownMs: () => number;
  leaderboard: LeaderboardData | null;
  feed: { at: string; text: string; tone: string }[];
  /** Game clock of a feed line (mm:ss left), or null. */
  feedClock: (at: string) => string | null;
  stats: ClassStats | null;
  /** room.rules.allowHack: the "lần hack thắng" tile only exists when hacking is on. */
  allowHack: boolean;
  busy: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
};

const feedTone = (tone: string) => (tone === "loot" ? c.yellow : tone === "firewall" ? c.green : c.pink);

function Clock({ getRemainingMs, paused }: { getRemainingMs: () => number; paused: boolean }) {
  useNow(250);
  return <Box sx={{ padding: "8px 24px", fontSize: hk.fs[34], fontWeight: hk.font.weightBold, color: paused ? c.yellow : c.white }}>{formatClock(getRemainingMs())}</Box>;
}

function Countdown({ getCountdownMs }: { getCountdownMs: () => number }) {
  useNow(250);
  return <Box sx={{ alignSelf: "center", padding: "0 18px", color: c.yellow }}>BẮT ĐẦU SAU {Math.max(0, Math.ceil(getCountdownMs() / 1000))}</Box>;
}

function BarRow({ rank, name, stars, coins, total, max, first }: { rank: number; name: string; stars: number; coins: number; total: number; max: number; first: boolean }) {
  const scale = max > 0 ? 100 / max : 0;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", fontSize: hk.fs[16], fontWeight: hk.font.weightBold, color: first ? c.yellow : c.text }}>
      <Box sx={{ width: "28px" }}>{String(rank).padStart(2, "0")}</Box>
      <Box sx={{ width: "170px", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</Box>
      <Box sx={{ flex: 1, display: "flex", height: "18px" }} aria-hidden="true">
        <Box sx={{ width: `${stars * scale}%`, bgcolor: c.cyan }} />
        <Box sx={{ width: `${coins * scale}%`, bgcolor: c.yellow }} />
      </Box>
      <Box sx={{ width: "70px", textAlign: "right" }}>{formatNumber(total)}</Box>
    </Box>
  );
}

function ControlButton({ children, onClick, disabled, color }: { children: string; onClick: () => void; disabled?: boolean; color?: string }) {
  return (
    <ButtonBase type="button" onClick={onClick} disabled={disabled} sx={{ padding: "0 18px", borderLeft: `1px solid ${c.border}`, color: color ?? c.text, fontFamily: "inherit", fontSize: hk.fs[14], fontWeight: hk.font.weightBold, "&.Mui-focusVisible": { outline: `2px solid ${c.white}`, outlineOffset: "-2px" } }}>
      {children}
    </ButtonBase>
  );
}

/** avgProgress has one decimal: "11" or "11,5". */
const formatProgress = (value: number) => String(Math.round(value * 10) / 10).replace(".", ",");

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <Box>
      <Box sx={{ fontSize: hk.fs[26], fontWeight: hk.font.weightBold, color }}>{value}</Box>
      <Box sx={{ color: c.dim, fontSize: hk.fs[12] }}>{label}</Box>
    </Box>
  );
}

/** GV 3 · Màn chiếu (HTeacherLive): COUNTDOWN, RUNNING, PAUSED and ENDING. */
export function LiveView({ roomCode, teacherLabel, phase, getRemainingMs, getCountdownMs, leaderboard, feed, feedClock, stats, allowHack, busy, onPause, onResume, onEnd }: LiveViewProps) {
  const top = (leaderboard?.top ?? []).slice(0, BOARD_ROWS);
  const max = Math.max(0, ...top.map((entry) => entry.total));
  const worst = (stats?.perQuestion ?? []).filter((q) => q.wrongPlayers > 0).sort((a, b) => b.wrongPlayers - a.wrongPlayers).slice(0, WORST_SHOWN);
  const paused = phase === "PAUSED";
  const online = stats?.playersOnline ?? 0;

  return (
    <HackScreen phone={false} label="Màn chiếu giáo viên">
      <HostBar cells={[`${teacherLabel} · PHÒNG ${roomCode}`, `${online} MÁY ĐANG CHẠY`, stats ? `TỈ LỆ ĐÚNG CẢ LỚP ${Math.round(stats.accuracy * 100)}%` : "CHƯA CÓ LƯỢT TRẢ LỜI"]}>
        {phase === "COUNTDOWN" ? <Countdown getCountdownMs={getCountdownMs} /> : null}
        {phase === "RUNNING" || paused ? <ControlButton disabled={busy} onClick={paused ? onResume : onPause}>{paused ? "TIẾP TỤC" : "TẠM DỪNG"}</ControlButton> : null}
        {phase === "ENDING" ? null : <ControlButton disabled={busy} onClick={onEnd} color={c.pink}>[X] KẾT THÚC SỚM</ControlButton>}
        <Clock getRemainingMs={getRemainingMs} paused={paused} />
      </HostBar>
      <Box sx={{ position: "relative", flex: 1, display: "flex", gap: "20px", padding: "20px 24px 24px", minHeight: 0 }}>
        <Panel sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "18px", padding: "18px 22px", minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", color: c.dim, fontSize: hk.fs[12], fontWeight: hk.font.weightBold }}>
            <span>BẢNG XẾP HẠNG TRỰC TIẾP</span>
            <span><Box component="span" sx={{ color: c.cyan }}>■ sao (thuộc bài)</Box>{"  "}<Box component="span" sx={{ color: c.yellow }}>■ xu (may mắn)</Box></span>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {top.length === 0 ? <Box sx={{ color: c.dim, fontSize: hk.fs[14] }}>Chưa có ai ghi điểm.</Box> : null}
            {top.map((entry) => <BarRow key={entry.playerId} rank={entry.rank} name={toHandle(entry.displayName)} stars={entry.stars} coins={entry.coins} total={entry.total} max={max} first={entry.rank === 1} />)}
          </Box>
          <Box sx={{ marginTop: "auto", borderTop: `1px solid ${c.border}`, paddingTop: "12px", fontSize: hk.fs[13], lineHeight: 1.9 }}>
            <Box sx={{ color: c.dim, fontSize: hk.fs[11], fontWeight: hk.font.weightBold }}>TIN TRÊN MẠNG</Box>
            {feed.slice(0, FEED_SHOWN).map((item, index) => (
              <Box key={`${item.at}-${index}`} sx={{ color: feedTone(item.tone) }}>{feedClock(item.at) ?? ""} {item.text}</Box>
            ))}
          </Box>
        </Panel>
        <Box sx={{ width: "400px", display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0 }}>
          <Panel sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", padding: "16px 20px", borderColor: c.weakBorder, bgcolor: c.weakPanel }}>
            <Box sx={{ color: c.pink, fontSize: hk.fs[12], fontWeight: hk.font.weightBold }}>LỖ HỔNG CỦA LỚP · CÂU SAI NHIỀU NHẤT</Box>
            {worst.length === 0 ? <Box sx={{ color: c.dim, fontSize: hk.fs[13] }}>Chưa có câu nào bị sai nhiều.</Box> : null}
            {worst.map((question) => (
              <Box key={question.questionId} sx={{ border: `1px solid ${c.weakBorder}`, borderRadius: `${hk.radius.panel}px`, padding: "10px 12px", fontSize: hk.fs[14], fontWeight: hk.font.weightBold }}>
                {question.title}
                <Box sx={{ color: c.pink, fontSize: hk.fs[12], fontWeight: hk.font.weightMedium }}>{question.wrongPlayers}/{stats?.playerCount ?? 0} máy sai · {Math.round(question.wrongRate * 100)}%</Box>
              </Box>
            ))}
            <Box sx={{ marginTop: "auto", color: c.dim, fontSize: hk.fs[12] }}>Danh sách này được lưu vào LMS để cô giảng lại sau trận.</Box>
          </Panel>
          <Panel sx={{ display: "grid", gridTemplateColumns: `repeat(${allowHack ? 3 : 2}, minmax(0, 1fr))`, gap: "8px", padding: "14px 18px", textAlign: "center" }}>
            <Stat value={`${formatProgress(stats?.avgProgress ?? 0)}/${stats?.questionTotal ?? 0}`} label="tiến độ trung bình" color={c.white} />
            {allowHack ? <Stat value={formatNumber(stats?.hackWins ?? 0)} label="lần hack thắng" color={c.green} /> : null}
            <Stat value={formatNumber(stats?.firewallOn ?? 0)} label="máy bật tường lửa" color={c.yellow} />
          </Panel>
        </Box>
      </Box>
    </HackScreen>
  );
}
