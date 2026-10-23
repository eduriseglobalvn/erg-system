import type { ComponentType } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export type LmsMobileDockIcon = ComponentType<SvgIconProps>;

export type LmsMobileDockItem<TSection extends string> = {
  badgeCount?: number;
  icon: LmsMobileDockIcon;
  id: TSection;
  label: string;
  path: string;
};

export function LmsBottomDock<TSection extends string>({
  activeSection,
  items,
  onNavigate,
}: {
  activeSection: TSection;
  items: Array<LmsMobileDockItem<TSection>>;
  onNavigate: (path: string) => void;
}) {
  return (
    <Box
      aria-label="Điều hướng LMS mobile"
      component="nav"
      sx={{
        bottom: 0,
        display: { xs: "block", xl: "none" },
        left: 0,
        px: 1.5,
        pb: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        position: "fixed",
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Paper
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "26px",
          boxShadow: "0 18px 40px rgba(15,23,42,0.16)",
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
          height: 88,
          mx: "auto",
          maxWidth: 430,
          p: 1.25,
        }}
      >
        {items.map((item) => (
          <DockButton
            active={activeSection === item.id}
            badgeCount={item.badgeCount}
            icon={item.icon}
            key={item.id}
            label={item.label}
            onClick={() => onNavigate(item.path)}
          />
        ))}
      </Paper>
    </Box>
  );
}

function DockButton({ active, badgeCount, icon: Icon, label, onClick }: {
  active: boolean;
  badgeCount?: number;
  icon: LmsMobileDockIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      aria-current={active ? "page" : undefined}
      aria-label={label}
      data-selected={active ? "true" : undefined}
      onClick={onClick}
      sx={{
        bgcolor: active ? "rgba(15,108,189,0.08)" : "transparent",
        border: "1px solid",
        borderColor: active ? "rgba(15,108,189,0.14)" : "transparent",
        borderRadius: "18px",
        boxShadow: active ? "0 6px 16px rgba(15,108,189,0.08)" : "none",
        color: active ? "primary.main" : "text.secondary",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        minHeight: 62,
        minWidth: 0,
        px: 0.35,
        "&:active": { transform: "scale(0.97)" },
        "&:focus-visible": { outline: "3px solid", outlineColor: "rgba(15,108,189,0.24)", outlineOffset: 2 },
        "&:hover": { bgcolor: active ? ergEnterpriseTokens.color.primarySofter : "action.hover" },
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: active ? "primary.main" : "transparent",
          borderRadius: "50%",
          color: active ? "primary.contrastText" : "text.primary",
          display: "flex",
          height: 32,
          justifyContent: "center",
          position: "relative",
          width: 32,
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
        {badgeCount ? (
          <Box sx={{ alignItems: "center", bgcolor: "error.main", border: "2px solid", borderColor: "background.paper", borderRadius: 8, color: "error.contrastText", display: "flex", fontSize: 10, fontWeight: 800, justifyContent: "center", minHeight: 18, minWidth: 18, px: 0.25, position: "absolute", right: -6, top: -6 }}>
            {badgeCount > 9 ? "9+" : badgeCount}
          </Box>
        ) : null}
      </Box>
      <Typography color="inherit" noWrap sx={{ fontSize: 11, fontWeight: 800, lineHeight: 1, maxWidth: "100%", px: 0.25 }}>
        {label}
      </Typography>
    </ButtonBase>
  );
}
