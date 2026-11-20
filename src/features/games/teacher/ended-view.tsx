import Box from "@mui/material/Box";

import type { FinalEntry, RoomSummary } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { HackButton, HackScreen, Panel, formatNumber, toHandle } from "@/features/games/hack/ui/hack-ui";
import { HostBar } from "@/features/games/teacher/host-bar";

const c = hk.color;
const SHOWN = 10;

type EndedViewProps = {
  room: RoomSummary | undefined;
  teacherLabel: string;
  final: FinalEntry[];
  cancelled: boolean;
  onExit: () => void;
};

/** Final ranking when the room is ENDED (the full report is a later wave) or a notice when it was CANCELLED. */
export function EndedView({ room, teacherLabel, final, cancelled, onExit }: EndedViewProps) {
  return (
    <HackScreen phone={false} label="Kết thúc trận">
      <HostBar cells={[`${teacherLabel} · PHÒNG ${room?.code ?? ""}`, room?.quizTitle.toUpperCase() ?? ""]} />
      <Box sx={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: "18px", padding: "24px", minHeight: 0 }}>
        <Box sx={{ fontSize: hk.fs[30], fontWeight: hk.font.weightBold, color: cancelled ? c.pink : c.green }}>
          {cancelled ? "PHÒNG ĐÃ HỦY" : "TRẬN ĐÃ KẾT THÚC"}
        </Box>
        {cancelled || final.length === 0 ? (
          <Panel sx={{ padding: "18px 22px", color: c.dim, fontSize: hk.fs[15] }}>{cancelled ? "Phòng bị hủy trước khi bắt đầu, không có kết quả." : "Không có máy nào ghi điểm."}</Panel>
        ) : (
          <Panel sx={{ padding: "14px 22px", fontSize: hk.fs[16], display: "flex", flexDirection: "column", gap: "8px", overflow: "auto" }}>
            <Box sx={{ display: "flex", gap: "12px", color: c.dim, fontSize: hk.fs[12], fontWeight: hk.font.weightBold }}>
              <Box sx={{ width: "36px" }}>HẠNG</Box><Box sx={{ flex: 1 }}>MÁY</Box><Box sx={{ width: "110px", textAlign: "right" }}>SAO</Box><Box sx={{ width: "110px", textAlign: "right" }}>XU</Box><Box sx={{ width: "110px", textAlign: "right" }}>TỔNG</Box><Box sx={{ width: "110px", textAlign: "right" }}>ĐÚNG</Box>
            </Box>
            {final.slice(0, SHOWN).map((entry) => (
              <Box key={entry.playerId} sx={{ display: "flex", gap: "12px", fontWeight: hk.font.weightBold, color: entry.rank === 1 ? c.yellow : c.text }}>
                <Box sx={{ width: "36px" }}>{String(entry.rank).padStart(2, "0")}</Box>
                <Box sx={{ flex: 1 }}>{toHandle(entry.displayName)}</Box>
                <Box sx={{ width: "110px", textAlign: "right", color: c.cyan }}>{formatNumber(entry.stars)}</Box>
                <Box sx={{ width: "110px", textAlign: "right", color: c.yellow }}>{formatNumber(entry.coins)}</Box>
                <Box sx={{ width: "110px", textAlign: "right" }}>{formatNumber(entry.total)}</Box>
                <Box sx={{ width: "110px", textAlign: "right", color: c.dim }}>{entry.correctCount}/{entry.answeredCount}</Box>
              </Box>
            ))}
            {final.length > SHOWN ? <Box sx={{ color: c.dim, fontSize: hk.fs[13] }}>+{final.length - SHOWN} máy khác</Box> : null}
          </Panel>
        )}
        <Box sx={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ color: c.dim, fontSize: hk.fs[13] }}>Báo cáo chi tiết sẽ có ở đợt sau.</Box>
          <HackButton onClick={onExit} fontSize={hk.fs[18]}>&gt; VỀ TRANG TRÒ CHƠI</HackButton>
        </Box>
      </Box>
    </HackScreen>
  );
}
