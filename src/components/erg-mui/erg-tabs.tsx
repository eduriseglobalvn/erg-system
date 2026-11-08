import Box from "@mui/material/Box";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

// Canvas `.chips` / `.seg` look for MUI <Tabs>: same tab/tablist semantics, no underline indicator.

/** Pill filter row (canvas `.chip` / `.chip.on`). Pair with `variant="scrollable" scrollButtons={false}`. */
export const ergChipTabsSx = {
  minHeight: 36,
  "& .MuiTabs-indicator": { display: "none" },
  "& .MuiTabs-flexContainer, & .MuiTabs-list": { gap: 1 },
  "& .MuiTab-root": {
    minHeight: 36,
    height: 36,
    minWidth: 0,
    px: 1.75,
    gap: 0.75,
    borderRadius: `${t.radius.chip}px`,
    border: `1px solid ${t.color.border}`,
    bgcolor: "background.paper",
    color: "text.secondary",
    fontWeight: "fontWeightMedium",
  },
  "& .MuiTab-root.Mui-selected": {
    bgcolor: t.color.primarySofter,
    borderColor: "primary.main",
    color: t.statusTint.info.color,
    fontWeight: "fontWeightBold",
  },
} as const;

/** Segmented control (canvas `.seg`): equal-width options on a grey track. Pair with `variant="fullWidth"`. */
export const ergSegmentedTabsSx = {
  minHeight: 42,
  p: "3px",
  borderRadius: `${t.radius.control}px`,
  bgcolor: t.color.divider,
  "& .MuiTabs-indicator": { display: "none" },
  "& .MuiTabs-flexContainer, & .MuiTabs-list": { gap: "2px" },
  "& .MuiTab-root": {
    minHeight: 36,
    height: 36,
    minWidth: 0,
    px: 1.25,
    gap: 0.75,
    borderRadius: `${t.radius.sm}px`,
    color: "text.secondary",
    whiteSpace: "nowrap",
  },
  "& .MuiTab-root.Mui-selected": { bgcolor: "background.paper", color: "text.primary", boxShadow: t.shadow.xs },
} as const;

/** Count pill inside a chip / segment label (canvas `.cnt`, `.cnt.er` with `tone="error"`). */
export function ErgTabCount({ count, tone = "info" }: { count: number; tone?: "info" | "error" }) {
  if (!count) return null;
  const error = tone === "error";
  return (
    <Box
      component="span"
      sx={{
        display: "inline-grid",
        placeItems: "center",
        minWidth: 20,
        height: 20,
        px: 0.75,
        borderRadius: `${t.radius.chip}px`,
        bgcolor: error ? "error.main" : t.statusTint.info.bg,
        color: error ? "common.white" : t.statusTint.info.color,
        typography: "caption",
        fontWeight: "fontWeightBold",
      }}
    >
      {count}
    </Box>
  );
}
