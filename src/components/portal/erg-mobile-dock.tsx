import { useEffect, type ComponentType } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import type { Breakpoint } from "@mui/material/styles";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { useDockAutohide } from "./use-dock-autohide";

const { color, motion, radius, shadow, size } = ergEnterpriseTokens;

/** Capsule height: 44px buttons + 5px padding + 1px border on each side. */
export const ERG_MOBILE_DOCK_HEIGHT: number = size.mobileDock;
const DOCK_SIDE_GUTTER = 12;
/** Gap under the capsule: tucked just above the iOS home indicator instead of a full safe-area (~46px) away. */
const DOCK_BOTTOM = "max(8px, env(safe-area-inset-bottom, 0px) - 22px)";

/** Distance from the viewport bottom to `gap` px above the dock: scroll regions pad by it, floating UI sits on it. */
export function ergMobileDockClearance(gap = 24): string {
  return `calc(${ERG_MOBILE_DOCK_HEIGHT + gap}px + ${DOCK_BOTTOM})`;
}

/**
 * Bottom offset for UI that floats or sticks above the dock. Unlike the static padding above it follows the dock:
 * when the dock slides away (scrolling down, keyboard open) the variable collapses and the UI drops to the screen edge.
 */
export function ergMobileDockAnchor(gap = 24): string {
  return `calc(var(--erg-dock-lift, ${ERG_MOBILE_DOCK_HEIGHT}px) + ${gap}px + ${DOCK_BOTTOM})`;
}

/** Safari 15.0–15.3 drop `100dvh` entirely; shells spread this next to their dvh heights. */
export const ERG_FULL_VIEWPORT_FALLBACK = {
  "@supports not (height: 1dvh)": { height: "100vh", maxHeight: "100vh", minHeight: "100vh" },
} as const;

export type ErgMobileDockItem<TId extends string> = {
  id: TId;
  label: string;
  icon: ComponentType<SvgIconProps>;
  path: string;
  /** Shown as a red dot; the number is only announced in the aria-label. */
  badgeCount?: number;
  /** Opens the shell's menu sheet (onOpenSheet) instead of navigating. */
  opensSheet?: boolean;
  /** Renders a 32px initials avatar instead of the icon (account tab). */
  avatarInitials?: string;
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
  const hidden = useDockAutohide(activeId);
  useEffect(() => {
    const root = document.documentElement;
    if (hidden) root.style.setProperty("--erg-dock-lift", `max(0px, env(safe-area-inset-bottom, 0px) - ${DOCK_BOTTOM})`);
    else root.style.removeProperty("--erg-dock-lift");
    return () => {
      root.style.removeProperty("--erg-dock-lift");
    };
  }, [hidden]);
  const slide = `transform ${motion.duration.base}ms ${motion.easing.emphasized}, opacity ${motion.duration.base}ms ${motion.easing.standard}, visibility 0s linear ${hidden ? motion.duration.base : 0}ms`;
  const shown = (value: string) => (hideAt === "never" ? value : { xs: value, [hideAt]: "none" });
  return (
    <>
      {/* Fades scrolled content out under the capsule so nothing shows beside or below it. */}
      <Box
        aria-hidden
        data-testid="erg-mobile-dock-backdrop"
        sx={{
          background: (theme) => `linear-gradient(to top, ${theme.palette.background.default} 70%, transparent)`,
          bottom: 0,
          display: shown("block"),
          height: ergMobileDockClearance(),
          left: 0,
          opacity: hidden ? 0 : 1,
          pointerEvents: "none",
          position: "fixed",
          right: 0,
          transition: slide,
          visibility: hidden ? "hidden" : "visible",
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      />
      <Box
        aria-label={ariaLabel}
        component="nav"
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: `${radius.chip}px`,
          bottom: DOCK_BOTTOM,
          boxShadow: shadow.float,
          boxSizing: "border-box",
          display: shown("flex"),
          gap: "2px",
          height: ERG_MOBILE_DOCK_HEIGHT,
          // left/right + auto margins + fit-content centre the capsule with the full width available to shrink into.
          left: DOCK_SIDE_GUTTER,
          mx: "auto",
          p: "5px",
          position: "fixed",
          right: DOCK_SIDE_GUTTER,
          transform: hidden ? `translateY(calc(100% + ${DOCK_BOTTOM} + 16px))` : "none",
          transition: slide,
          visibility: hidden ? "hidden" : "visible",
          width: "fit-content",
          zIndex: (theme) => theme.zIndex.appBar,
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
      </Box>
    </>
  );
}

function DockButton<TId extends string>({
  active,
  item: { avatarInitials, badgeCount, icon: Icon, label, opensSheet },
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
        bgcolor: active ? color.primary : "transparent",
        borderRadius: `${radius.chip}px`,
        color: active ? "primary.contrastText" : "text.secondary",
        // Inactive tabs keep a fixed 44px square (40px under 375px so 6 tabs fit at 360px); only the active label shrinks.
        flex: active ? "0 1 auto" : "0 0 auto",
        gap: 1,
        height: 44,
        minWidth: active ? 0 : 44,
        "@media (max-width: 374.95px)": active ? {} : { minWidth: 40 },
        pl: active ? 1.25 : 0,
        pr: active ? 1.75 : 0,
        transition: `background-color ${motion.duration.fast}ms ${motion.easing.standard}`,
        "&:active": { transform: "scale(0.97)" },
        "&:focus-visible": { boxShadow: shadow.focus, outline: "none" },
        "@media (hover: hover)": { "&:hover": { bgcolor: active ? "primary.main" : "action.hover" } },
      }}
    >
      <Box sx={{ display: "flex", flexShrink: 0, position: "relative" }}>
        {avatarInitials ? (
          <Box
            sx={{
              alignItems: "center",
              bgcolor: color.primarySofter,
              borderRadius: "50%",
              color: "primary.main",
              display: "flex",
              height: 32,
              justifyContent: "center",
              typography: "caption",
              width: 32,
            }}
          >
            {avatarInitials}
          </Box>
        ) : (
          <Icon sx={{ fontSize: size.iconLg }} />
        )}
        {badge ? (
          <Box
            data-testid="erg-mobile-dock-dot"
            sx={{
              bgcolor: "error.main",
              border: "2px solid",
              borderColor: "background.paper",
              borderRadius: "50%",
              height: 10,
              position: "absolute",
              right: -3,
              top: -2,
              width: 10,
            }}
          />
        ) : null}
      </Box>
      {active ? (
        <Typography noWrap sx={{ color: "primary.contrastText", minWidth: 0 }} variant="subtitle2">
          {label}
        </Typography>
      ) : null}
    </ButtonBase>
  );
}
