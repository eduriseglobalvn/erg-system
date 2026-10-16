import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { useLocation } from "@tanstack/react-router";

import { workspaceCapabilities } from "@/platform/workspaces/workspace-switcher";
import { workspacesFromLegacyPortals } from "@/platform/workspaces/workspace-switcher";
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

export function PortalWorkspaceSwitcher({ portals = [], workspaces }: { portals?: string[]; workspaces?: readonly Workspace[] }) {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const current = workspaceFromPath(location.pathname);
  const granted = workspaces?.length ? [...workspaces] : workspacesFromLegacyPortals(portals, current);
  const capabilities = workspaceCapabilities(granted, current, location.pathname, { originForWorkspace: runtimeOriginForWorkspace });
  if (capabilities.length < 2) return null;

  return (
    <>
      <Button
        aria-label="Chuyển workspace"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={<AppsRoundedIcon />}
        sx={{ color: "text.primary", fontSize: 12, fontWeight: 700, minWidth: 0, px: { xs: 0.5, sm: 1 }, textTransform: "none" }}
      >
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Workspace</Box>
      </Button>
      <Menu anchorEl={anchorEl} onClose={() => setAnchorEl(null)} open={Boolean(anchorEl)}>
        {capabilities.map((capability) => (
          <MenuItem component="a" href={capability.href} key={capability.workspace} onClick={() => setAnchorEl(null)}>
            {capability.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
