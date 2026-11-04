import { alpha, createTheme } from "@mui/material/styles";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";

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
    borderRadius: t.radius.sm,
  },
  typography: {
    fontFamily: t.font.body,
    h1: { fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: 0 },
    h2: { fontSize: 22, fontWeight: 600, lineHeight: 1.24, letterSpacing: 0 },
    h3: { fontSize: 20, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0 },
    h4: { fontSize: 18, fontWeight: 600, lineHeight: 1.35, letterSpacing: 0 },
    h5: { fontSize: 16, fontWeight: 600, lineHeight: 1.4, letterSpacing: 0 },
    h6: { fontSize: 15, fontWeight: 600, lineHeight: 1.45, letterSpacing: 0 },
    subtitle1: { fontSize: 14, fontWeight: 600, lineHeight: 1.45, letterSpacing: 0 },
    subtitle2: { fontSize: 14, fontWeight: 600, lineHeight: 1.45, letterSpacing: 0 },
    body1: { fontSize: 14, fontWeight: 400, lineHeight: 1.55, letterSpacing: 0 },
    body2: { fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 },
    caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.45, letterSpacing: 0 },
    button: { fontSize: 14, fontWeight: 600, lineHeight: 1.2, letterSpacing: 0, textTransform: "none" },
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
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            scrollBehavior: "auto !important",
            transitionDuration: "0.01ms !important",
          },
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          transition: "background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, color 160ms ease, opacity 160ms ease, transform 160ms ease",
          "&.Mui-focusVisible": {
            boxShadow: t.shadow.focus,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        variant: "text",
      },
      styleOverrides: {
        root: {
          minHeight: t.size.controlMd,
          borderRadius: t.radius.xs,
          fontWeight: 600,
          letterSpacing: 0,
          paddingInline: 18,
          textTransform: "none",
          "&.MuiButton-containedPrimary": {
            backgroundColor: t.color.primary,
            boxShadow: t.shadow.xs,
            "&:hover": {
              backgroundColor: t.color.primaryHover,
              boxShadow: t.shadow.sm,
            },
          },
          "&.MuiButton-containedError": {
            backgroundColor: t.color.brandRed,
            boxShadow: t.shadow.xs,
            "&:hover": {
              backgroundColor: t.color.brandRedHover,
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
          borderRadius: t.radius.sm,
          boxShadow: "none", // shadows only for menu/popover/dialog (plan 7.1)
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow: t.shadow.sm,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.sm,
          backgroundImage: "none",
          boxShadow: "none", // cards are separated by border only (plan 7.1); shadows are for menus/dialogs
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: t.size.controlMd,
          borderRadius: t.radius.md,
          backgroundColor: t.color.surface,
          fontWeight: 400,
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
          fontWeight: 500,
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
          fontWeight: 400,
          marginLeft: 2,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontWeight: 400,
        },
      },
    },
    // palette.*.light is a translucent soft tint; MUI derives Alert text from it, which made the text unreadable.
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          const severity = ownerState.severity ?? "success";
          const action = { "& .MuiAlert-action .MuiButton-root": { whiteSpace: "nowrap" } };
          if (ownerState.variant === "filled") return action;
          return {
            ...action,
            ...(ownerState.variant === "outlined"
              ? { borderColor: alpha(theme.palette[severity].main, 0.4) }
              : { backgroundColor: theme.palette[severity].light }),
            color: theme.palette.text.primary,
            "& .MuiAlert-icon": { color: theme.palette[severity].main },
          };
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: t.radius.sm,
          fontWeight: 600,
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
          fontWeight: 600,
          letterSpacing: 0,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: t.color.surface,
          backgroundImage: "none",
          borderColor: t.color.border,
          boxShadow: t.shadow.sm,
        },
      },
    },
    MuiMenu: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        paper: {
          border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.md,
          boxShadow: t.shadow.sm,
          marginTop: 6,
        },
        list: {
          paddingBlock: 6,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: t.size.controlMd,
        },
        indicator: {
          borderRadius: t.radius.xs,
          height: 2,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${t.color.border}`,
          color: t.color.text,
          fontSize: 14,
          fontWeight: 400,
          padding: "12px 16px",
        },
        head: {
          backgroundColor: t.color.surfaceMuted,
          color: t.color.textMuted,
          fontSize: 12,
          fontWeight: 600,
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
      defaultProps: { animation: "wave" },
      styleOverrides: {
        root: {
          borderRadius: t.radius.sm,
          backgroundColor: "rgba(15, 23, 42, 0.08)",
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          "& .MuiSnackbarContent-root": {
            backgroundColor: t.color.text,
            borderRadius: t.radius.md,
            boxShadow: t.shadow.sm,
            color: t.color.surface,
            fontWeight: 650,
          },
        },
      },
    },
  },
});

export default ergEnterpriseTheme;
