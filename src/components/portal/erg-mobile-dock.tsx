import type { ComponentType } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import type { Breakpoint } from "@mui/material/styles";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color, motion, radius, shadow, size } = ergEnterpriseTokens;

export const ERG_MOBILE_DOCK_HEIGHT: number = size.mobileDock;

export type ErgMobileDockItem<TId extends string> = {
  id: TId;
  label: string;
  icon: ComponentType<SvgIconProps>;
  path: string;
  badgeCount?: number;
  /** Opens the shell's menu sheet (onOpenSheet) instead of navigating. */
  opensSheet?: boolean;
};

export function formatDockBadge(count: number | undefined): string | null {
  if (!count || count <= 0) return null;
  return count >= 100 ? "99+" : String(count);
}

export function ErgMobileDock<TId extends string>({
  ariaLabel,
  items,
  activeId,
  onNavigate,
  onOpenSheet,
  hideAt,
}: {
  ariaLabel: string;
  items: ReadonlyArray<ErgMobileDockItem<TId>>;
  activeId: TId | null;
  onNavigate: (path: string) => void;
  onOpenSheet?: () => void;
  /** Breakpoint from which the dock is hidden. */
  hideAt: Breakpoint | "never";
}) {
  return (
    <Box
      aria-label={ariaLabel}
      component="nav"
      sx={{
        bottom: 0,
        display: hideAt === "never" ? "block" : { xs: "block", [hideAt]: "none" },
        left: 0,
        pb: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        position: "fixed",
        px: 1.5,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: `${radius.shell}px`,
          boxShadow: shadow.float,
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
          height: ERG_MOBILE_DOCK_HEIGHT,
          maxWidth: 430,
          mx: "auto",
          p: 0.75,
        }}
      >
        {items.map((item) => (
          <DockButton
            active={activeId === item.id}
            item={item}
            key={item.id}
            onClick={() => (item.opensSheet ? onOpenSheet?.() : onNavigate(item.path))}
          />
        ))}
      </Paper>
    </Box>
  );
}

function DockButton<TId extends string>({
  active,
  item: { badgeCount, icon: Icon, label, opensSheet },
  onClick,
}: {
  active: boolean;
  item: ErgMobileDockItem<TId>;
  onClick: () => void;
}) {
  const badge = formatDockBadge(badgeCount);
  return (
    <ButtonBase
      aria-current={active ? "page" : undefined}
      aria-haspopup={opensSheet ? "dialog" : undefined}
      aria-label={badge ? `${label}, ${badge} chưa đọc` : label}
      data-selected={active ? "true" : undefined}
      onClick={onClick}
      sx={{
        bgcolor: active ? color.primarySofter : "transparent",
        borderRadius: `${radius.control}px`,
        color: active ? "primary.main" : "text.secondary",
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        minWidth: 0,
        px: 0.25,
        transition: `background-color ${motion.duration.fast}ms ${motion.easing.standard}`,
        "&:active": { transform: "scale(0.97)" },
        "&:focus-visible": { boxShadow: shadow.focus, outline: "none" },
        "&:hover": { bgcolor: active ? color.primarySoft : "action.hover" },
      }}
    >
      <Box sx={{ display: "flex", position: "relative" }}>
        <Icon sx={{ fontSize: size.iconLg }} />
        {badge ? (
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "error.main",
              border: "2px solid",
              borderColor: "background.paper",
              borderRadius: `${radius.chip}px`,
              color: "error.contrastText",
              display: "flex",
              justifyContent: "center",
              minHeight: 18,
              typography: "caption",
              minWidth: 18,
              px: 0.25,
              position: "absolute",
              right: -10,
              top: -8,
            }}
          >
            {badge}
          </Box>
        ) : null}
      </Box>
      <Typography color="inherit" noWrap sx={{ maxWidth: "100%", px: 0.25 }} variant="caption">
        {label}
      </Typography>
    </ButtonBase>
  );
}
