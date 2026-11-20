import Box from "@mui/material/Box";
import type { ReactNode } from "react";

import type { FinalEntry, RoomEndedData, RoomSummary } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { HackButton, HackScreen, Panel, formatNumber, toHandle } from "@/features/games/hack/ui/hack-ui";

const c = hk.color;
const DESKTOP_ROWS = 7;
const PHONE_ROWS = 4;

type ResultScreenProps = {
  phone: boolean;
  ended: RoomEndedData;
  room: RoomSummary | undefined;
  onLeave: () => void;
};

function Tile({ value, label, phone }: { value: string; label: string; phone: boolean }) {
  return (
    <Box sx={{ border: `1px solid ${c.border}`, bgcolor: phone ? c.panel : undefined, borderRadius: `${hk.radius.chip}px`, padding: phone ? "8px 2px" : "8px 4px", textAlign: "center" }}>
      <Box sx={{ fontSize: phone ? hk.fs[17] : hk.fs[20], fontWeight: hk.font.weightBold, color: c.white }}>{value}</Box>
      <Box sx={{ fontSize: phone ? hk.fs[10] : hk.fs[11], color: c.dim }}>{label}</Box>
    </Box>
  );
}

function StarCoinBar({ me, phone }: { me: FinalEntry; phone: boolean }) {
  const share = me.total > 0 ? Math.round((me.stars / me.total) * 100) : 50;
  return (
    <>
      <Box sx={{ display: "flex", height: phone ? "14px" : "18px", gap: "3px" }}>
        <Box component="span" sx={{ width: `${share}%`, bgcolor: c.cyan }} />
        <Box component="span" sx={{ flex: 1, bgcolor: c.yellow }} />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: phone ? hk.fs[12] : hk.fs[14], fontWeight: hk.font.weightBold }}>
        <Box component="span" sx={{ color: c.cyan }}>SAO {formatNumber(me.stars)} · thuộc bài</Box>
        <Box component="span" sx={{ color: c.yellow }}>XU {formatNumber(me.coins)} · may mắn</Box>
      </Box>
    </>
  );
}

/** "nhiệm vụ 07 · sai 2 lần" under each weak spot. */
export function weakSubline({ index, wrongCount }: { index: number; wrongCount: number }) {
  return `nhiệm vụ ${String(index + 1).padStart(2, "0")}${wrongCount > 0 ? ` · sai ${wrongCount} lần` : ""}`;
}

/** Red "N LỖ HỔNG CẦN VÁ" card. The patch-up mode (screen 16) is a later batch, so its button stays disabled. */
function WeakPanel({ me, phone, onLeave }: { me: NonNullable<RoomEndedData["me"]>; phone: boolean; onLeave: () => void }) {
  const weak = me.weakQuestions;
  return (
    <Box sx={{ flex: 1, bgcolor: c.weakPanel, border: `1px solid ${weak.length ? c.red : c.border}`, borderRadius: `${hk.radius.panel}px`, padding: phone ? "12px 14px" : "16px 18px", display: "flex", flexDirection: "column", gap: phone ? "8px" : "10px", color: c.errText }}>
      <Box sx={{ color: weak.length ? c.pink : c.dim, fontSize: phone ? hk.fs[11] : hk.fs[12], fontWeight: hk.font.weightBold }}>
        {weak.length ? `${weak.length} LỖ HỔNG CẦN VÁ · CÂU BẠN CÒN SAI` : "KHÔNG CÒN LỖ HỔNG · BẠN LÀM ĐÚNG HẾT"}
      </Box>
      {weak.map((item) => (
        <Box key={item.questionId} sx={{ border: `1px solid ${c.weakBorder}`, borderRadius: `${hk.radius.chip}px`, padding: phone ? "8px 10px" : "10px 12px", overflowWrap: "anywhere" }}>
          <Box sx={{ fontSize: phone ? hk.fs[14] : hk.fs[15], fontWeight: hk.font.weightBold, color: c.white }}>{item.title}</Box>
          <Box sx={{ fontSize: phone ? hk.fs[11] : hk.fs[12], color: c.pink }}>{weakSubline(item)}</Box>
        </Box>
      ))}
      <Box sx={{ marginTop: "auto", display: "flex", gap: "10px" }}>
        {weak.length ? (
          <HackButton disabled fullWidth={phone} sx={phone ? undefined : { flex: 1 }} minHeight={52} fontSize={phone ? hk.fs[16] : hk.fs[17]} paddingX={16}>&gt; VÁ NGAY {weak.length} LỖ HỔNG</HackButton>
        ) : null}
        {phone ? null : <HackButton outline onClick={onLeave} minHeight={52} fontSize={hk.fs[14]} paddingX={16}>THOÁT</HackButton>}
      </Box>
    </Box>
  );
}

function RankRows({ entries, meId, rows, phone }: { entries: FinalEntry[]; meId: string | undefined; rows: number; phone: boolean }) {
  const head = entries.slice(0, rows);
  const mine = meId && !head.some((entry) => entry.playerId === meId) ? entries.find((entry) => entry.playerId === meId) : undefined;
  const shown: FinalEntry[] = mine ? [...head.slice(0, rows - 1), mine] : head;
  return (
    <>
      {shown.map((entry) => {
        const you = entry.playerId === meId;
        const first = entry.rank === 1;
        const cell = (width: number, text: string | number, last?: boolean): ReactNode => (
          <Box component="span" sx={{ width: `${width}px`, textAlign: last ? "right" : "right" }}>{typeof text === "number" ? formatNumber(text) : text}</Box>
        );
        if (phone) {
          return (
            <Box key={entry.playerId} sx={{ display: "flex", gap: "8px", ...(first ? { color: c.yellow, fontWeight: hk.font.weightBold } : {}), ...(you ? { bgcolor: c.green, color: c.bg, fontWeight: hk.font.weightBold, margin: "0 -6px", padding: "0 6px" } : {}) }}>
              <Box component="span" sx={{ color: first || you ? undefined : c.dim }}>{String(entry.rank).padStart(2, "0")}</Box>
              <Box component="span" sx={{ flex: 1, overflowWrap: "anywhere" }}>{toHandle(entry.displayName)}{you ? " (bạn)" : ""}</Box>
              <Box component="span" sx={{ fontWeight: hk.font.weightBold }}>{formatNumber(entry.total)}</Box>
            </Box>
          );
        }
        return (
          <Box key={entry.playerId} sx={{ display: "flex", gap: "12px", padding: "11px 10px", fontWeight: hk.font.weightBold, fontSize: first ? hk.fs[18] : undefined, color: first ? c.yellow : undefined, ...(you ? { bgcolor: c.green, color: c.bg, borderRadius: `${hk.radius.chip}px`, fontSize: undefined } : {}) }}>
            <Box component="span" sx={{ width: "30px" }}>{String(entry.rank).padStart(2, "0")}</Box>
            <Box component="span" sx={{ flex: 1, overflowWrap: "anywhere" }}>{toHandle(entry.displayName)}{you ? " (bạn)" : ""}</Box>
            {cell(70, entry.stars)}
            {cell(70, entry.coins)}
            {cell(80, entry.total, true)}
          </Box>
        );
      })}
    </>
  );
}

/** 15 · Kết quả (HResult / HPResult). */
export function ResultScreen({ phone, ended, room, onLeave }: ResultScreenProps) {
  const me = ended.me;
  const top = ended.final.reduce<FinalEntry | null>((best, entry) => (!best || entry.stars > best.stars ? entry : best), null);
  const accuracy = me && me.answeredCount > 0 ? Math.round((me.correctCount / me.answeredCount) * 100) : 0;
  const subtitle = `phòng ${room?.code ?? ""}${room && !phone ? ` · ${room.quizTitle}` : ""} · ${ended.final.length} máy · đã lưu vào LMS`;

  if (phone) {
    return (
      <HackScreen phone label="Kết quả" sx={{ gap: "10px", padding: "22px 14px 16px" }}>
        <Box sx={{ position: "relative", fontSize: hk.fs[24], fontWeight: hk.font.weightBold, color: c.green, lineHeight: 1.2 }}>CHIẾN DỊCH KẾT THÚC</Box>
        <Box sx={{ position: "relative", fontSize: hk.fs[11], color: c.dim }}>{subtitle}</Box>
        {me ? (
          <>
            <Panel sx={{ borderColor: c.green, borderWidth: "2px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <Box component="span" sx={{ fontSize: hk.fs[22], fontWeight: hk.font.weightBold, color: c.white }}>HẠNG {String(me.rank).padStart(2, "0")}/{ended.final.length}</Box>
                <Box component="span" sx={{ fontSize: hk.fs[26], fontWeight: hk.font.weightBold, color: c.white }}>{formatNumber(me.total)}</Box>
              </Box>
              <StarCoinBar me={me} phone />
            </Panel>
            <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "6px" }}>
              <Tile phone value={`${accuracy}%`} label={`đúng ${me.correctCount}/${me.answeredCount}`} />
              <Tile phone value={`x${me.longestStreak}`} label="chuỗi dài" />
              <Tile phone value={`${me.rank}/${ended.final.length}`} label="hạng cuối" />
              <Tile phone value={String(me.answeredCount)} label="nhiệm vụ" />
            </Box>
          </>
        ) : null}
        <Panel sx={{ padding: "10px 14px", fontSize: hk.fs[14], lineHeight: 2 }}>
          <RankRows entries={ended.final} meId={me?.playerId} rows={PHONE_ROWS} phone />
        </Panel>
        {me ? <WeakPanel me={me} phone onLeave={onLeave} /> : null}
        <HackButton outline onClick={onLeave} fullWidth minHeight={48} fontSize={hk.fs[14]}>THOÁT</HackButton>
      </HackScreen>
    );
  }

  return (
    <HackScreen phone={false} label="Kết quả" sx={{ padding: "26px 24px 24px" }}>
      <Box sx={{ position: "relative", display: "flex", alignItems: "baseline", gap: "20px" }}>
        <Box sx={{ fontSize: hk.fs[40], fontWeight: hk.font.weightBold, color: c.green, lineHeight: 1.1 }}>CHIẾN DỊCH KẾT THÚC</Box>
        <Box sx={{ fontSize: hk.fs[14], color: c.dim }}>{subtitle}</Box>
      </Box>
      <Box sx={{ position: "relative", flex: 1, display: "flex", gap: "20px", marginTop: "18px" }}>
        <Panel sx={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", fontSize: hk.fs[15] }}>
          <Box sx={{ display: "flex", gap: "12px", color: c.dim, fontSize: hk.fs[12], fontWeight: hk.font.weightBold, padding: "0 10px 8px", borderBottom: `1px solid ${c.border}` }}>
            <Box component="span" sx={{ width: "30px" }}>HẠNG</Box>
            <Box component="span" sx={{ flex: 1 }}>MẬT DANH</Box>
            <Box component="span" sx={{ width: "70px", textAlign: "right" }}>SAO</Box>
            <Box component="span" sx={{ width: "70px", textAlign: "right" }}>XU</Box>
            <Box component="span" sx={{ width: "80px", textAlign: "right" }}>TỔNG</Box>
          </Box>
          <RankRows entries={ended.final} meId={me?.playerId} rows={DESKTOP_ROWS} phone={false} />
          {top ? (
            <Box sx={{ marginTop: "auto", display: "flex", gap: "20px", borderTop: `1px solid ${c.border}`, padding: "12px 10px 0", fontSize: hk.fs[13], color: c.mint }}>
              <span>két sao đầy nhất: <Box component="span" sx={{ color: c.white, fontWeight: hk.font.weightBold }}>{toHandle(top.displayName)}</Box></span>
            </Box>
          ) : null}
        </Panel>
        <Box sx={{ width: "440px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {me ? (
            <>
              <Panel sx={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <Box sx={{ color: c.dim, fontSize: hk.fs[12], fontWeight: hk.font.weightBold }}>HỒ SƠ CỦA BẠN</Box>
                <StarCoinBar me={me} phone={false} />
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
                  <Tile phone={false} value={`${accuracy}%`} label={`đúng ${me.correctCount}/${me.answeredCount}`} />
                  <Tile phone={false} value={`x${me.longestStreak}`} label="chuỗi dài nhất" />
                  <Tile phone={false} value={`${me.rank}/${ended.final.length}`} label="hạng cuối" />
                  <Tile phone={false} value={String(me.answeredCount)} label="nhiệm vụ" />
                </Box>
              </Panel>
              <WeakPanel me={me} phone={false} onLeave={onLeave} />
            </>
          ) : (
            <HackButton outline onClick={onLeave}>THOÁT</HackButton>
          )}
        </Box>
      </Box>
    </HackScreen>
  );
}
