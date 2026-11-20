import Box from "@mui/material/Box";

import type { LobbyData, RoomSummary } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { HackButton, HackScreen, Panel, formatNumber, toHandle } from "@/features/games/hack/ui/hack-ui";
import { HostBar } from "@/features/games/teacher/host-bar";

const c = hk.color;
const SHOWN = 15;

type LobbyViewProps = {
  room: RoomSummary | undefined;
  lobby: LobbyData | null;
  teacherLabel: string;
  /** Where students type the code, shown under it (QR is not built: no QR library is installed). */
  joinUrl: string;
  busy: boolean;
  onStart: () => void;
  onCancel: () => void;
};

/** GV 2 · Phòng chờ (HTeacherLobby), while the room is LOBBY. */
export function LobbyView({ room, lobby, teacherLabel, joinUrl, busy, onStart, onCancel }: LobbyViewProps) {
  const players = lobby?.players ?? [];
  const count = lobby?.count ?? room?.playerCount ?? 0;
  const classSize = Math.max(lobby?.classSize ?? 0, count);
  const waiting = classSize - count;
  const shown = players.slice(0, SHOWN);
  const hidden = Math.max(0, count - shown.length);
  const countLine = `${classSize > count ? `${formatNumber(count)} / ${formatNumber(classSize)}` : formatNumber(count)} MÁY ĐÃ VÀO MẠNG`;

  return (
    <HackScreen phone={false} label="Phòng chờ giáo viên">
      <HostBar cells={[teacherLabel, `${room?.quizTitle.toUpperCase() ?? ""}`, room ? `${room.questionCount} nhiệm vụ · ${room.durationMinutes} phút · lớp ${room.className}` : ""]} />
      <Box sx={{ position: "relative", flex: 1, display: "flex", gap: "20px", padding: "20px 24px 24px" }}>
        <Panel sx={{ width: "440px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", padding: "28px 24px", boxSizing: "border-box", textAlign: "center" }}>
          <Box sx={{ color: c.dim, fontSize: hk.fs[13], fontWeight: hk.font.weightBold }}>MÃ PHÒNG</Box>
          <Box aria-label={`Mã phòng ${room?.code ?? ""}`} sx={{ color: c.green, fontSize: hk.fs[120], fontWeight: hk.font.weightBold, lineHeight: 1, letterSpacing: "0.04em" }}>{room?.code ?? "----"}</Box>
          <Box sx={{ color: c.white, fontSize: hk.fs[18], fontWeight: hk.font.weightBold, overflowWrap: "anywhere" }}>{joinUrl}</Box>
          <Box sx={{ marginTop: "auto", color: c.dim, fontSize: hk.fs[13], lineHeight: 1.7 }}>
            Học sinh đã đăng nhập LMS chỉ cần nhập mã phòng. Phòng không tự đóng khi đang chờ.
          </Box>
        </Panel>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px" }}>
            <Box sx={{ fontSize: hk.fs[26], fontWeight: hk.font.weightBold, color: c.green }}>{countLine}</Box>
            {waiting > 0 ? <Box sx={{ fontSize: hk.fs[13], color: c.dim }}>còn chờ {waiting} máy</Box> : null}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "10px", fontSize: hk.fs[14], fontWeight: hk.font.weightBold }}>
            {shown.map((player) => (
              <Box key={player.playerId} sx={{ border: `1px solid ${c.border}`, bgcolor: c.panel, borderRadius: `${hk.radius.panel}px`, padding: "12px", overflowWrap: "anywhere" }}>{toHandle(player.displayName)}</Box>
            ))}
            {hidden > 0 ? <Box sx={{ border: `1px dashed ${c.border}`, borderRadius: `${hk.radius.panel}px`, padding: "12px", color: c.dim }}>+{hidden} máy khác</Box> : null}
          </Box>
          <Box sx={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
            <Box sx={{ flex: 1, color: c.dim, fontSize: hk.fs[13], lineHeight: 1.7 }}>
              {room?.rules.allowLateJoin ? "Học sinh vào muộn vẫn tham gia được, bắt đầu từ nhiệm vụ 1." : "Phòng khóa cửa sau khi bắt đầu."}
            </Box>
            <HackButton outline disabled={busy} onClick={onCancel} fontSize={hk.fs[15]} paddingX={22}>HỦY PHÒNG</HackButton>
            <HackButton disabled={busy || count === 0} onClick={onStart} fontSize={hk.fs[20]} minHeight={60}>&gt; PHÁT LỆNH BẮT ĐẦU</HackButton>
          </Box>
        </Box>
      </Box>
    </HackScreen>
  );
}
