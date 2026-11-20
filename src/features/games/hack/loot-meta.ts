import type { LootKind, LootSlotData } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { formatNumber } from "@/features/games/hack/ui/hack-ui";

export const LOOT_SLOTS = 3;

/** Cosmetic file names for the three packs; the server decides what is inside. */
export function packLabels(seed: number) {
  let state = (seed + 1) * 2654435761;
  const next = () => {
    state = Math.imul(state ^ (state >>> 13), 1274126177) >>> 0;
    return state;
  };
  const hex = (length: number) => Array.from({ length }, () => (next() % 16).toString(16)).join("");
  return Array.from({ length: LOOT_SLOTS }, () => ({ name: `goi_${hex(4).toUpperCase()}.enc`, hash: hex(24) }));
}


type KindCopy = { title: string; rarity: string; color: string; short: string };

const KIND_COPY: Record<LootKind, KindCopy> = {
  EMPTY: { title: "GÓI RỖNG", rarity: "KHÔNG CÓ GÌ BÊN TRONG", color: hk.color.dim, short: "gói rỗng" },
  SCRAP: { title: "TỆP VỤN", rarity: "GẶP NHIỀU NHẤT", color: hk.color.green, short: "tệp vụn" },
  SMALL_WALLET: { title: "VÍ NHỎ", rarity: "5 LẦN GẶP 1", color: hk.color.green, short: "ví nhỏ" },
  BIG_WALLET: { title: "VÍ LỚN", rarity: "10 LẦN MỚI GẶP 1", color: hk.color.cyan, short: "ví lớn" },
  VAULT: { title: "KHO MẬT", rarity: "30 LẦN MỚI GẶP 1", color: hk.color.yellow, short: "kho mật" },
  HACK_COMMAND: { title: "LỆNH HACK", rarity: "20 LẦN MỚI GẶP 1", color: hk.color.red, short: "lệnh hack" },
};

export function lootCopy(kind: LootKind): KindCopy {
  return KIND_COPY[kind];
}

/** "tệp vụn +50" / "GÓI RỖNG": how a slot reads in the terminal lines. */
export function lootSummary(slot: LootSlotData): string {
  return slot.kind === "EMPTY" ? "GÓI RỖNG" : `${KIND_COPY[slot.kind].short} +${formatNumber(slot.coins)}`;
}
