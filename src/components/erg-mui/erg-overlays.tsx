import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Dialog, { type DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Drawer, { type DrawerProps } from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type ReactNode, useId } from "react";

type ErgDialogProps = Omit<DialogProps, "title"> & {
  actions?: ReactNode;
  description?: ReactNode;
  title: ReactNode;
};

export function ErgDialog({ actions, children, description, onClose, slotProps, title, ...props }: ErgDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      slotProps={{
        ...slotProps,
        backdrop: {
          sx: {
            backdropFilter: "blur(8px)",
            bgcolor: "rgba(0, 0, 0, 0.4)",
          },
        },
        paper: {
          elevation: 0,
          sx: {
            bgcolor: "#FFFFFF",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "20px",
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.06)",
            overflow: "hidden",
          },
        },
      }}
      {...props}
    >
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", px: 3, pt: 2.5, pb: 1.5 }}>
        <DialogTitle
          id={titleId}
          sx={{
            color: "#1D1D1F",
            fontSize: "1.2rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            p: 0,
          }}
        >
          {title}
        </DialogTitle>
        {onClose ? (
          <IconButton
            aria-label="Đóng"
            onClick={(e) => onClose(e, "backdropClick")}
            size="small"
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.05)",
              color: "#1D1D1F",
              height: 30,
              width: 30,
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.09)", transform: "scale(1.05)" },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        ) : null}
      </Box>

      <DialogContent sx={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)", p: 3 }}>
        {description ? (
          <DialogContentText
            id={descriptionId}
            sx={{
              color: "#6E6E73",
              fontSize: "0.85rem",
              fontWeight: 500,
              mb: children ? 2.5 : 0,
            }}
          >
            {description}
          </DialogContentText>
        ) : null}
        {children}
      </DialogContent>

      {actions ? (
        <DialogActions
          sx={{
            bgcolor: "#FBFBFD",
            borderTop: "1px solid rgba(0, 0, 0, 0.06)",
            px: 3,
            py: 1.75,
          }}
        >
          {actions}
        </DialogActions>
      ) : null}
    </Dialog>
  );
}

type ErgDrawerProps = Omit<DrawerProps, "title"> & {
  description?: ReactNode;
  title: ReactNode;
};

export function ErgDrawer({ children, description, onClose, slotProps, title, ...props }: ErgDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      slotProps={{
        ...slotProps,
        paper: (ownerState) => {
          const paperProps = typeof slotProps?.paper === "function"
            ? slotProps.paper(ownerState)
            : slotProps?.paper;
          return {
            ...paperProps,
            "aria-describedby": description ? descriptionId : undefined,
            "aria-labelledby": titleId,
            role: "dialog",
            sx: [
              {
                bgcolor: "#FBFBFD",
                borderRadius: { sm: "20px 0 0 20px" },
                boxShadow: "0 20px 48px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06)",
                maxWidth: "100%",
                width: { xs: "100%", sm: 460 },
              },
              ...(Array.isArray(paperProps?.sx) ? paperProps.sx : [paperProps?.sx]),
            ],
          };
        },
      }}
      {...props}
    >
      <Box sx={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between", px: 3, py: 2.25 }}>
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography
            id={titleId}
            sx={{
              color: "#1D1D1F",
              fontSize: "1.15rem",
              fontWeight: 800,
              letterSpacing: "-0.015em",
            }}
            variant="h6"
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              color="text.secondary"
              id={descriptionId}
              sx={{ color: "#86868B", fontSize: "0.8rem", fontWeight: 500 }}
              variant="body2"
            >
              {description}
            </Typography>
          ) : null}
        </Stack>

        {onClose ? (
          <IconButton
            aria-label="Đóng ngăn"
            onClick={(e) => onClose(e, "backdropClick")}
            size="small"
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.05)",
              color: "#1D1D1F",
              height: 30,
              width: 30,
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.09)", transform: "scale(1.05)" },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        ) : null}
      </Box>
      <Divider sx={{ borderColor: "rgba(0, 0, 0, 0.06)" }} />
      <Stack sx={{ minHeight: 0, overflow: "auto", p: 3 }}>{children}</Stack>
    </Drawer>
  );
}
