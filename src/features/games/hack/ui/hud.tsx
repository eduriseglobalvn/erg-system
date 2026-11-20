import Box from "@mui/material/Box";
import type { ReactNode } from "react";

import type { PlayerState } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { formatClock, formatNumber, toHandle } from "@/features/games/hack/ui/hack-ui";
import { useNow } from "@/features/games/use-now";
import type { QuestionMark } from "@/features/games/room-state";

const c = hk.color;

type HudProps = {
  me: PlayerState;
  getRemainingMs: (nowMs: number) => number;
  phone: boolean;
  /** Stars just won on this screen, shown as "(+120)". */
  starDelta?: number;
  /** The streak was just broken: shows "VỪA TẮT" instead of "TẮT". */
  streakBroken?: boolean;
  hideRank?: boolean;
  /** Focused question kinds (HQMulti and co.): no rank cell on desktop, no "[ĐÃ KHÓA]" and no firewall text. */
  compact?: boolean;
};

function Cell({ children, color, last }: { children: ReactNode; color?: string; last?: boolean }) {
  return <Box sx={{ padding: "12px 18px", borderRight: last ? 0 : `1px solid ${c.border}`, color }}>{children}</Box>;
}

/** Terminal status bar: handle, rank, stars (locked), coins, streak/firewall, shared clock. */
export function HudBar({ me, getRemainingMs, phone, starDelta, streakBroken, hideRank: hideRankProp, compact }: HudProps) {
  const hideRank = hideRankProp || (compact && !phone);
  const remainingMs = getRemainingMs(useNow(1000));
  const handle = `root@${toHandle(me.displayName).toLowerCase()}`;
  const rank = `HẠNG ${String(me.rank).padStart(2, "0")}/${me.playerCount}`;
  const stars = (
    <>
      SAO {formatNumber(me.stars)}
      {starDelta ? <Box component="span" sx={{ color: c.green }}> (+{starDelta})</Box> : phone || compact ? null : " [ĐÃ KHÓA]"}
    </>
  );
  const firewallTone = me.firewall ? c.green : streakBroken ? c.pink : undefined;

  if (phone) {
    return (
      <Box sx={{ position: "relative", bgcolor: c.panel, borderBottom: `1px solid ${c.border}`, fontSize: hk.fs[12], fontWeight: hk.font.weightBold }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px 6px" }}>
          <Box component="span" sx={{ color: c.green }}>{handle}{hideRank ? "" : ` · ${rank.toLowerCase()}`}</Box>
          <Box component="span" sx={{ fontSize: hk.fs[15] }}>{formatClock(remainingMs)}</Box>
        </Box>
        <Box sx={{ display: "flex", gap: "12px", padding: "0 14px 10px" }}>
          <Box component="span" sx={{ color: c.cyan }}>{stars}</Box>
          <Box component="span" sx={{ color: c.yellow }}>XU {formatNumber(me.coins)}</Box>
          {compact ? (
            <span>CHUỖI x{me.streak}</span>
          ) : me.firewall || streakBroken ? (
            <Box component="span" sx={{ color: firewallTone }}>x{me.streak} · TƯỜNG LỬA: {me.firewall ? "BẬT" : "VỪA TẮT"}</Box>
          ) : (
            <>
              <span>CHUỖI x{me.streak}</span>
              <Box component="span" sx={{ color: c.dim }}>TƯỜNG LỬA: TẮT</Box>
            </>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", display: "flex", alignItems: "stretch", bgcolor: c.panel, borderBottom: `1px solid ${c.border}`, fontSize: hk.fs[14], fontWeight: hk.font.weightBold }}>
      <Cell color={c.green}>{handle}</Cell>
      {hideRank ? null : <Cell>{rank}</Cell>}
      <Cell color={c.cyan}>{stars}</Cell>
      <Cell color={c.yellow}>XU {formatNumber(me.coins)}</Cell>
      <Cell color={firewallTone}>CHUỖI x{me.streak}{compact ? "" : ` · TƯỜNG LỬA: ${me.firewall ? "BẬT" : streakBroken ? "VỪA TẮT" : "TẮT"}`}</Cell>
      <Box sx={{ flex: 1 }} />
      <Box sx={{ padding: "12px 18px", borderLeft: `1px solid ${c.border}`, fontSize: hk.fs[16] }}>{formatClock(remainingMs)}</Box>
    </Box>
  );
}

const MARK_COLOR: Record<QuestionMark, string> = { ok: c.green, wrong: c.red };

/** `current` is the 1-based mission number; `marks` is keyed the same way. One segment per mission: green right, red wrong, white now, dark still to come. */
export function QuestionProgress({ total, current, marks, phone }: { total: number; current: number; marks: Record<number, QuestionMark>; phone: boolean }) {
  return (
    <Box role="img" aria-label={`Nhiệm vụ ${current} trên ${total}`} sx={{ position: "relative", display: "flex", gap: phone ? "2px" : "3px", padding: phone ? "10px 14px 0" : "0 24px", marginTop: phone ? 0 : "14px" }}>
      {Array.from({ length: total }, (_, index) => {
        const mark = marks[index + 1];
        const color = index + 1 === current ? c.white : mark ? MARK_COLOR[mark] : c.disabled;
        return <Box key={index} component="span" sx={{ flex: 1, height: phone ? "6px" : "8px", bgcolor: color }} />;
      })}
    </Box>
  );
}
