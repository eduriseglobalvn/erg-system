import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useEffect, useMemo, useState } from "react";

import type { PlayerState } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { packLabels } from "@/features/games/hack/loot-meta";
import { HackButton, HackScreen } from "@/features/games/hack/ui/hack-ui";
import { HudBar } from "@/features/games/hack/ui/hud";

const c = hk.color;

type LootScreenProps = {
  phone: boolean;
  me: PlayerState;
  starsGained: number;
  getRemainingMs: (nowMs: number) => number;
  locked: boolean;
  onPick: (slot: number) => void;
};

function LockIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="1.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}

const PRIZE_CHIPS: [string, string][] = [
  ["tệp vụn +50", c.border],
  ["ví nhỏ +150", c.border],
  ["ví lớn +400", c.cyan],
  ["kho mật +1 600", c.yellow],
  ["lệnh hack", c.red],
];

/** 06 · Đúng: chọn 1 trong 3 gói (HLoot / HPLoot). Desktop: click or key 1-3 opens at once; phone: tap selects, button opens. */
export function LootScreen({ phone, me, starsGained, getRemainingMs, locked, onPick }: LootScreenProps) {
  const labels = useMemo(() => packLabels(me.answeredCount), [me.answeredCount]);
  const [chosen, setChosen] = useState<number | null>(null);
  const disabled = locked || (!phone && chosen !== null);

  const open = (slot: number) => {
    if (locked) return;
    setChosen(slot);
    if (!phone) onPick(slot);
  };

  useEffect(() => {
    if (phone || locked) return;
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const slot = ["1", "2", "3"].indexOf(event.key);
      if (slot >= 0) {
        setChosen(slot);
        onPick(slot);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [locked, onPick, phone]);

  const chips = (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: phone ? "6px" : "10px", fontSize: phone ? hk.fs[11] : hk.fs[13], fontWeight: hk.font.weightBold }}>
      {phone ? null : <Box component="span" sx={{ color: c.dim, fontWeight: hk.font.weightMedium }}>1 gói rỗng 0 xu · 2 gói có hàng chứa:</Box>}
      {PRIZE_CHIPS.map(([text, color]) => (
        <Box key={text} component="span" sx={{ border: `1px solid ${color}`, color: color === c.border ? undefined : color, padding: phone ? "4px 8px" : "5px 12px", borderRadius: `${hk.radius.chip}px` }}>{text}</Box>
      ))}
    </Box>
  );

  return (
    <HackScreen phone={phone} label="Chọn gói dữ liệu">
      <HudBar me={me} getRemainingMs={getRemainingMs} phone={phone} starDelta={starsGained} />
      <Box sx={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: phone ? "stretch" : "center", gap: phone ? "12px" : 0, padding: phone ? "18px 14px 16px" : "26px 24px 24px" }}>
        <Box sx={{ fontSize: phone ? hk.fs[12] : hk.fs[15], fontWeight: hk.font.weightBold, color: c.dim, letterSpacing: phone ? "0.12em" : "0.2em" }}>
          MÃ ĐÚNG · +{starsGained} SAO ĐÃ {phone ? "KHÓA" : "KHÓA VÀO KÉT"}
        </Box>
        <Box sx={{ fontSize: phone ? hk.fs[28] : hk.fs[44], fontWeight: hk.font.weightBold, color: c.green, lineHeight: 1.2, marginTop: phone ? 0 : "6px" }}>GIẢI MÃ 1 GÓI DỮ LIỆU</Box>
        <Box sx={{ fontSize: phone ? hk.fs[13] : hk.fs[15], lineHeight: phone ? 1.6 : undefined, marginTop: phone ? 0 : "6px", color: c.mint }}>
          {phone ? "3 gói: 2 có hàng, 1 rỗng (0 xu). Chỉ kịp mở 1 gói." : "Bạn chặn được 3 gói: 2 gói có hàng, 1 gói rỗng. Chỉ kịp mở 1 gói."}
        </Box>

        <Box role="group" aria-label="Ba gói dữ liệu" sx={{ display: "flex", flexDirection: phone ? "column" : "row", gap: phone ? "12px" : "28px", marginTop: phone ? 0 : "34px" }}>
          {labels.map((label, slot) => {
            const selected = chosen === slot;
            // Hover and keyboard focus show the "chosen" look (amber lock, green label), as the design's middle card does.
            const lit = { borderColor: c.green, bgcolor: c.selected, transform: phone ? undefined : "translateY(-14px)", "& svg": { stroke: c.yellow }, "& .pack-idle": { display: "none" }, "& .pack-lit": { display: "inline-block" } };
            return (
              <ButtonBase
                key={label.name}
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => open(slot)}
                sx={{
                  width: phone ? "auto" : "290px",
                  minHeight: phone ? "104px" : "250px",
                  border: `2px solid ${selected ? c.green : c.border}`,
                  borderRadius: `${hk.radius.panel}px`,
                  bgcolor: selected ? c.selected : c.panel,
                  color: c.text,
                  fontFamily: "inherit",
                  padding: phone ? "0 16px" : "20px",
                  display: "flex",
                  flexDirection: phone ? "row" : "column",
                  alignItems: "center",
                  justifyContent: phone ? "flex-start" : undefined,
                  gap: phone ? "16px" : "12px",
                  textAlign: phone ? "left" : "center",
                  transform: !phone && selected ? "translateY(-14px)" : undefined,
                  "& .pack-lit": { display: selected ? "inline-block" : "none" },
                  "& .pack-idle": { display: selected ? "none" : "inline-block" },
                  "&:hover:not(.Mui-disabled), &.Mui-focusVisible": phone ? undefined : lit,
                  "&.Mui-disabled": { color: c.text },
                  "&.Mui-focusVisible": { outline: `2px solid ${c.white}`, outlineOffset: "2px" },
                }}
              >
                <LockIcon color={selected ? c.yellow : c.green} size={phone ? 56 : 96} />
                <Box component="span" sx={{ flex: phone ? 1 : undefined, display: "flex", flexDirection: "column", gap: phone ? 0 : "12px", alignItems: phone ? "flex-start" : "center" }}>
                  <Box component="span" sx={{ fontSize: phone ? hk.fs[17] : hk.fs[18], fontWeight: hk.font.weightBold, color: c.white }}>{label.name}</Box>
                  <Box component="span" sx={{ fontSize: phone ? hk.fs[11] : hk.fs[12], color: c.dim, wordBreak: "break-all" }}>{phone ? label.hash.slice(0, 16) : label.hash}</Box>
                </Box>
                {phone ? (
                  selected ? <Box component="span" sx={{ bgcolor: c.green, color: c.bg, padding: "6px 10px", borderRadius: `${hk.radius.chip}px`, fontSize: hk.fs[13], fontWeight: hk.font.weightBold }}>ĐÃ CHỌN</Box> : null
                ) : (
                  <Box component="span" sx={{ marginTop: "auto", display: "flex" }}>
                    <Box component="span" className="pack-idle" sx={{ padding: "5px 16px", border: `1px solid ${c.border}`, borderRadius: `${hk.radius.chip}px`, fontSize: hk.fs[15], fontWeight: hk.font.weightBold }}>PHÍM {slot + 1}</Box>
                    <Box component="span" className="pack-lit" sx={{ padding: "6px 16px", bgcolor: c.green, color: c.bg, borderRadius: `${hk.radius.chip}px`, fontSize: hk.fs[15], fontWeight: hk.font.weightBold }}>&gt; PHÍM {slot + 1} · GIẢI MÃ</Box>
                  </Box>
                )}
              </ButtonBase>
            );
          })}
        </Box>

        {phone ? chips : null}
        {phone ? (
          <HackButton disabled={locked || chosen === null} onClick={() => chosen !== null && onPick(chosen)} fullWidth sx={{ marginTop: "auto" }}>
            &gt; GIẢI MÃ {chosen !== null ? labels[chosen].name.replace(".enc", "") : "gói"}
          </HackButton>
        ) : (
          <Box sx={{ marginTop: "auto" }}>{chips}</Box>
        )}
      </Box>
    </HackScreen>
  );
}
