import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import { Link } from "@tanstack/react-router";

export function Field({
  label,
  children,
  action,
}: {
  label: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box component="label" sx={{ display: "block" }}>
      <Box component="span" sx={{ alignItems: "center", color: "text.primary", display: "flex", fontSize: 14, fontWeight: 600, gap: 1.5, justifyContent: "space-between", mb: 1 }}>
        <span>{label}</span>
        {action}
      </Box>
      {children}
    </Box>
  );
}

export function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{ bgcolor: "background.paper", border: "1px solid #d7e0ec", borderRadius: 1, color: "text.primary", display: "flex", fontSize: 14, fontWeight: 600, gap: 1.25, height: 40, width: "100%", "&:hover": { bgcolor: "background.paper", borderColor: "#b8d6fa" }, "&:focus-visible": { outline: "2px solid", outlineColor: "primary.light", outlineOffset: 2 } }}
    >
      {icon}
      {label}
    </ButtonBase>
  );
}

export function DividerText({ text }: { text: string }) {
  return (
    <Box sx={{ alignItems: "center", color: "text.disabled", display: "flex", fontSize: 14, gap: 2, mt: 3 }}>
      <Divider sx={{ flex: 1 }} />
      <Box component="span">{text}</Box>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );
}

export function MetaBadge({ children }: { children: ReactNode }) {
  return (
    <Box component="span" sx={{ alignItems: "center", bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 1, color: "rgba(255,255,255,0.8)", display: "inline-flex", fontSize: 12, fontWeight: 700, px: 1.5, py: 0.5 }}>
      {children}
    </Box>
  );
}

export function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Paper elevation={0} sx={{ alignItems: "flex-start", bgcolor: "background.default", border: "1px solid", borderColor: "divider", display: "flex", gap: 2, justifyContent: "space-between", px: 2, py: 1.5 }}>
      <Box component="span" sx={{ color: "text.secondary" }}>{label}</Box>
      <Box component="span" sx={{ color: "text.primary", fontWeight: 500, textAlign: "right" }}>{value}</Box>
    </Paper>
  );
}

export function QuickLinkCard({ to, title, caption }: { to: string; title: string; caption: string }) {
  return (
    <Paper component={Link} elevation={0} sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", color: "inherit", display: "block", px: 2, py: 2, textDecoration: "none", transition: "background-color 160ms ease, border-color 160ms ease", "&:hover": { bgcolor: "background.paper", borderColor: "text.disabled" } }} to={to}>
      <Box sx={{ color: "text.primary", fontSize: 14, fontWeight: 700 }}>{title}</Box>
      <Box sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.5, mt: 0.5 }}>{caption}</Box>
    </Paper>
  );
}
