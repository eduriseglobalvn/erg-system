import Box from "@mui/material/Box";
import { useEffect } from "react";

import type { LootResultData } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { lootCopy, lootShortSummary, lootSummary, packLabels, rankChange } from "@/features/games/hack/loot-meta";
import { Chip, HackButton, HackScreen, Panel, TermLine, formatNumber } from "@/features/games/hack/ui/hack-ui";
import { HudBar } from "@/features/games/hack/ui/hud";

const c = hk.color;
const AUTO_NEXT_MS = 2000;

type LootResultProps = {
  phone: boolean;
  result: LootResultData;
  /** My rank before the pack was opened (screen 07 says "lên hạng 3"). */
  rankBefore?: number | null;
  getRemainingMs: (nowMs: number) => number;
  locked: boolean;
  onNext: () => void;
};

function lootFileName(result: LootResultData) {
  return packLabels(result.me.answeredCount)[result.pickedSlot]?.name ?? "goi.enc";
}

/** 07 · Gói ra xu: lật luôn 2 gói kia (HLootOpen / HPLootOpen). */
export function LootOpenScreen({ phone, result, rankBefore = null, locked, onNext }: Omit<LootResultProps, "getRemainingMs">) {
  const picked = result.slots[result.pickedSlot];
  const copy = lootCopy(picked.kind);
  const file = lootFileName(result);
  const others = result.slots.filter((_, slot) => slot !== result.pickedSlot).map(phone ? lootShortSummary : lootSummary);
  const before = result.me.coins - picked.coins;
  const amount = picked.kind === "HACK_COMMAND" ? "LỆNH HACK" : `+${formatNumber(picked.coins)} XU`;
  const firewall = result.me.firewall;

  return (
    <HackScreen phone={phone} tone="bright" label="Kết quả giải mã" sx={{ alignItems: "center", padding: phone ? "70px 14px 16px" : "40px 40px 28px" }}>
      <Box sx={{ position: "relative", fontSize: phone ? hk.fs[12] : hk.fs[15], fontWeight: hk.font.weightBold, color: c.dim, letterSpacing: phone ? "0.12em" : "0.2em" }}>{file} · GIẢI MÃ XONG</Box>
      <Box component="svg" width={phone ? 100 : 110} height={phone ? 100 : 110} viewBox="0 0 24 24" fill="none" stroke={copy.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" sx={{ position: "relative", marginTop: phone ? "26px" : "18px" }}>
        <rect x="4" y="10" width="16" height="11" rx="1.5" />
        <path d="M8 10V7a4 4 0 0 1 7.5-2" />
        <path d="M12 14v3" />
      </Box>
      <Box sx={{ position: "relative", fontSize: phone ? hk.fs[16] : hk.fs[22], fontWeight: hk.font.weightBold, color: copy.color, marginTop: phone ? "16px" : "10px", border: `2px solid ${copy.color}`, padding: phone ? "4px 14px" : "4px 20px", bgcolor: c.bg }}>
        {copy.title} · {copy.rarity}
      </Box>
      <Box sx={{ position: "relative", fontSize: phone ? hk.fs[68] : hk.fs[120], fontWeight: hk.font.weightBold, color: c.yellow, lineHeight: phone ? 1.15 : 1.1, marginTop: phone ? "12px" : "8px" }}>{amount}</Box>

      <Panel sx={{ alignSelf: "stretch", width: phone ? undefined : "100%", maxWidth: phone ? undefined : "760px", marginTop: phone ? "24px" : "10px", marginX: "auto", padding: phone ? "14px" : "16px 20px", boxSizing: "border-box", fontSize: phone ? hk.fs[13] : hk.fs[15], lineHeight: 1.9 }}>
        <Box><Box component="span" sx={{ color: c.green }}>$</Box> giai_ma {file}</Box>
        <TermLine tag="[OK]">{phone ? `+${formatNumber(picked.coins)} xu vào /kho_xu` : `chuyển ${formatNumber(picked.coins)} xu vào /kho_xu`}</TermLine>
        <TermLine tag="[OK]">
          /kho_xu: {formatNumber(before)} → <Box component="span" sx={{ color: c.yellow, fontWeight: hk.font.weightBold }}>{formatNumber(result.me.coins)}</Box> · {rankChange(rankBefore, result.me.rank)} · {phone ? "gói kia" : "hai gói kia"}: {others.join(" và ")}
        </TermLine>
        {firewall ? <TermLine tag="[OK]">{phone ? "tường lửa đang bảo vệ kho xu" : "tường lửa đang bật, kho xu được bảo vệ"}</TermLine> : null}
      </Panel>

      <Box sx={{ position: "relative", marginTop: "auto", width: "100%", maxWidth: phone ? undefined : "760px", display: "flex", flexDirection: phone ? "column" : "row", alignItems: phone ? "stretch" : "center", gap: phone ? "12px" : "16px", paddingTop: "12px" }}>
        <Box sx={{ flex: 1, fontSize: phone ? hk.fs[12] : hk.fs[14], lineHeight: phone ? 1.6 : undefined, color: c.mint }}>
          {firewall ? "Trả lời sai 1 câu là chuỗi về 0 và tường lửa tắt." : "Đúng 3 câu liên tiếp để bật tường lửa."}
        </Box>
        <HackButton disabled={locked} onClick={onNext} fullWidth={phone}>&gt; NHIỆM VỤ TIẾP</HackButton>
      </Box>
    </HackScreen>
  );
}

/** 07b · Trúng gói rỗng: 0 xu, thấy 2 gói kia có gì (HLootEmpty / HPLootEmpty). Moves on by itself after 2 s. */
export function LootEmptyScreen({ phone, result, starsGained, getRemainingMs, locked, onNext }: LootResultProps & { starsGained: number }) {
  useEffect(() => {
    if (locked) return;
    const id = setTimeout(onNext, AUTO_NEXT_MS);
    return () => clearTimeout(id);
  }, [locked, onNext]);

  const cards = result.slots.map((slot, index) => {
    const mine = index === result.pickedSlot;
    return (
      <Box
        key={index}
        sx={{
          flex: 1,
          minHeight: phone ? "84px" : "150px",
          border: `2px ${mine ? "solid" : "dashed"} ${mine ? c.dim : c.border}`,
          borderRadius: `${hk.radius.panel}px`,
          bgcolor: c.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          opacity: mine ? 1 : 0.75,
        }}
      >
        <Box component="span" sx={{ fontSize: phone ? hk.fs[11] : hk.fs[13], fontWeight: hk.font.weightBold, color: c.dim }}>GÓI {index + 1}{mine ? " · BẠN CHỌN" : ""}</Box>
        <Box component="span" sx={{ fontSize: phone ? hk.fs[22] : hk.fs[40], fontWeight: hk.font.weightBold, color: mine ? c.dim : c.yellow }}>{mine ? "0" : `+${formatNumber(slot.coins)}`}</Box>
        <Box component="span" sx={{ fontSize: phone ? hk.fs[11] : hk.fs[13], color: c.dim }}>{lootCopy(slot.kind).short}</Box>
      </Box>
    );
  });

  const log = (
    <Box sx={{ border: `1px solid ${c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: c.bg, padding: phone ? "10px 12px" : "14px 16px", fontSize: phone ? hk.fs[12] : hk.fs[15], lineHeight: 1.9 }}>
      <Box component="span" sx={{ color: c.dim }}>[..]</Box> giải mã gói {result.pickedSlot + 1} ... xong<br />
      <Box component="span" sx={{ color: c.yellow }}>[!!]</Box> gói rỗng: không có dữ liệu bên trong<br />
      <Box component="span" sx={{ color: c.cyan }}>[OK]</Box> sao của câu vừa đúng vẫn được giữ: +{starsGained}<br />
      <Box component="span" sx={{ color: c.green }}>[OK]</Box> chuỗi đúng không bị ngắt: x{result.me.streak}
    </Box>
  );

  return (
    <HackScreen phone={phone} label="Gói rỗng">
      <HudBar me={result.me} getRemainingMs={getRemainingMs} phone={phone} hideRank={!phone} compact={phone} />
      <Box sx={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: phone ? "10px" : 0, padding: phone ? "12px 14px 14px" : "20px 24px 24px", minHeight: 0 }}>
        <Panel sx={{ flex: 1, minHeight: 0, padding: phone ? "12px" : "20px 24px", display: "flex", flexDirection: "column", gap: phone ? "12px" : "14px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px", fontSize: phone ? hk.fs[12] : hk.fs[13], fontWeight: hk.font.weightBold }}>
            <Chip color={c.dim} solid sx={phone ? { padding: "3px 8px" } : undefined}>KẾT QUẢ GIẢI MÃ</Chip>
            {phone ? null : <Box component="span" sx={{ color: c.dim }}>tự sang nhiệm vụ kế sau 2 giây</Box>}
          </Box>
          {phone ? (
            <>
              <Box sx={{ fontSize: hk.fs[64], lineHeight: 1, fontWeight: hk.font.weightBold, color: c.dim }}>0 XU</Box>
              <Box sx={{ fontSize: hk.fs[17], fontWeight: hk.font.weightBold, color: c.white }}>Trúng gói rỗng. Hai gói kia đều có hàng.</Box>
            </>
          ) : (
            <Box sx={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
              <Box component="span" sx={{ fontSize: hk.fs[96], lineHeight: 1, fontWeight: hk.font.weightBold, color: c.dim }}>0 XU</Box>
              <Box component="span" sx={{ fontSize: hk.fs[24], fontWeight: hk.font.weightBold, color: c.white }}>Trúng gói rỗng. Hai gói kia đều có hàng.</Box>
            </Box>
          )}
          <Box sx={{ display: "flex", gap: phone ? "8px" : "14px" }}>{cards}</Box>
          {log}
          {phone ? (
            <Box sx={{ marginTop: "auto", fontSize: hk.fs[12], color: c.dim }}>Kho xu giữ nguyên {formatNumber(result.me.coins)}, không bị trừ.</Box>
          ) : (
            <Box sx={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
              <Box sx={{ flex: 1, fontSize: hk.fs[14], color: c.dim }}>Hai gói còn lại được lật ra để thấy mình vừa bỏ lỡ gì. Kho xu giữ nguyên {formatNumber(result.me.coins)}, không bị trừ.</Box>
              <HackButton disabled={locked} onClick={onNext}>&gt; NHIỆM VỤ KẾ</HackButton>
            </Box>
          )}
        </Panel>
        {phone ? <HackButton disabled={locked} onClick={onNext} fullWidth>&gt; NHIỆM VỤ KẾ</HackButton> : null}
      </Box>
    </HackScreen>
  );
}
