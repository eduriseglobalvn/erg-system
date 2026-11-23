import { HACK_GAME_DISPLAY_NAME } from "@/features/games/hack/hack-tokens";

export type CatalogGame = {
  id: string;
  name: string;
  playable: boolean;
};

/** The picker shows the playable game first, then placeholders for the games to come (names are not decided). */
export const GAME_CATALOG: CatalogGame[] = [
  { id: "HACK", name: HACK_GAME_DISPLAY_NAME, playable: true },
  ...[2, 3, 4, 5, 6].map((n) => ({ id: `SOON_${n}`, name: `Trò chơi ${n}`, playable: false })),
];

/** Facts about ERG Hack shown in the picker's side panel (fixed copy from the design, not from the API). */
export const HACK_FACTS = {
  blurb: "Giải mã lấy xu, hack máy bạn, vá lỗ hổng của chính mình.",
  cells: [
    ["Độ khó làm quen", "Dễ"],
    ["Kỹ năng / may rủi", "50 / 50"],
    ["Thời lượng hợp lý", "8-10 phút"],
    ["Người chơi", "2-60"],
  ] as const,
  note: "Bước sau: chọn lớp, thời lượng và luật riêng của trò.",
} as const;
