import Box from "@mui/material/Box";

import type { PlayerState } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { Cursor, HackButton, HackScreen, Panel, TermLine, formatClock, formatNumber } from "@/features/games/hack/ui/hack-ui";
import { GAME_SOCKET_MAX_RETRIES } from "@/features/games/game-socket";
import { useNow } from "@/features/games/use-now";

const c = hk.color;

/** 03 · Đếm ngược 3 giây (HCount / HPCount). */
export function CountdownScreen({ phone, startsAt, clockOffsetMs, questionCount, durationMinutes }: { phone: boolean; startsAt: number | null; clockOffsetMs: number; questionCount?: number; durationMinutes?: number }) {
  const now = useNow(200);
  const left = startsAt === null ? 3 : Math.min(3, Math.max(1, Math.ceil((startsAt - (now + clockOffsetMs)) / 1000)));
  const clock = durationMinutes ? `${String(durationMinutes).padStart(2, "0")}:00` : "";
  return (
    <HackScreen phone={phone} tone="bright" center label="Đếm ngược" sx={{ gap: phone ? "12px" : "10px", padding: phone ? "0 14px" : 0 }}>
      <Box sx={{ position: "relative", fontSize: phone ? hk.fs[13] : hk.fs[18], fontWeight: hk.font.weightBold, color: c.yellow, letterSpacing: phone ? "0.16em" : "0.2em" }}>CÔ GIÁO ĐÃ PHÁT LỆNH</Box>
      <Box sx={{ position: "relative", fontSize: phone ? hk.fs[24] : hk.fs[44], fontWeight: hk.font.weightBold, color: c.green, textAlign: "center", lineHeight: phone ? 1.3 : undefined }}>
        {phone ? <>CHIẾN DỊCH<br />BẮT ĐẦU SAU</> : "CHIẾN DỊCH BẮT ĐẦU SAU"}
      </Box>
      <Box
        role="timer"
        aria-live="polite"
        sx={{ position: "relative", width: phone ? "210px" : "260px", height: phone ? "210px" : "260px", border: `6px solid ${c.green}`, bgcolor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: phone ? hk.fs[160] : hk.fs[200], fontWeight: hk.font.weightBold, color: c.white, lineHeight: 1, marginTop: phone ? 0 : "8px" }}
      >
        {left}
      </Box>
      <Panel sx={{ alignSelf: phone ? "stretch" : undefined, marginTop: phone ? "14px" : "16px", padding: phone ? "12px 14px" : "14px 22px", fontSize: phone ? hk.fs[13] : hk.fs[15], lineHeight: 1.9 }}>
        <TermLine tag="[OK]">{questionCount ?? ""} nhiệm vụ đã tải{phone ? "" : " · thứ tự mỗi máy khác nhau"}</TermLine>
        <TermLine tag="[OK]">đồng hồ chung {clock}{phone ? "" : " · mọi máy cùng dừng một lúc"}</TermLine>
        <TermLine tag="[OK]">mỗi máy làm theo tốc độ riêng{phone ? "" : ", không chờ nhau"}</TermLine>
      </Panel>
    </HackScreen>
  );
}

/** 13 · Mất kết nối (HReconnect / HPReconnect): amber, answer buttons are not rendered at all. */
export function ReconnectScreen({ phone, attempt, failed, droppedClock, me, onRetry, onLeave }: { phone: boolean; attempt: number; failed: boolean; droppedClock: string | null; me: PlayerState | null; onRetry: () => void; onLeave: () => void }) {
  return (
    <HackScreen phone={phone} amber tone="amber" center={!phone} label="Mất kết nối" sx={phone ? { alignItems: "center", gap: "12px", padding: "120px 14px 16px" } : { gap: "12px" }}>
      <Box sx={{ position: "relative", fontSize: phone ? hk.fs[12] : hk.fs[16], fontWeight: hk.font.weightBold, color: c.yellow, letterSpacing: phone ? "0.16em" : "0.2em" }}>TÍN HIỆU YẾU</Box>
      <Box sx={{ position: "relative", fontSize: phone ? hk.fs[34] : hk.fs[68], fontWeight: hk.font.weightBold, color: c.yellow, lineHeight: phone ? 1.2 : 1.1, border: `${phone ? 3 : 4}px solid ${c.yellow}`, padding: phone ? "4px 16px" : "4px 36px", bgcolor: c.amberBg }}>MẤT KẾT NỐI</Box>
      <Box sx={{ position: "relative", alignSelf: phone ? "stretch" : undefined, width: phone ? undefined : "700px", maxWidth: "100%", marginTop: phone ? "14px" : "18px", bgcolor: c.amberPanel, border: `1px solid ${c.amberBorder}`, borderRadius: `${hk.radius.panel}px`, padding: phone ? "14px" : "18px 22px", boxSizing: "border-box", fontSize: phone ? hk.fs[13] : hk.fs[15], lineHeight: 1.9 }}>
        {droppedClock ? <TermLine tag="[!!]" color={c.red}>rớt mạng lúc {droppedClock}</TermLine> : null}
        {failed ? (
          <TermLine tag="[!!]" color={c.red}>đã thử {GAME_SOCKET_MAX_RETRIES} lần, chưa nối lại được</TermLine>
        ) : (
          <TermLine tag="[..]" color={c.yellow}>đang nối lại · lần {Math.max(1, attempt)}/{GAME_SOCKET_MAX_RETRIES} <Cursor color={c.yellow} fg={c.amberBg} /></TermLine>
        )}
        {me ? <TermLine tag="[OK]">{phone ? `sao ${formatNumber(me.stars)}, xu ${formatNumber(me.coins)} đã lưu` : `sao ${formatNumber(me.stars)} và xu ${formatNumber(me.coins)} đã lưu trên máy chủ`}</TermLine> : null}
        <TermLine tag="[OK]">{phone ? "nhiệm vụ dở được giữ nguyên" : "nhiệm vụ đang làm dở được giữ nguyên"}</TermLine>
        {phone ? null : <Box sx={{ color: c.amberSoft }}>Đồng hồ chung vẫn chạy. Khi mất mạng, không ai hack được máy bạn.</Box>}
      </Box>
      {phone ? <Box sx={{ position: "relative", alignSelf: "stretch", fontSize: hk.fs[13], lineHeight: 1.7, color: c.amberSoft }}>Đồng hồ chung vẫn chạy. Khi mất mạng, không ai hack được máy bạn.</Box> : null}
      <Box sx={{ position: "relative", display: "flex", flexDirection: phone ? "column" : "row", alignSelf: phone ? "stretch" : undefined, gap: "12px", marginTop: phone ? "auto" : "10px" }}>
        <HackButton tone="amber" onClick={onRetry} fullWidth={phone} fontSize={phone ? hk.fs[17] : hk.fs[18]} paddingX={32}>&gt; THỬ LẠI NGAY</HackButton>
        <HackButton tone="amber" outline onClick={onLeave} fullWidth={phone} fontSize={phone ? hk.fs[14] : hk.fs[15]} minHeight={phone ? 48 : 56} paddingX={22}>THOÁT VỀ LMS</HackButton>
      </Box>
      {phone ? null : <Box sx={{ position: "relative", fontSize: hk.fs[13], color: c.amberSoft }}>Nối lại được: quay về đúng nhiệm vụ đang dở. Quá 5 lần: giữ điểm hiện có, vào lại bằng mã phòng.</Box>}
    </HackScreen>
  );
}

function Stat({ label, value, color, phone }: { label: string; value: number; color: string; phone: boolean }) {
  return (
    <Box sx={{ flex: phone ? 1 : undefined, width: phone ? undefined : "240px", bgcolor: c.panel, border: `2px solid ${color}`, borderRadius: `${hk.radius.panel}px`, padding: phone ? "10px 12px" : "12px 16px", boxSizing: "border-box" }}>
      <Box sx={{ fontSize: phone ? hk.fs[10] : hk.fs[12], fontWeight: hk.font.weightBold, color: c.dim }}>{label}</Box>
      <Box sx={{ fontSize: phone ? hk.fs[24] : hk.fs[34], fontWeight: hk.font.weightBold, color: color === c.green ? c.white : color }}>{formatNumber(value)}</Box>
    </Box>
  );
}

/** 14 · Hết giờ (HTimeUp / HPTimeUp). */
export function TimeUpScreen({ phone, me, questionCount }: { phone: boolean; me: PlayerState | null; questionCount?: number }) {
  const total = me ? me.stars + me.coins : 0;
  return (
    <HackScreen phone={phone} center={!phone} label="Hết giờ" sx={phone ? { alignItems: "center", gap: "12px", padding: "110px 14px 16px" } : { gap: "12px" }}>
      <Box sx={{ position: "relative", fontSize: phone ? hk.fs[12] : hk.fs[16], fontWeight: hk.font.weightBold, color: c.dim, letterSpacing: phone ? "0.12em" : "0.2em" }}>ĐỒNG HỒ VỀ {formatClock(0)} · MỌI MÁY DỪNG</Box>
      <Box sx={{ position: "relative", fontSize: phone ? hk.fs[58] : hk.fs[96], fontWeight: hk.font.weightBold, color: c.white, lineHeight: phone ? 1.15 : 1.1, border: `4px solid ${c.white}`, padding: phone ? "0 22px" : "0 40px", bgcolor: c.bg }}>HẾT GIỜ</Box>
      <Panel sx={{ alignSelf: phone ? "stretch" : undefined, width: phone ? undefined : "760px", maxWidth: "100%", marginTop: phone ? "12px" : "18px", padding: phone ? "14px" : "18px 22px", boxSizing: "border-box", fontSize: phone ? hk.fs[13] : hk.fs[15], lineHeight: 1.9 }}>
        <TermLine tag="[OK]">{phone ? "khóa nhiệm vụ đang làm dở" : "khóa mọi nhiệm vụ đang làm dở (câu chưa nộp không tính)"}</TermLine>
        <TermLine tag="[OK]">{phone ? "hủy lệnh hack chưa dùng" : "hủy lệnh hack chưa dùng và vụ hack đang dở"}</TermLine>
        <TermLine tag="[..]" color={c.yellow}>{phone ? "đang chốt sổ" : "máy chủ đang chốt sổ"}{me ? ` ${me.playerCount} máy` : ""} <Cursor color={c.yellow} /></TermLine>
      </Panel>
      {me ? (
        phone ? (
          <>
            <Box sx={{ position: "relative", alignSelf: "stretch", display: "flex", gap: "8px" }}>
              <Stat label="KÉT SAO" value={me.stars} color={c.cyan} phone />
              <Stat label="KHO XU" value={me.coins} color={c.yellow} phone />
            </Box>
            <Box sx={{ position: "relative", alignSelf: "stretch", bgcolor: c.panel, border: `2px solid ${c.green}`, borderRadius: `${hk.radius.panel}px`, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Box component="span" sx={{ fontSize: hk.fs[11], fontWeight: hk.font.weightBold, color: c.dim }}>TỔNG TẠM TÍNH</Box>
              <Box component="span" sx={{ fontSize: hk.fs[28], fontWeight: hk.font.weightBold, color: c.white }}>{formatNumber(total)}</Box>
            </Box>
          </>
        ) : (
          <Box sx={{ position: "relative", display: "flex", gap: "16px", marginTop: "6px" }}>
            <Stat label="KÉT SAO" value={me.stars} color={c.cyan} phone={false} />
            <Stat label="KHO XU" value={me.coins} color={c.yellow} phone={false} />
            <Stat label="TỔNG TẠM TÍNH" value={total} color={c.green} phone={false} />
          </Box>
        )
      ) : null}
      {questionCount ? (
        <Box sx={{ position: "relative", alignSelf: phone ? "stretch" : undefined, fontSize: phone ? hk.fs[12] : hk.fs[13], lineHeight: phone ? 1.6 : undefined, color: c.mint }}>
          Xong {questionCount} nhiệm vụ trước giờ: {phone ? "" : "bạn "}được làm lại các câu từng sai để lấy thêm sao{phone ? "." : " cho đến khi hết giờ."}
        </Box>
      ) : null}
    </HackScreen>
  );
}

/** Shown while the first room.state is on its way, and for server screens this batch does not draw yet (08-12). */
export function WaitingScreen({ phone, done }: { phone: boolean; done?: boolean }) {
  return (
    <HackScreen phone={phone} center label={done ? "Đã xong nhiệm vụ" : "Đang kết nối"} sx={{ gap: "12px", padding: "0 14px" }}>
      <Panel sx={{ padding: phone ? "14px" : "18px 22px", fontSize: phone ? hk.fs[13] : hk.fs[15], lineHeight: 1.9 }}>
        {done ? (
          <>
            <TermLine tag="[OK]">đã xong mọi nhiệm vụ</TermLine>
            <TermLine tag="[..]" color={c.yellow}>chờ đồng hồ chung về 00:00 <Cursor color={c.yellow} /></TermLine>
          </>
        ) : (
          <TermLine tag="[..]" color={c.yellow}>đang kết nối máy chủ <Cursor color={c.yellow} /></TermLine>
        )}
      </Panel>
    </HackScreen>
  );
}
