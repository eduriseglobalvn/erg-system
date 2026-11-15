import type { SystemStyleObject } from "@mui/system";
import type { Theme } from "@mui/material/styles";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

/** Mot nguon style cho o/chip lich va chu thich (KE_HOACH_LICH_DAY.md 4.3): moi board dung dung helper nay. */
type Sx = SystemStyleObject<Theme>;

const t = ergEnterpriseTokens.schedule;
const stripe = (a: string, b: string) => `repeating-linear-gradient(135deg, ${a} 0 3px, ${b} 3px 6px)`;

export const publishedSx: Sx = { backgroundColor: t.published.bg, color: t.published.text };

export const draftSx: Sx = {
  backgroundColor: t.surface,
  backgroundImage: stripe(t.draft.stripe, t.surface),
  boxShadow: `inset 0 0 0 1px ${t.draft.edge}`,
  color: t.published.text,
};

export const clashSx: Sx = {
  backgroundColor: t.clash.bg,
  boxShadow: `inset 0 0 0 1.5px ${t.clash.edge}`,
  color: t.clash.text,
};

export const travelSx: Sx = {
  backgroundColor: t.clash.bg,
  color: t.clash.text,
  outline: `1.5px dashed ${t.clash.edge}`,
  outlineOffset: -1.5,
};

export const offSx: Sx = {
  backgroundColor: t.off.stripe,
  backgroundImage: stripe(t.off.stripe, t.off.stripeAlt),
  color: t.neutral.text,
};

/** Tiet tro giang: nen trang, vien trong net dut primary. */
export const assistantSx: Sx = {
  backgroundColor: t.surface,
  boxShadow: `inset 0 0 0 1px ${t.draft.edge}`,
  color: t.published.text,
  outline: `1px dashed ${t.draft.edge}`,
  outlineOffset: -1,
};

export type ScheduleCellKind = "published" | "draft" | "clash" | "travel" | "off" | "assistant";

const BY_KIND: Record<ScheduleCellKind, Sx> = {
  assistant: assistantSx,
  clash: clashSx,
  draft: draftSx,
  off: offSx,
  published: publishedSx,
  travel: travelSx,
};

export function scheduleCellSx(kind: ScheduleCellKind): Sx {
  return BY_KIND[kind];
}

export const scheduleTokens = t;
