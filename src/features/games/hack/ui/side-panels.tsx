import Box from "@mui/material/Box";

import type { LeaderboardData, PlayerState } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { formatNumber, Panel, toHandle } from "@/features/games/hack/ui/hack-ui";

const c = hk.color;

function Row({ rank, name, total, you, firewall }: { rank: number; name: string; total: number; you?: boolean; firewall?: boolean }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: "8px",
        ...(you ? { bgcolor: c.green, color: c.bg, fontWeight: hk.font.weightBold, margin: "0 -8px", padding: "0 8px" } : {}),
      }}
    >
      <Box component="span" sx={{ color: you ? undefined : c.dim }}>{String(rank).padStart(2, "0")}</Box>
      <Box component="span" sx={{ flex: 1, overflowWrap: "anywhere" }}>{name}{you ? " (bạn)" : ""}{firewall ? <Box component="span" sx={{ color: you ? undefined : c.green }}> [TL]</Box> : null}</Box>
      <Box component="span" sx={{ fontWeight: hk.font.weightBold }}>{formatNumber(total)}</Box>
    </Box>
  );
}

/** "MẠNG LỚP HỌC · TOP 5": the server sends the top 5 plus my rank; I am appended when outside the top. */
export function LeaderboardPanel({ data, me }: { data: LeaderboardData; me: PlayerState }) {
  const inTop = data.top.some((entry) => entry.playerId === me.playerId);
  return (
    <Panel sx={{ padding: "14px 16px", fontSize: hk.fs[14], lineHeight: 2 }}>
      <Box sx={{ color: c.dim, fontSize: hk.fs[12], fontWeight: hk.font.weightBold }}>MẠNG LỚP HỌC · TOP 5</Box>
      {data.top.map((entry) => (
        <Row key={entry.playerId} rank={entry.rank} name={toHandle(entry.displayName)} total={entry.total} you={entry.playerId === me.playerId} firewall={entry.firewall} />
      ))}
      {inTop ? null : <Row rank={data.me.rank} name={toHandle(me.displayName)} total={data.me.total} you firewall={me.firewall} />}
      <Box sx={{ fontSize: hk.fs[12], color: c.dim, lineHeight: 2 }}>[TL] = đang bật tường lửa</Box>
    </Panel>
  );
}

function feedTime(at: string) {
  const date = new Date(at);
  return Number.isNaN(date.getTime()) ? at : date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const FEED_SHOWN = 3;
/** "TIN TRÊN MẠNG": the last few feed lines, stamped with the game clock (mm:ss left) when `clockOf` can work it out, plus a one-line hint for this screen. */
export function FeedPanel({ items, hint, clockOf }: { items: { at: string; text: string; tone: string }[]; hint?: string; clockOf?: (at: string) => string | null }) {
  return (
    <Panel sx={{ padding: "14px 16px", fontSize: hk.fs[13], lineHeight: 1.8, flex: 1 }}>
      <Box sx={{ color: c.dim, fontSize: hk.fs[12], fontWeight: hk.font.weightBold }}>TIN TRÊN MẠNG</Box>
      {items.slice(0, FEED_SHOWN).map((item, index) => (
        <Box key={`${item.at}-${index}`}>
          <Box component="span" sx={{ color: c.yellow }}>{clockOf?.(item.at) ?? feedTime(item.at)}</Box>{" "}
          <Box component="span">{item.text}</Box>
        </Box>
      ))}
      {hint ? <Box sx={{ marginTop: "8px", color: c.mint }}>{hint}</Box> : null}
    </Panel>
  );
}
