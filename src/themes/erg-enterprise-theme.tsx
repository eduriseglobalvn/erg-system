import { alpha, createTheme } from "@mui/material/styles";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import "@fontsource/manrope/index.css";

export const ergEnterpriseTheme = createTheme({
  palette: {
    primary: {
      main: t.color.primary,
      dark: t.color.primaryHover,
      light: "#3B82D6",
      contrastText: "#FFFFFF",
    },
    error: {
      main: t.color.danger,
      dark: t.color.brandRedHover,
      light: t.color.dangerSoft,
    },
    success: {
      main: t.color.success,
      light: t.color.successSoft,
    },
    warning: {
      main: t.color.warning,
      light: t.color.warningSoft,
    },
    info: {
      main: t.color.info,
      light: t.color.infoSoft,
    },
    background: {
      default: t.color.surfaceSubtle,
      paper: t.color.surface,
    },
    divider: t.color.border,
    text: {
      primary: t.color.text,
      secondary: t.color.textMuted,
      disabled: t.color.textSoft,
    },
  },
  shape: {
    borderRadius: t.radius.md,
  },
  typography: {
    fontFamily: t.font.body,
    h1: { fontSize: 30, fontWeight: 800, lineHeight: 1.2, letterSpacing: 0 },
    h2: { fontSize: 26, fontWeight: 800, lineHeight: 1.24, letterSpacing: 0 },
    h3: { fontSize: 22, fontWeight: 750, lineHeight: 1.3, letterSpacing: 0 },
    h4: { fontSize: 20, fontWeight: 750, lineHeight: 1.35, letterSpacing: 0 },
    h5: { fontSize: 18, fontWeight: 750, lineHeight: 1.4, letterSpacing: 0 },
    h6: { fontSize: 16, fontWeight: 750, lineHeight: 1.45, letterSpacing: 0 },
    subtitle1: { fontSize: 15, fontWeight: 700, lineHeight: 1.45, letterSpacing: 0 },
    subtitle2: { fontSize: 14, fontWeight: 700, lineHeight: 1.45, letterSpacing: 0 },
    body1: { fontSize: 15, fontWeight: 500, lineHeight: 1.55, letterSpacing: 0 },
    body2: { fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: 0 },
    caption: { fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, letterSpacing: 0 },
    button: { fontSize: 14, fontWeight: 750, lineHeight: 1.2, letterSpacing: 0, textTransform: "none" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: t.color.surfaceSubtle,
          color: t.color.text,
          fontFamily: t.font.body,
          textRendering: "optimizeLegibility",
        },
        "strong, b": {
          fontWeight: 750,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        variant: "contained",
      },
      styleOverrides: {
        root: {
          minHeight: t.size.controlMd,
          borderRadius: t.radius.md,
          fontWeight: 750,
          letterSpacing: 0,
          paddingInline: 18,
          textTransform: "none",
          "&.MuiButton-containedPrimary": {
            background: `linear-gradient(135deg, ${t.color.primary}, #1677D2)`,
            boxShadow: "0 8px 18px rgba(15, 108, 189, 0.18)",
            "&:hover": {
              background: `linear-gradient(135deg, ${t.color.primaryHover}, ${t.color.primary})`,
              boxShadow: "0 12px 26px rgba(15, 108, 189, 0.24)",
            },
          },
          "&.MuiButton-containedError": {
            background: `linear-gradient(135deg, ${t.color.brandRed}, #E5483B)`,
            boxShadow: "0 8px 18px rgba(217, 45, 32, 0.18)",
            "&:hover": {
              background: `linear-gradient(135deg, ${t.color.brandRedHover}, ${t.color.brandRed})`,
            },
          },
        },
        sizeSmall: {
          minHeight: t.size.controlSm,
          paddingInline: 12,
        },
        sizeLarge: {
          minHeight: t.size.controlLg,
          paddingInline: 22,
        },
        outlined: {
          borderColor: t.color.borderStrong,
          backgroundColor: t.color.surface,
          color: t.color.text,
          "&:hover": {
            borderColor: alpha(t.color.primary, 0.42),
            backgroundColor: t.color.primarySofter,
          },
        },
        text: {
          color: t.color.textMuted,
          "&:hover": {
            backgroundColor: t.color.surfaceMuted,
            color: t.color.text,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: t.radius.md,
          color: t.color.textMuted,
          "&:hover": {
            backgroundColor: t.color.surfaceMuted,
            color: t.color.primary,
          },
          "&.Mui-focusVisible": {
            boxShadow: t.shadow.focus,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderColor: t.color.border,
          borderRadius: t.radius.lg,
          boxShadow: t.shadow.xs,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.lg,
          backgroundImage: "none",
          boxShadow: t.shadow.xs,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: t.size.controlMd,
          borderRadius: t.radius.md,
          backgroundColor: t.color.surface,
          fontWeight: 600,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: t.color.border,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: t.color.borderStrong,
          },
          "&.Mui-focused": {
            boxShadow: t.shadow.focus,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: t.color.primary,
            borderWidth: 1,
          },
        },
        input: {
          paddingBlock: 10,
          "&::placeholder": {
            color: t.color.textSoft,
            opacity: 1,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: t.color.textMuted,
          fontWeight: 700,
          letterSpacing: 0,
          "&.Mui-focused": {
            color: t.color.primary,
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          marginLeft: 2,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontWeight: 700,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: t.radius.sm,
          fontWeight: 750,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: t.radius.xl,
          border: `1px solid ${t.color.border}`,
          boxShadow: t.shadow.md,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          letterSpacing: 0,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${t.color.border}`,
          color: t.color.text,
          fontSize: 14,
          fontWeight: 600,
          padding: "10px 16px",
        },
        head: {
          backgroundColor: t.color.surfaceMuted,
          color: t.color.textMuted,
          fontSize: 12.5,
          fontWeight: 800,
          textTransform: "uppercase",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover td": {
            backgroundColor: t.color.primarySofter,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: t.radius.sm,
          fontWeight: 700,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: t.radius.sm,
          backgroundColor: "rgba(15, 23, 42, 0.08)",
        },
      },
    },
  },
});

export default ergEnterpriseTheme;
