import type { ReactNode } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DiamondRoundedIcon from "@mui/icons-material/DiamondRounded";
import ForestRoundedIcon from "@mui/icons-material/ForestRounded";
import HardwareRoundedIcon from "@mui/icons-material/HardwareRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import Box from "@mui/material/Box";

import { TIER_NAMES, type TierKey } from "@/domain/student-tier/tiers";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const tk = ergEnterpriseTokens;

const TIER_ICON = {
  go: ForestRoundedIcon,
  sat: HardwareRoundedIcon,
  dong: ShieldRoundedIcon,
  bac: ShieldRoundedIcon,
  vang: StarRoundedIcon,
  bk: AutoAwesomeRoundedIcon,
  kc: DiamondRoundedIcon,
  ct: WorkspacePremiumRoundedIcon, // spec Q2: no crown icon in MUI
} as const;

/**
 * Avatar ring for a tier. Drawn with padding + gradient + box-shadow (no `outline`),
 * so it stays round on Safari 15 (spec 3.1). `size` is the inner avatar in px.
 */
export function ErgTierFrame({ tier, size, children }: { tier: TierKey | null; size: number; children: ReactNode }) {
  if (!tier) return <>{children}</>;
  return (
    <Box
      component="span"
      sx={{
        background: tk.tier[tier].frame,
        borderRadius: "50%",
        boxShadow: tk.tier[tier].glow,
        display: "inline-grid",
        flexShrink: 0,
        height: size + 6,
        p: "3px",
        placeItems: "center",
        position: "relative",
        width: size + 6,
        "& > *": { border: `2px solid ${tk.color.surface}`, height: size, width: size, boxSizing: "border-box" },
      }}
    >
      {children}
    </Box>
  );
}

/** Shield emblem. Height is 1.12x the width, as in the design. */
export function ErgTierEmblem({ tier, size, label }: { tier: TierKey; size: number; label?: string }) {
  const Icon = TIER_ICON[tier];
  return (
    <Box
      aria-label={label ?? TIER_NAMES[tier]}
      component="span"
      role="img"
      sx={{
        background: tk.tier[tier].emblem,
        clipPath: "polygon(50% 0,100% 16%,100% 60%,50% 100%,0 60%,0 16%)",
        color: tk.tier[tier].ink,
        display: "inline-grid",
        height: Math.round(size * 1.12),
        placeItems: "center",
        position: "relative",
        width: size,
        "&::after": { background: "linear-gradient(160deg,rgba(255,255,255,.55),rgba(255,255,255,0) 50%)", content: '""', inset: 0, pointerEvents: "none", position: "absolute" },
      }}
    >
      <Icon sx={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,.25))", fontSize: Math.round(size * 0.46), position: "relative", zIndex: 1 }} />
    </Box>
  );
}

export function ErgTierChip({ tier, children }: { tier: TierKey; children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        alignItems: "center",
        background: tk.tier[tier].chip,
        borderRadius: `${tk.radius.chip}px`,
        color: tk.tier[tier].ink,
        display: "inline-flex",
        fontSize: "0.6875rem",
        fontWeight: "bold",
        height: 22,
        px: "8px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}
