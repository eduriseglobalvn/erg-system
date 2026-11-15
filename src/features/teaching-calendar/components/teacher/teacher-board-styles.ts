import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

/** Cac muc chu / mau cua board Lich giao vien (don vi rem = px board / 16). Mau lay tu token, khong hex moi. */
export const t = ergEnterpriseTokens;
export const SIZE = { chip: "0.6875rem", day: "1.125rem", micro: "0.625rem", panel: "0.8125rem", title: "0.75rem" } as const;
export const SEMIBOLD = 600;
export const MEDIUM = 500;
export const LEAVE = { bg: t.schedule.warn.bg, bar: t.statusTint.warning.dot, text: t.schedule.warn.text } as const;
export const CARD = { bgcolor: t.color.surface, border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px` } as const;
