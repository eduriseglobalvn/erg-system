import type { ReactNode } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

type ErgButtonProps = ButtonProps & {
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function ErgButton({
  children,
  disabled,
  loading = false,
  leadingIcon,
  startIcon,
  trailingIcon,
  endIcon,
  ...props
}: ErgButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress color="inherit" size={16} /> : (startIcon ?? leadingIcon)}
      endIcon={endIcon ?? trailingIcon}
      {...props}
    >
      {children}
    </Button>
  );
}

type ErgIconButtonProps = IconButtonProps & {
  label: string;
  tooltip?: string;
};

export function ErgIconButton({ label, tooltip, ...props }: ErgIconButtonProps) {
  const button = <IconButton aria-label={label} {...props} />;
  return tooltip || label ? <Tooltip title={tooltip ?? label}>{button}</Tooltip> : button;
}

type ErgToolbarButtonProps = ErgButtonProps & {
  active?: boolean;
};

export function ErgToolbarButton({ active = false, sx, variant = "outlined", ...props }: ErgToolbarButtonProps) {
  return (
    <ErgButton
      variant={active ? "contained" : variant}
      sx={[
        {
          minHeight: 36,
          px: 1.5,
          ...(active
            ? {}
            : {
                bgcolor: "background.paper",
                color: "text.primary",
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                },
              }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>}
      {...props}
    />
  );
}
