import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { canonicalCrmWorkspaceHostForRuntime } from "@/platform/workspaces/workspace-route";
import type { AccessDeniedWorkspaceTarget } from "@/platform/auth/utils/access-denied";

export function AccessDeniedWorkspaceTargetCard({ target }: { target: AccessDeniedWorkspaceTarget }) {
  return (
    <Box
      component="a"
      href={workspaceHref(target)}
      sx={{
        alignItems: "center",
        bgcolor: "common.white",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        color: "text.primary",
        display: "flex",
        gap: 1.25,
        minHeight: 76,
        p: 1.5,
        textDecoration: "none",
        transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
        "&:hover": { borderColor: "primary.main", boxShadow: "0 8px 20px rgba(15,108,189,0.12)", transform: "translateY(-1px)" },
        "&:focus-visible": { boxShadow: "0 0 0 3px rgba(15,108,189,0.18)", outline: "none" },
      }}
    >
      <Avatar sx={{ bgcolor: "rgba(15,108,189,0.1)", color: "primary.main", height: 38, width: 38 }}><WorkspaceTargetIcon workspace={target.workspace} /></Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{target.label}</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 11, lineHeight: 1.4, mt: 0.25 }}>{target.description}</Typography>
      </Box>
      <ArrowForwardRoundedIcon sx={{ color: "primary.main", fontSize: 19, ml: "auto" }} />
    </Box>
  );
}

function WorkspaceTargetIcon({ workspace }: { workspace: AccessDeniedWorkspaceTarget["workspace"] }) {
  if (workspace === "ADMIN") return <AdminPanelSettingsRoundedIcon sx={{ fontSize: 20 }} />;
  if (workspace === "TEACHER") return <SchoolRoundedIcon sx={{ fontSize: 20 }} />;
  if (workspace === "STUDENT") return <PersonRoundedIcon sx={{ fontSize: 20 }} />;
  return <BusinessRoundedIcon sx={{ fontSize: 20 }} />;
}

function workspaceHref(target: AccessDeniedWorkspaceTarget) {
  if (target.workspace !== "CRM" || typeof window === "undefined") return target.path;
  const host = canonicalCrmWorkspaceHostForRuntime(window.location.hostname);
  const port = window.location.port && !["80", "443"].includes(window.location.port) ? `:${window.location.port}` : "";
  return `${window.location.protocol}//${host}${port}${target.path}`;
}
