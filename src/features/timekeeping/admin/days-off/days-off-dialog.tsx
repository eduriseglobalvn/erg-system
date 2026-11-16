import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useId, type ReactNode } from "react";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

type Props = {
  actions: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  /** Round tinted icon left of the title (the past-periods warning). */
  icon?: ReactNode;
  onClose: () => void;
  role?: "alertdialog" | "dialog";
  /** Content gap in px: 16 (add, warning) or 14 (import). */
  gap?: number;
  title: string;
  /** Paper width in px: 600 add, 760 import, 520 warning. */
  width: number;
};

/** Board dialog: 20 px radius, 24 px padding, 20/600 title with the description under it, 36 px close button and a plain footer (no divider lines). */
export function DaysOffDialog({ actions, children, description, gap = 16, icon, onClose, role = "dialog", title, width }: Props) {
  const titleId = useId();
  return (
    <Dialog
      fullWidth
      maxWidth={false}
      onClose={onClose}
      open
      slotProps={{
        backdrop: { sx: { bgcolor: alpha(t.color.text, 0.32) } },
        paper: { "aria-labelledby": titleId, role, sx: { borderRadius: `${t.radius.shell}px`, boxShadow: t.shadow.float, display: "flex", flexDirection: "column", gap: `${gap}px`, maxWidth: width, p: 3 } },
      }}
    >
      <Box component="header" sx={{ alignItems: "flex-start", display: "flex", gap: icon ? 1.5 : 1 }}>
        {icon ? <Box aria-hidden sx={{ alignItems: "center", bgcolor: t.schedule.clash.bg, borderRadius: "50%", color: t.schedule.clash.text, display: "flex", flex: "0 0 40px", height: 40, justifyContent: "center", width: 40 }}>{icon}</Box> : null}
        <Box sx={{ flex: 1 }}>
          <Typography component="h2" id={titleId} variant="h3">{title}</Typography>
          {description ? <Typography component="div" sx={{ color: t.color.textSecondary, mt: "4px" }} variant="body2">{description}</Typography> : null}
        </Box>
        <IconButton aria-label="Đóng" onClick={onClose} sx={{ color: t.color.textMuted, height: 36, width: 36 }}><CloseIcon /></IconButton>
      </Box>
      {children}
      <Box component="footer" sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>{actions}</Box>
    </Dialog>
  );
}
