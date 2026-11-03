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
        bgcolor: "#FFFFFF",
        border: "1px solid",
        borderColor: "rgba(0, 0, 0, 0.08)",
        borderRadius: "16px",
        color: "text.primary",
        display: "flex",
        gap: 1.75,
        minHeight: 76,
        p: 2,
        textDecoration: "none",
        transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
        "&:hover": {
          borderColor: "#0071E3",
          bgcolor: "rgba(240, 247, 255, 0.5)",
          boxShadow: "0 8px 24px rgba(0, 113, 227, 0.1)",
          transform: "translateY(-1px)",
          "& .target-arrow": {
            transform: "translateX(3px)",
            color: "#0071E3",
          },
        },
        "&:focus-visible": {
          boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.25)",
          outline: "none",
        },
      }}
    >
      <Avatar
        sx={{
          bgcolor: workspaceBgColor(target.workspace),
          color: workspaceIconColor(target.workspace),
          height: 42,
          width: 42,
          borderRadius: "12px",
          border: "1px solid rgba(0, 0, 0, 0.04)",
        }}
      >
        <WorkspaceTargetIcon workspace={target.workspace} />
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>
          {target.label}
        </Typography>
        <Typography sx={{ color: "#6E6E73", fontSize: 12, lineHeight: 1.45, mt: 0.25 }}>
          {target.description}
        </Typography>
      </Box>
      <ArrowForwardRoundedIcon
        className="target-arrow"
        sx={{
          color: "#86868B",
          fontSize: 18,
          ml: "auto",
          transition: "transform 180ms ease, color 180ms ease",
        }}
      />
    </Box>
  );
}

function workspaceBgColor(workspace: AccessDeniedWorkspaceTarget["workspace"]) {
  if (workspace === "ADMIN") return "rgba(105, 108, 255, 0.1)";
  if (workspace === "TEACHER") return "rgba(0, 113, 227, 0.1)";
  if (workspace === "STUDENT") return "rgba(52, 199, 89, 0.12)";
  return "rgba(255, 149, 0, 0.12)";
}

function workspaceIconColor(workspace: AccessDeniedWorkspaceTarget["workspace"]) {
  if (workspace === "ADMIN") return "#696CFF";
  if (workspace === "TEACHER") return "#0071E3";
  if (workspace === "STUDENT") return "#248A3D";
  return "#D97706";
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
