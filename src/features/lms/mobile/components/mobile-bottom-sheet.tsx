import { type ReactNode, useId } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function MobileBottomSheet({
  children,
  description,
  open,
  title,
  onOpenChange,
}: {
  children: ReactNode;
  description?: string;
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Drawer
      anchor="bottom"
      onClose={() => onOpenChange(false)}
      open={open}
      slotProps={{
        backdrop: { sx: { backdropFilter: "blur(2px)", bgcolor: "rgba(15,23,42,0.45)" } },
        paper: {
          "aria-describedby": description ? descriptionId : undefined,
          "aria-labelledby": titleId,
          role: "dialog",
          sx: {
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "24px 24px 0 0",
            display: { xs: "flex", xl: "none" },
            maxHeight: "88dvh",
            overflow: "hidden",
            pb: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
          },
        },
      }}
    >
      <Box sx={{ bgcolor: "text.disabled", borderRadius: 4, height: 6, mt: 1.5, mx: "auto", opacity: 0.45, width: 48 }} />
      <Stack alignItems="flex-start" direction="row" justifyContent="space-between" spacing={1.5} sx={{ minHeight: 64, px: 2, py: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography id={titleId} noWrap sx={{ fontSize: 15, fontWeight: 800 }}>{title}</Typography>
          {description ? <Typography color="text.secondary" id={descriptionId} sx={{ fontSize: 12, fontWeight: 600, mt: 0.5 }}>{description}</Typography> : null}
        </Box>
        <IconButton aria-label="Đóng" onClick={() => onOpenChange(false)} sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", flexShrink: 0 }}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>
      <Divider />
      <Box sx={{ bgcolor: "background.default", maxHeight: "calc(88dvh - 82px)", overflowY: "auto", px: 2, py: 1.5 }}>
        {children}
      </Box>
    </Drawer>
  );
}
