import type { HolidayKind, SaturdayMode } from "../../api/timekeeping-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

export type Tone = { bg: string; color: string };

/** Board tones → tokens. The WFH green has no token of its own yet: statusTint.success is the nearest (plan 6.19, point 3). */
export const holidayTone = (kind?: HolidayKind): Tone =>
  kind === "COMPANY" ? { bg: t.schedule.neutral.bg, color: t.color.textSecondary } : { bg: t.schedule.clash.bg, color: t.schedule.clash.text };

export const saturdayTone = (mode: SaturdayMode): Tone => {
  if (mode === "WFH") return { bg: t.statusTint.success.bg, color: t.statusTint.success.color };
  if (mode === "PAID_OFF") return { bg: t.schedule.warn.bg, color: t.schedule.warn.text };
  if (mode === "UNPAID_OFF") return { bg: t.schedule.neutral.bg, color: t.color.textMuted };
  return { bg: t.schedule.published.bg, color: t.schedule.published.text };
};

export const stripeBackground = `repeating-linear-gradient(135deg, ${t.schedule.off.stripe} 0 8px, ${t.schedule.off.stripeAlt} 8px 16px)`;

/** Legend of the month calendar, in the board's order. */
export const LEGEND: ReadonlyArray<{ label: string; tone: Tone }> = [
  { label: "Nghỉ lễ nhà nước · nghỉ bù", tone: holidayTone("STATE") },
  { label: "Nghỉ công ty", tone: holidayTone("COMPANY") },
  { label: "Thứ 7 lên công ty", tone: saturdayTone("OFFICE") },
  { label: "Thứ 7 WFH", tone: saturdayTone("WFH") },
  { label: "Thứ 7 nghỉ có lương", tone: saturdayTone("PAID_OFF") },
  { label: "Thứ 7 nghỉ không lương", tone: saturdayTone("UNPAID_OFF") },
];
