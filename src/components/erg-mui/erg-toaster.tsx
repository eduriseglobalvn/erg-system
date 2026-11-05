import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme, type Theme } from "@mui/material/styles";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Toast icons follow the body text size from the theme.
const iconSx = { fontSize: (theme: Theme) => theme.typography.body1.fontSize } as const;

/** Global sonner toaster styled from the MUI theme (replaces the shadcn wrapper). */
export function ErgToaster(props: ToasterProps) {
  const theme = useTheme();
  return (
    <Sonner
      theme="light"
      icons={{
        success: <CheckCircleOutlineIcon sx={{ ...iconSx, color: "success.main" }} />,
        info: <InfoOutlinedIcon sx={{ ...iconSx, color: "info.main" }} />,
        warning: <WarningAmberIcon sx={{ ...iconSx, color: "warning.main" }} />,
        error: <ErrorOutlineIcon sx={{ ...iconSx, color: "error.main" }} />,
        loading: <CircularProgress size={14} color="inherit" />,
      }}
      style={
        {
          "--normal-bg": theme.palette.background.paper,
          "--normal-text": theme.palette.text.primary,
          "--normal-border": theme.palette.divider,
          "--border-radius": `${theme.shape.borderRadius}px`,
          fontFamily: theme.typography.fontFamily,
        } as CSSProperties
      }
      {...props}
    />
  );
}
