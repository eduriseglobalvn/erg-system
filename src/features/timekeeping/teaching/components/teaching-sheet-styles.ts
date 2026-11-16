import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** Header / body cell of the bordered grids of the Total and month boards (`th` 9/10, `td` 9/10, 1px #E3E3E8 on every side). */
export const gridTh = {
  // The boards set `width` on a default (content-box) th, so the column is that wide PLUS its padding.
  boxSizing: "content-box",
  ...t.type.label,
  bgcolor: t.color.surfaceSubtle,
  border: `1px solid ${t.color.border}`,
  color: t.color.textSecondary,
  px: "10px",
  py: "9px",
  textAlign: "center",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
} as const;

export const gridTd = {
  ...t.type.small,
  border: `1px solid ${t.color.border}`,
  color: t.color.text,
  px: "10px",
  py: "9px",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
} as const;
