import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import type { LobbyData, PlayerState, RoomSummary } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { Cursor, HackScreen, Panel, TermLine, WindowTitle, formatNumber, toHandle } from "@/features/games/hack/ui/hack-ui";

const c = hk.color;

type LobbyScreenProps = {
  phone: boolean;
  me: PlayerState | null;
  lobby: LobbyData | null;
  room: RoomSummary | undefined;
  onLeave: () => void;
};

function LeaveButton({ phone, onLeave }: { phone: boolean; onLeave: () => void }) {
  return (
    <ButtonBase
      type="button"
      onClick={onLeave}
      sx={{ border: 0, borderLeft: `1px solid ${c.border}`, bgcolor: "transparent", color: c.pink, fontFamily: "inherit", fontSize: phone ? hk.fs[12] : hk.fs[14], fontWeight: hk.font.weightBold, padding: phone ? "0 12px" : "0 18px", minHeight: "44px" }}
    >
      {phone ? "[X] THOÁT" : "[X] NGẮT KẾT NỐI"}
    </ButtonBase>
  );
}

function PlayerTile({ name, you, phone }: { name: string; you?: boolean; phone: boolean }) {
  return (
    <Box
      sx={{
        border: you ? `2px solid ${c.green}` : `1px solid ${c.border}`,
        bgcolor: you ? c.selected : c.panel,
        borderRadius: `${hk.radius.panel}px`,
        padding: phone ? (you ? "9px 10px" : "10px") : "12px",
        color: you ? c.white : undefined,
        overflowWrap: "anywhere",
      }}
    >
      {phone && you ? `${name} · bạn` : name}
      {phone ? null : <Box sx={{ fontSize: hk.fs[12], color: you ? c.green : c.dim }}>{you ? "bạn" : "sẵn sàng"}</Box>}
    </Box>
  );
}

function HowToPlay({ phone }: { phone: boolean }) {
  const rows: [string, string, string][] = [
    ["SAO", c.cyan, phone ? "đúng là có, khóa trong két" : "trả lời đúng là có, khóa trong két"],
    ["XU", c.yellow, phone ? "giải mã gói, có thể bị hack" : "giải mã gói dữ liệu, có thể bị hack"],
    ["HACK", c.red, phone ? "vượt 1 câu khó, rút 10% xu" : "vượt 1 câu khó để rút 10% xu"],
    ["TƯỜNG LỬA", c.green, phone ? "đúng 3 câu liền là bật" : "đúng 3 câu liên tiếp là bật"],
  ];
  return (
    <>
      <Box sx={{ marginTop: phone ? 0 : "18px", color: c.dim, fontSize: phone ? hk.fs[11] : hk.fs[12], fontWeight: hk.font.weightBold }}>CÁCH CHƠI</Box>
      {rows.map(([label, color, text]) => (
        <Box key={label}><Box component="span" sx={{ color, fontWeight: hk.font.weightBold }}>{label}</Box> · {text}</Box>
      ))}
    </>
  );
}

/** 02 · Phòng chờ (HLobby / HPLobby). */
export function LobbyScreen({ phone, me, lobby, room, onLeave }: LobbyScreenProps) {
  const myId = me?.playerId;
  const count = lobby?.count ?? room?.playerCount ?? 0;
  const others = (lobby?.players ?? []).filter((player) => player.playerId !== myId);
  const shown = others.slice(0, phone ? 4 : 10);
  const hidden = Math.max(0, count - shown.length - (me ? 1 : 0));
  const classSize = Math.max(lobby?.classSize ?? 0, count);
  const waiting = classSize - count;
  const countLine = `${classSize > count ? `${formatNumber(count)} / ${formatNumber(classSize)}` : formatNumber(count)} MÁY ĐÃ VÀO MẠNG`;
  const handle = me ? toHandle(me.displayName) : "";
  const taskLine = room ? `tải ${room.questionCount} nhiệm vụ: ${room.quizTitle}` : "tải nhiệm vụ";

  const tiles = (
    <Box sx={{ display: "grid", gridTemplateColumns: phone ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: phone ? "8px" : "10px", fontSize: phone ? hk.fs[13] : hk.fs[14], fontWeight: hk.font.weightBold }}>
      {me ? <PlayerTile name={handle} you phone={phone} /> : null}
      {shown.map((player) => <PlayerTile key={player.playerId} name={toHandle(player.displayName)} phone={phone} />)}
      {hidden > 0 ? (
        <Box sx={{ border: `1px dashed ${c.border}`, borderRadius: `${hk.radius.panel}px`, padding: phone ? "10px" : "12px", color: c.dim }}>
          +{hidden} máy khác
          {phone ? null : <Box sx={{ fontSize: hk.fs[12] }}>đã vào</Box>}
        </Box>
      ) : null}
    </Box>
  );

  const noteBox = (
    <Panel sx={{ marginTop: "auto", borderColor: c.yellow, padding: phone ? "12px 14px" : "16px 20px", fontSize: phone ? hk.fs[13] : hk.fs[15], lineHeight: phone ? 1.6 : 1.7 }}>
      <Box component="span" sx={{ color: c.yellow, fontWeight: hk.font.weightBold }}>GHI NHỚ:</Box>{" "}
      {phone ? "thuộc bài thì két sao luôn đầy, không ai lấy được." : "thuộc bài thì két sao luôn đầy, không ai lấy được. May mắn chỉ quyết định túi xu."}
    </Panel>
  );

  if (phone) {
    return (
      <HackScreen phone label="Phòng chờ">
        <Box sx={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: c.panel, borderBottom: `1px solid ${c.border}`, fontSize: hk.fs[12], fontWeight: hk.font.weightBold, padding: "0 0 0 14px" }}>
          <Box component="span" sx={{ color: c.green }}>root@{handle.toLowerCase()} · phòng {room?.code ?? ""}</Box>
          <LeaveButton phone onLeave={onLeave} />
        </Box>
        <Box sx={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: "12px", padding: "14px 14px 16px" }}>
          <Panel sx={{ padding: "12px 14px", fontSize: hk.fs[13], lineHeight: 1.85 }}>
            <TermLine tag="[OK]">mật danh: <Box component="span" sx={{ color: c.white, fontWeight: hk.font.weightBold }}>{handle}</Box></TermLine>
            <TermLine tag="[OK]">{taskLine}</TermLine>
            <Box sx={{ color: c.yellow }}>[..] chờ cô giáo phát lệnh <Cursor color={c.yellow} /></Box>
          </Panel>
          <Box sx={{ fontSize: hk.fs[20], fontWeight: hk.font.weightBold, color: c.green }}>{countLine}</Box>
          {tiles}
          <Panel sx={{ padding: "12px 14px", fontSize: hk.fs[13], lineHeight: 1.9 }}><HowToPlay phone /></Panel>
          {noteBox}
        </Box>
      </HackScreen>
    );
  }

  return (
    <HackScreen phone={false} label="Phòng chờ">
      <Box sx={{ position: "relative", display: "flex", alignItems: "stretch", bgcolor: c.panel, borderBottom: `1px solid ${c.border}`, fontSize: hk.fs[14], fontWeight: hk.font.weightBold }}>
        <Box sx={{ padding: "12px 18px", borderRight: `1px solid ${c.border}`, color: c.green }}>root@{handle.toLowerCase()}</Box>
        <Box sx={{ padding: "12px 18px", borderRight: `1px solid ${c.border}` }}>PHÒNG {room?.code ?? ""}{room ? ` · ${room.quizTitle.toUpperCase()}` : ""}</Box>
        <Box sx={{ flex: 1 }} />
        <LeaveButton phone={false} onLeave={onLeave} />
      </Box>
      <Box sx={{ position: "relative", flex: 1, display: "flex", gap: "20px", padding: "20px 24px 24px" }}>
        <Panel sx={{ width: "520px", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
          <WindowTitle>terminal — ket_noi.sh</WindowTitle>
          <Box sx={{ padding: "18px", fontSize: hk.fs[15], lineHeight: 1.9, flex: 1 }}>
            <Box><Box component="span" sx={{ color: c.green }}>$</Box> ./ket_noi.sh --phong {room?.code ?? ""}</Box>
            <TermLine tag="[OK]">xác thực tài khoản LMS</TermLine>
            <TermLine tag="[OK]">mật danh: <Box component="span" sx={{ color: c.white, fontWeight: hk.font.weightBold }}>{handle}</Box></TermLine>
            <TermLine tag="[OK]">{taskLine}</TermLine>
            <Box sx={{ color: c.yellow }}>[..] chờ cô giáo phát lệnh bắt đầu <Cursor color={c.yellow} /></Box>
            <HowToPlay phone={false} />
          </Box>
        </Panel>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Box sx={{ fontSize: hk.fs[26], fontWeight: hk.font.weightBold, color: c.green }}>{countLine}</Box>
            {waiting > 0 ? <Box sx={{ fontSize: hk.fs[13], color: c.dim }}>còn chờ {waiting} máy</Box> : null}
          </Box>
          {tiles}
          {noteBox}
        </Box>
      </Box>
    </HackScreen>
  );
}
