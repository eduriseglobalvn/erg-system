import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type ReactNode, useId } from "react";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** Right-side sheet shared by the question (A2) and quiz (B2) quick views: header, chips, scrolling body, footer. */
export function QuickViewDrawer({
  children,
  chips,
  closeLabel,
  footerEnd,
  footerStart,
  onClose,
  open,
  subtitle,
  title,
}: {
  children: ReactNode;
  chips: ReactNode;
  closeLabel: string;
  footerEnd: ReactNode;
  /** Destructive action, kept apart on the left. */
  footerStart?: ReactNode;
  onClose: () => void;
  open: boolean;
  subtitle?: ReactNode;
  title: ReactNode;
}) {
  const titleId = useId();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          "aria-labelledby": titleId,
          role: "dialog",
          sx: {
            borderRadius: { md: `${t.radius.shell}px 0 0 ${t.radius.shell}px` },
            boxShadow: t.shadow.float,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            width: { xs: "100%", md: 480 },
          },
        },
      }}
    >
      <Stack component="header" spacing={1.25} sx={{ borderBottom: `1px solid ${t.color.border}`, px: 2, py: 1.75 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Typography id={titleId} variant="h4" component="h2">{title}</Typography>
            {subtitle ? <Typography variant="body2" sx={{ color: t.color.textMuted }}>{subtitle}</Typography> : null}
          </Stack>
          <ErgIconButton label={closeLabel} size="small" onClick={onClose}>
            <CloseRoundedIcon fontSize="small" />
          </ErgIconButton>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>{chips}</Stack>
      </Stack>
      <Stack spacing={2.25} sx={{ bgcolor: t.color.surfaceSubtle, flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
        {children}
      </Stack>
      <Stack component="footer" direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap", borderTop: `1px solid ${t.color.border}`, px: 2, py: 1.5 }}>
        {footerStart}
        <Box sx={{ flex: 1 }} />
        {footerEnd}
      </Stack>
    </Drawer>
  );
}

/** Section heading + content inside a quick view body. */
export function QuickViewSection({ children, title }: { children: ReactNode; title: ReactNode }) {
  return (
    <Stack component="section" spacing={1}>
      <Typography variant="subtitle1" component="h3" sx={{ color: t.color.textSecondary }}>{title}</Typography>
      {children}
    </Stack>
  );
}
