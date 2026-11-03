import type { ReactNode } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { type SxProps, type Theme } from "@mui/material/styles";

type ErgButtonProps = ButtonProps & {
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function ErgButton({
  children,
  disabled,
  endIcon,
  leadingIcon,
  loading = false,
  startIcon,
  sx,
  trailingIcon,
  variant = "contained",
  ...props
}: ErgButtonProps) {
  const isContained = variant === "contained";
  const isOutlined = variant === "outlined";

  return (
    <Button
      disabled={disabled || loading}
      endIcon={endIcon ?? trailingIcon}
      startIcon={loading ? <CircularProgress color="inherit" size={16} /> : (startIcon ?? leadingIcon)}
      sx={[
        {
          borderRadius: "10px",
          fontSize: "0.85rem",
          fontWeight: 650,
          letterSpacing: "-0.01em",
          minHeight: 38,
          px: 2,
          py: 0.85,
          textTransform: "none",
          transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
          "&:active": {
            transform: "scale(0.985)",
          },
          ...(isContained
            ? {
                bgcolor: "#0071E3",
                boxShadow: "0 2px 8px rgba(0, 113, 227, 0.28)",
                color: "#FFFFFF",
                "&:hover": {
                  bgcolor: "#0077ED",
                  boxShadow: "0 4px 14px rgba(0, 113, 227, 0.38)",
                },
                "&:active": {
                  bgcolor: "#005BB5",
                  transform: "scale(0.985)",
                },
              }
            : {}),
          ...(isOutlined
            ? {
                bgcolor: "#FFFFFF",
                borderColor: "rgba(0, 0, 0, 0.12)",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                color: "#1D1D1F",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.03)",
                  borderColor: "rgba(0, 0, 0, 0.22)",
                },
              }
            : {}),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>}
      variant={variant}
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

export function ErgIconButton({ label, sx, tooltip, ...props }: ErgIconButtonProps) {
  const button = (
    <IconButton
      aria-label={label}
      sx={[
        {
          borderRadius: "9px",
          color: "#4B5563",
          transition: "all 0.15s ease",
          "&:hover": {
            bgcolor: "rgba(0, 0, 0, 0.05)",
            color: "#1D1D1F",
          },
          "&:active": {
            transform: "scale(0.92)",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
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
          borderRadius: "8px",
          minHeight: 34,
          px: 1.5,
          py: 0.5,
          ...(active
            ? {
                bgcolor: "#0071E3",
                boxShadow: "0 2px 6px rgba(0, 113, 227, 0.24)",
              }
            : {
                bgcolor: "#FFFFFF",
                borderColor: "rgba(0, 0, 0, 0.12)",
                color: "#1D1D1F",
                "&:hover": {
                  bgcolor: "rgba(0, 113, 227, 0.04)",
                  borderColor: "rgba(0, 113, 227, 0.3)",
                },
              }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>}
      {...props}
    />
  );
}
