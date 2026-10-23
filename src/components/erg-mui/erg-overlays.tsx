import Dialog, { type DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Drawer, { type DrawerProps } from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type ReactNode, useId } from "react";

type ErgDialogProps = Omit<DialogProps, "title"> & {
  actions?: ReactNode;
  description?: ReactNode;
  title: ReactNode;
};

export function ErgDialog({ actions, children, description, title, ...props }: ErgDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="sm"
      {...props}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent dividers>
        {description ? (
          <DialogContentText id={descriptionId} sx={{ mb: children ? 2 : 0 }}>
            {description}
          </DialogContentText>
        ) : null}
        {children}
      </DialogContent>
      {actions ? <DialogActions>{actions}</DialogActions> : null}
    </Dialog>
  );
}

type ErgDrawerProps = Omit<DrawerProps, "title"> & {
  description?: ReactNode;
  title: ReactNode;
};

export function ErgDrawer({ children, description, slotProps, title, ...props }: ErgDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Drawer
      anchor="right"
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
              { maxWidth: "100%", width: { xs: "100%", sm: 440 } },
              ...(Array.isArray(paperProps?.sx) ? paperProps.sx : [paperProps?.sx]),
            ],
          };
        },
      }}
      {...props}
    >
      <Stack spacing={0.5} sx={{ px: 2.5, py: 2 }}>
        <Typography id={titleId} sx={{ fontWeight: 800 }} variant="h6">
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary" id={descriptionId} variant="body2">
            {description}
          </Typography>
        ) : null}
      </Stack>
      <Divider />
      <Stack sx={{ minHeight: 0, overflow: "auto", p: 2.5 }}>{children}</Stack>
    </Drawer>
  );
}
