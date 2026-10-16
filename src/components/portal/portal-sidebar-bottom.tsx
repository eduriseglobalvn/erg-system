import { Box, Divider, Typography } from "@mui/material";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { ERG_ASSETS } from "@/config/seo";
import type { PortalInfo } from "./ErgPortalLayout";
import {
  NAV_ACTIVE_BG,
  NAV_ACTIVE_BORDER,
  NAV_BUTTON_BG,
  NAV_ITEM_COLOR,
  NAV_PRIMARY,
  SIDEBAR_FADE_EASING,
  SIDEBAR_MOTION_MS,
  SUBMENU_MOTION_EASING,
} from "./portal-sidebar-styles";

export function SidebarBottom({
  collapsed,
  portalInfo,
  onNavigate,
}: {
  collapsed: boolean;
  portalInfo?: PortalInfo;
  onNavigate: (path: string) => void;
}) {
  const centerName =
    portalInfo?.centerName || portalInfo?.name || "ERG Education";
  const planLabel = portalInfo?.plan || "ADVANCED";

  return (
    <Box
      sx={{
        maxHeight: collapsed ? 12 : 240,
        opacity: collapsed ? 0 : 1,
        overflow: "hidden",
        pointerEvents: collapsed ? "none" : "auto",
        px: 1.5,
        pb: collapsed ? 0 : 3,
        pt: collapsed ? 0 : 4,
        transform: collapsed
          ? "translateY(10px)"
          : "translateY(0)",
        transformOrigin: "bottom center",
        transition: `max-height ${SIDEBAR_MOTION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${SIDEBAR_FADE_EASING}, transform ${SUBMENU_MOTION_EASING}, padding ${SIDEBAR_MOTION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <Divider
        sx={{ borderColor: "rgba(145,158,171,0.12)", mb: 2, width: "100%" }}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 1.5,
          position: "relative",
        }}
      >
        <Box sx={{ height: 44, position: "relative", width: 112 }}>
          <Box
            component="img"
            alt="ERG Education"
            src={ERG_ASSETS.logo}
            sx={{
              height: 36,
              objectFit: "contain",
              objectPosition: "center",
              width: 112,
            }}
          />
          <Box
            component="span"
            sx={{
              background: NAV_ACTIVE_BG,
              border: `1px solid ${NAV_ACTIVE_BORDER}`,
              borderRadius: "6px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.62)",
              color: NAV_PRIMARY,
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "18px",
              px: 0.75,
              position: "absolute",
              right: -6,
              top: -8,
            }}
          >
            {planLabel}
          </Box>
        </Box>
      </Box>

      <Typography
        sx={{
          color: NAV_ITEM_COLOR,
          fontSize: 13,
          fontWeight: 400,
          lineHeight: "22px",
          mb: 3,
          textAlign: "center",
        }}
      >
        {centerName}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
        {["Mua Coin", "Nang cap"].map((label) => (
          <Box
            key={label}
            onClick={() => {}}
            sx={{
              "&:hover": {
                background: NAV_ACTIVE_BG,
                borderColor: NAV_ACTIVE_BORDER,
                color: NAV_PRIMARY,
              },
              background: NAV_BUTTON_BG,
              border: `1px solid ${NAV_ACTIVE_BORDER}`,
              borderRadius: "6px",
              color: NAV_PRIMARY,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72)",
              px: 2,
              py: 1,
            }}
          >
            {label}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Box
          onClick={() => onNavigate("/faqs")}
          sx={{
            "&:hover": { color: NAV_PRIMARY },
            alignItems: "center",
            color: NAV_ITEM_COLOR,
            cursor: "pointer",
            display: "flex",
            fontSize: 12,
            gap: 0.5,
          }}
        >
          <HelpOutlineRoundedIcon sx={{ fontSize: 16 }} />
          Trung tam tro giup
        </Box>
      </Box>
    </Box>
  );
}
