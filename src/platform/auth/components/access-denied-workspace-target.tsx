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
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

export function AccessDeniedWorkspaceTargetCard({ target }: { target: AccessDeniedWorkspaceTarget }) {
  const tone = workspaceTone(target.workspace);
  return (
    <Box
      component="a"
      href={workspaceHref(target)}
      sx={{
        alignItems: "center",
        bgcolor: "background.paper",
        border: 1,
        borderColor: t.color.border,
        borderRadius: `${t.radius.card}px`,
        color: "text.primary",
        display: "flex",
        gap: 1.5,
        minHeight: 64,
        p: 1.5,
        textDecoration: "none",
        transition: (theme) => theme.transitions.create(["border-color", "background-color"]),
        "&:hover": { bgcolor: t.color.primarySofter, borderColor: "primary.main", "& .target-arrow": { color: "primary.main" } },
        "&:focus-visible": { outline: `2px solid ${t.color.primary}`, outlineOffset: 2 },
      }}
    >
      <Avatar sx={{ bgcolor: tone.background, borderRadius: `${t.radius.control}px`, color: tone.color, height: 40, width: 40 }}>
        <WorkspaceTargetIcon workspace={target.workspace} />
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="p" variant="subtitle2">{target.label}</Typography>
        <Typography color="text.secondary" component="p" variant="caption">{target.description}</Typography>
      </Box>
      <ArrowForwardRoundedIcon className="target-arrow" fontSize="small" sx={{ color: "text.disabled", ml: "auto" }} />
    </Box>
  );
}

function workspaceTone(workspace: AccessDeniedWorkspaceTarget["workspace"]) {
  if (workspace === "STUDENT") return { background: t.color.successSoft, color: t.color.success };
  if (workspace === "CRM") return { background: t.color.warningSoft, color: t.color.warning };
  return { background: t.color.primarySofter, color: t.color.primary };
}

function WorkspaceTargetIcon({ workspace }: { workspace: AccessDeniedWorkspaceTarget["workspace"] }) {
  if (workspace === "ADMIN") return <AdminPanelSettingsRoundedIcon fontSize="small" />;
  if (workspace === "TEACHER") return <SchoolRoundedIcon fontSize="small" />;
  if (workspace === "STUDENT") return <PersonRoundedIcon fontSize="small" />;
  return <BusinessRoundedIcon fontSize="small" />;
}

function workspaceHref(target: AccessDeniedWorkspaceTarget) {
  if (target.workspace !== "CRM" || typeof window === "undefined") return target.path;
  const host = canonicalCrmWorkspaceHostForRuntime(window.location.hostname);
  const port = window.location.port && !["80", "443"].includes(window.location.port) ? `:${window.location.port}` : "";
  return `${window.location.protocol}//${host}${port}${target.path}`;
}
