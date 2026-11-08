import type { ElementType, ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color, radius, statusTint } = ergEnterpriseTokens;

export type ErgSheetTileTone = "primary" | "success" | "neutral";

const TILE_TONE: Record<ErgSheetTileTone, { bg: string; fg: string }> = {
  primary: { bg: color.primarySofter, fg: color.primary },
  success: { bg: statusTint.success.bg, fg: statusTint.success.dot },
  neutral: { bg: statusTint.neutral.bg, fg: statusTint.neutral.color },
};

export type ErgSheetTileItem = { badge?: number; icon: ElementType; label: string; path: string; tag?: string; tone?: ErgSheetTileTone };

/** Overline group label + 4-column tile grid (design N2/N5 "Tài khoản và chức năng"). */
export function ErgSheetTileGroup({ items, label, onNavigate }: { items: ErgSheetTileItem[]; label: string; onNavigate: (path: string) => void }) {
  if (!items.length) return null;
  return (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <ErgSheetOverline>{label}</ErgSheetOverline>
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        {items.map((item) => <ErgSheetTile item={item} key={item.path} onClick={() => onNavigate(item.path)} />)}
      </Box>
    </Box>
  );
}

export function ErgSheetOverline({ children }: { children: ReactNode }) {
  return <Typography color="text.secondary" component="h3" sx={{ typography: "caption", fontWeight: "fontWeightBold", letterSpacing: "0.06em", textTransform: "uppercase" }}>{children}</Typography>;
}

function ErgSheetTile({ item, onClick }: { item: ErgSheetTileItem; onClick: () => void }) {
  const tone = TILE_TONE[item.tone ?? "primary"];
  const Icon = item.icon;
  return (
    <ButtonBase
      aria-label={item.badge ? `${item.label}, ${item.badge} mới` : item.label}
      onClick={onClick}
      sx={{ alignItems: "center", bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, display: "flex", flexDirection: "column", gap: 0.75, justifyContent: "flex-start", minHeight: 84, position: "relative", pb: 1.25, pt: 1.5, px: 0.5, textAlign: "center" }}
    >
      {item.badge ? (
        <Box aria-hidden sx={{ bgcolor: "error.main", borderRadius: `${radius.chip}px`, color: "error.contrastText", minWidth: 20, position: "absolute", px: 0.75, right: 6, top: 6, typography: "caption", fontWeight: "fontWeightBold", lineHeight: "20px" }}>{item.badge}</Box>
      ) : null}
      <Box sx={{ alignItems: "center", bgcolor: tone.bg, borderRadius: `${radius.control}px`, color: tone.fg, display: "flex", height: 40, justifyContent: "center", width: 40 }}><Icon /></Box>
      <Typography component="span" sx={{ lineHeight: 1.25 }} variant="caption">{item.label}</Typography>
      {item.tag ? <Typography color="text.secondary" component="span" sx={{ bgcolor: statusTint.neutral.bg, borderRadius: `${radius.xs}px`, px: 0.625, typography: "caption" }}>{item.tag}</Typography> : null}
    </ButtonBase>
  );
}

/** Avatar, name, email and role badges at the top of the account sheet. */
export function ErgSheetIdentity({ badges, email, initials, name, primaryAvatar = false }: { badges: string[]; email: string; initials: string; name: string; primaryAvatar?: boolean }) {
  return (
    <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1.5, minWidth: 0 }}>
      <Box aria-hidden sx={{ alignItems: "center", bgcolor: primaryAvatar ? "primary.main" : color.primarySofter, borderRadius: "50%", color: primaryAvatar ? "primary.contrastText" : "primary.dark", display: "flex", flexShrink: 0, height: 56, justifyContent: "center", typography: "h4", width: 56 }}>{initials}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h2" noWrap variant="h4">{name}</Typography>
        {email ? <Typography color="text.secondary" noWrap variant="caption" component="div">{email}</Typography> : null}
        {badges.length ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
            {badges.map((badge, index) => (
              <Box component="span" key={badge} sx={{ bgcolor: index === 0 ? statusTint.info.bg : statusTint.neutral.bg, borderRadius: `${radius.chip}px`, color: index === 0 ? statusTint.info.color : statusTint.neutral.color, lineHeight: "24px", px: 1.25, typography: "caption", fontWeight: "fontWeightMedium" }}>{badge}</Box>
            ))}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

/** shortLabel ("GV") is used when three workspaces share the switch, as in design N5. */
export type ErgWorkspaceOption = { label: string; path: string; active?: boolean; shortLabel?: string };

/** "Không gian" segmented switch; hidden when the session has a single workspace. */
export function ErgWorkspaceSwitch({ options, onNavigate }: { options: ErgWorkspaceOption[]; onNavigate: (path: string) => void }) {
  if (options.length < 2) return null;
  return (
    <Box sx={{ alignItems: "center", bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, display: "flex", gap: 1.5, px: 2, py: 1.5 }}>
      <SwapHorizRoundedIcon sx={{ color: "text.secondary" }} />
      <Typography noWrap sx={{ flex: 1, minWidth: 0 }} variant="subtitle2">Không gian</Typography>
      <Box role="group" aria-label="Chuyển không gian" sx={{ bgcolor: "action.hover", borderRadius: `${radius.control}px`, display: "flex", gap: 0.25, p: 0.375 }}>
        {options.map((option) => (
          <ButtonBase
            aria-label={option.label}
            aria-pressed={Boolean(option.active)}
            key={option.path}
            onClick={() => (option.active ? undefined : onNavigate(option.path))}
            sx={{ bgcolor: option.active ? "background.paper" : "transparent", borderRadius: `${radius.sm}px`, boxShadow: option.active ? ergEnterpriseTokens.shadow.xs : "none", color: option.active ? "text.primary" : "text.secondary", minHeight: 36, px: 1.25, typography: "subtitle2", whiteSpace: "nowrap" }}
          >
            {options.length > 2 ? (option.shortLabel ?? option.label) : option.label}
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}

export function ErgSheetSignOut({ onSignOut }: { onSignOut: () => void }) {
  return <Button color="error" fullWidth onClick={onSignOut} startIcon={<LogoutRoundedIcon />} sx={{ bgcolor: "background.paper", borderColor: "error.light", color: "error.main", minHeight: 44, "&:hover": { bgcolor: statusTint.error.bg, borderColor: "error.main" } }} variant="outlined">Đăng xuất</Button>;
}
