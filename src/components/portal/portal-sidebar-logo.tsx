import Box from "@mui/material/Box";
import { useLocation } from "@tanstack/react-router";
import { ERG_ASSETS } from "@/config/seo";
import {
  COLLAPSED_SIDEBAR_WIDTH,
  EXPANDED_SIDEBAR_WIDTH,
} from "./portal-sidebar-motion";
import { SIDEBAR_FADE_EASING, SIDEBAR_MOTION_CURVE } from "./portal-sidebar-styles";

function homePathForLocation(pathname?: string) {
  if (!pathname) {
    if (typeof window !== "undefined") {
      pathname = window.location.pathname;
    }
  }
  if (pathname === "/admin" || pathname?.startsWith("/admin/")) return "/admin";
  if (pathname === "/student" || pathname?.startsWith("/student/")) return "/student";
  return "/teacher/home";
}

export function SidebarLogo({
  active,
  collapsed,
  onNavigate,
}: {
  active: boolean;
  collapsed: boolean;
  onNavigate: (path: string) => void;
}) {
  let pathname = "";
  try {
     
    const location = useLocation();
    pathname = location?.pathname || "";
  } catch {
    if (typeof window !== "undefined") {
      pathname = window.location.pathname || "";
    }
  }

  const targetHomePath = homePathForLocation(pathname);

  return (
    <Box
      aria-hidden={!active}
      inert={!active}
      sx={{
        alignItems: "center",
        display: "flex",
        height: 68,
        left: 0,
        opacity: active ? 1 : 0,
        pl: collapsed ? 0 : "16px",
        pointerEvents: active ? "auto" : "none",
        position: "absolute",
        top: 0,
        transform: active
          ? "translate3d(0, 0, 0)"
          : `translate3d(${collapsed ? -6 : 6}px, 0, 0)`,
        transition: `opacity ${SIDEBAR_FADE_EASING}, transform ${SIDEBAR_MOTION_CURVE}`,
        width: collapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH,
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
      }}
    >
      <Box
        component="button"
        aria-label="Logo"
        onClick={() => onNavigate(targetHomePath)}
        sx={{
          alignItems: "center",
          appearance: "none",
          bgcolor: "transparent",
          border: 0,
          cursor: "pointer",
          display: "inline-flex",
          height: 40,
          justifyContent: collapsed ? "center" : "flex-start",
          m: 0,
          p: 0,
          width: collapsed ? 38 : 92,
        }}
      >
        <Box
          component="img"
          alt="ERG"
          src={collapsed ? ERG_ASSETS.mobileLogo : ERG_ASSETS.logo}
          sx={{
            height: 34,
            objectFit: "contain",
            objectPosition: collapsed ? "center" : "left center",
            width: collapsed ? 32 : 86,
          }}
        />
      </Box>
    </Box>
  );
}
