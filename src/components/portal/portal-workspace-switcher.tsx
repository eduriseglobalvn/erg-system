import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { workspaceCapabilities, workspacesFromLegacyPortals } from "@/platform/workspaces/workspace-switcher";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import {
  canonicalCrmWorkspaceHostForRuntime,
  canonicalLmsWorkspaceHostForRuntime,
} from "@/platform/workspaces/workspace-route";

function workspaceFromPath(pathname: string, hostname = typeof window === "undefined" ? "" : window.location.hostname): Workspace {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment === "admin") return "ADMIN";
  if (segment === "student") return "STUDENT";
  if (hostname.toLowerCase() === canonicalCrmWorkspaceHostForRuntime(hostname)) return "CRM";
  if (hostname.toLowerCase() === "crm.erg.edu.local" || hostname.toLowerCase() === "crm.erg.edu.vn") return "CRM";
  if (hostname.toLowerCase() === "lcms.erg.edu.local") return "ADMIN";
  if (segment === "crm") return "CRM";
  return "TEACHER";
}

function runtimeOriginForWorkspace(workspace: Workspace) {
  if (typeof window === "undefined") return undefined;
  const host = workspace === "CRM"
    ? canonicalCrmWorkspaceHostForRuntime(window.location.hostname)
    : canonicalLmsWorkspaceHostForRuntime(window.location.hostname);
  const port = window.location.port;
  const hostWithPort = port && port !== "80" && port !== "443" ? `${host}:${port}` : host;
  return `${window.location.protocol}//${hostWithPort}`;
}

const WORKSPACE_ICONS: Record<Workspace, ReactNode> = {
  ADMIN: <AdminPanelSettingsRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />,
  TEACHER: <SchoolRoundedIcon sx={{ fontSize: 18, color: "success.main" }} />,
  STUDENT: <MenuBookRoundedIcon sx={{ fontSize: 18, color: "info.main" }} />,
  CRM: <BusinessRoundedIcon sx={{ fontSize: 18, color: "warning.main" }} />,
};

const WORKSPACE_LOCAL_PATHS: Record<Workspace, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher/home",
  STUDENT: "/student",
  CRM: "/",
};

export function PortalWorkspaceSwitcher({
  portals = [],
  workspaces,
  onNavigate,
}: {
  portals?: string[];
  workspaces?: readonly Workspace[];
  onNavigate?: (path: string) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const current = workspaceFromPath(location.pathname);
  const granted = workspaces?.length ? [...workspaces] : workspacesFromLegacyPortals(portals, current);
  const capabilities = workspaceCapabilities(granted, current, location.pathname, { originForWorkspace: runtimeOriginForWorkspace });
  if (capabilities.length < 2) return null;

  return (
    <>
      <Button variant="contained"
        aria-label="Chuyển workspace"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={<AppsRoundedIcon sx={{ fontSize: 18 }} />}
        sx={{
          bgcolor: anchorEl ? "action.selected" : "transparent",
          borderRadius: "8px",
          color: "text.primary",
          fontSize: 12.5,
          fontWeight: 600,
          minWidth: 0,
          px: { xs: 0.75, sm: 1.25 },
          py: 0.5,
          textTransform: "none",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Workspace</Box>
      </Button>
      <Menu
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        open={Boolean(anchorEl)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
              minWidth: 200,
              mt: 0.75,
              p: 0.5,
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 0.75 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Không gian làm việc
          </Typography>
        </Box>
        {capabilities.map((capability) => {
          const isCurrent = capability.workspace === current;
          const targetPath = WORKSPACE_LOCAL_PATHS[capability.workspace];
          return (
            <MenuItem
              component="a"
              href={capability.href}
              key={capability.workspace}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  setAnchorEl(null);
                  if (onNavigate) {
                    onNavigate(targetPath);
                  } else {
                    void navigate({ href: targetPath });
                  }
                } else {
                  setAnchorEl(null);
                }
              }}
              sx={{
                bgcolor: isCurrent ? "action.selected" : "transparent",
                borderRadius: "8px",
                display: "flex",
                gap: 1.25,
                fontWeight: isCurrent ? 700 : 500,
                fontSize: 13,
                my: 0.25,
                py: 0.75,
                "&:hover": { bgcolor: isCurrent ? "action.selected" : "action.hover" },
              }}
            >
              <Box component="span" sx={{ display: "inline-flex", flexShrink: 0 }}>
                {WORKSPACE_ICONS[capability.workspace]}
              </Box>
              <Typography variant="body2" sx={{ flex: 1, fontWeight: "inherit", fontSize: "inherit" }}>
                {capability.label}
              </Typography>
              {isCurrent ? (
                <CheckRoundedIcon sx={{ color: "primary.main", fontSize: 16 }} />
              ) : null}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
