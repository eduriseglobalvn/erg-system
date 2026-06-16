/**
 * CenterUp EXACT MUI Theme
 * Extracted pixel-perfect from CenterUp staging via Playwright measurement (2026-06-11)
 *
 * Colors:  Primary #696CFF (PURPLE), Sidebar #1C252E
 * Font:    Manrope Variable
 * Radius:  8px
 */
import { createTheme, type ThemeOptions } from '@mui/material/styles';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

// Manrope font — imported via @fontsource/manrope
// Fontsource v5 doesn't have variable.css; using index.css which loads all weights
import '@fontsource/manrope/index.css';

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#696CFF',
      light: '#A8ABFF',
      dark: '#4A4DCC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F4F6F8',
      contrastText: '#1C252E',
    },
    text: {
      primary: '#1C252E',
      secondary: '#637381',
      disabled: '#919EAB',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    divider: 'rgba(145, 158, 171, 0.2)',
    error: {
      main: '#FF5630',
      light: 'rgba(255, 86, 48, 0.12)',
    },
    warning: {
      main: '#FFAB00',
      light: 'rgba(255, 171, 0, 0.16)',
    },
    success: {
      main: '#22C55E',
      light: 'rgba(34, 197, 94, 0.12)',
    },
    info: {
      main: '#00B8D9',
      light: 'rgba(0, 184, 217, 0.12)',
    },
    grey: {
      50: '#FFFFFF',
      100: '#F4F6F8',
      200: 'rgba(145, 158, 171, 0.12)',
      300: 'rgba(145, 158, 171, 0.2)',
      400: '#919EAB',
      500: '#637381',
      600: '#475569',
      700: '#1C252E',
      800: '#1C252E',
      900: '#0F172A',
    },
  },
  typography: {
    fontFamily: '"Manrope Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h5: {
      fontSize: 20,
      fontWeight: 700,
      lineHeight: 1.4,
      color: '#1C252E',
    },
    h6: {
      fontSize: 18,
      fontWeight: 600,
      lineHeight: 1.45,
      color: '#1C252E',
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#1C252E',
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1C252E',
    },
    body1: {
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#1C252E',
    },
    body2: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.4,
      color: '#1C252E',
    },
    caption: {
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#637381',
    },
    button: {
      fontSize: 14,
      fontWeight: 600,
      textTransform: 'none',
      lineHeight: 1.2,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
  components: {
    // ---- BUTTON ----
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 36,
          padding: '6px 16px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
        },
        sizeSmall: {
          minHeight: 30,
          padding: '4px 10px',
          fontSize: 13,
        },
        sizeLarge: {
          minHeight: 44,
          padding: '8px 22px',
          fontSize: 15,
        },
        contained: {
          boxShadow: '0 1px 2px rgba(105, 108, 255, 0.12)',
          '&:hover': {
            background: '#585BE0',
            boxShadow: '0 4px 8px rgba(105, 108, 255, 0.2)',
          },
          '&:active': {
            background: '#4A4DCC',
          },
        },
        outlined: {
          borderColor: 'rgba(145, 158, 171, 0.24)',
          color: '#1C252E',
          '&:hover': {
            borderColor: '#1C252E',
            background: 'rgba(145, 158, 171, 0.04)',
          },
        },
        text: {
          color: '#637381',
          '&:hover': {
            background: 'rgba(145, 158, 171, 0.08)',
            color: '#1C252E',
          },
        },
      },
    },

    // ---- TABLE ----
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '6px 16px',
          fontSize: 14,
          lineHeight: 1.4,
          color: '#1C252E',
          borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
        },
        head: {
          fontWeight: 600,
          color: '#637381',
          background: '#FFFFFF',
          borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
        },
        body: {
          background: '#FFFFFF',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover td': {
            background: 'rgba(105, 108, 255, 0.02)',
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          fontSize: 14,
          color: '#637381',
        },
      },
    },

    // ---- PAPER / CARD ----
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid rgba(145, 158, 171, 0.12)',
          borderRadius: 8,
          background: '#FFFFFF',
        },
        elevation1: {
          boxShadow: 'none',
        },
      },
    },

    // ---- CARD ----
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(145, 158, 171, 0.12)',
          borderRadius: 8,
          boxShadow: 'none',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
          '&:last-child': {
            paddingBottom: 20,
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '20px 24px 0',
        },
        title: {
          fontSize: 18,
          fontWeight: 600,
          color: '#1C252E',
        },
      },
    },

    // ---- TABS ----
    MuiTab: {
      styleOverrides: {
        root: {
          padding: '8px 24px',
          fontSize: 14,
          fontWeight: 500,
          color: '#637381',
          textTransform: 'none',
          minHeight: 40,
          '&.Mui-selected': {
            color: '#696CFF',
            fontWeight: 600,
          },
          '&:hover': {
            color: '#696CFF',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 2,
          background: '#696CFF',
        },
      },
    },

    // ---- INPUT ----
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 40,
          fontSize: 14,
          color: '#1C252E',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(145, 158, 171, 0.2)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#696CFF',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#696CFF',
            borderWidth: 1,
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(105, 108, 255, 0.12)',
          },
        },
        input: {
          padding: '8px 12px',
          height: 'auto',
          '&::placeholder': {
            color: '#919EAB',
            opacity: 1,
          },
        },
        notchedOutline: {
          transition: 'border-color 150ms ease',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 500,
          color: '#1C252E',
          '&.Mui-focused': {
            color: '#696CFF',
          },
        },
      },
    },

    // ---- SELECT ----
    MuiSelect: {
      defaultProps: {
        IconComponent: KeyboardArrowDownRoundedIcon,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 40,
          fontSize: 14,
        },
        select: {
          padding: '8px 36px 8px 14px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 14,
          minHeight: 40,
        },
      },
    },

    // ---- CHECKBOX ----
    MuiCheckbox: {
      styleOverrides: {
        root: {
          width: 18,
          height: 18,
          borderRadius: 4,
          padding: 0,
        },
      },
    },

    // ---- CHIP / BADGE ----
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 500,
          height: 'auto',
          padding: '4px 2px',
        },
        label: {
          padding: '0 8px',
        },
        colorSuccess: {
          background: 'rgba(34, 197, 94, 0.12)',
          color: '#118D57',
        },
        colorWarning: {
          background: 'rgba(255, 171, 0, 0.16)',
          color: '#B76E00',
        },
        colorError: {
          background: 'rgba(255, 86, 48, 0.12)',
          color: '#B71D18',
        },
        colorInfo: {
          background: 'rgba(0, 184, 217, 0.12)',
          color: '#007A8C',
        },
        filled: {
          background: '#F4F6F8',
          color: '#637381',
        },
        outlined: {
          borderColor: 'rgba(145, 158, 171, 0.24)',
        },
      },
    },

    // ---- PROGRESS ----
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 10,
          borderRadius: 40,
          background: 'rgba(105, 108, 255, 0.24)',
        },
        bar: {
          borderRadius: 40,
          background: '#696CFF',
        },
      },
    },

    // ---- AVATAR ----
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: 36,
          height: 36,
          fontSize: 14,
          fontWeight: 600,
        },
      },
    },

    // ---- DIVIDER ----
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(145, 158, 171, 0.12)',
        },
      },
    },

    // ---- LIST / SIDEBAR ----
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          height: 44,
          borderRadius: 8,
          padding: '4px 8px 4px 12px',
          fontSize: 15,
          fontWeight: 400,
          color: '#919EAB',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#FFFFFF',
          },
          '&.Mui-selected': {
            background: 'rgba(105, 108, 255, 0.12)',
            color: '#1C252E',
            '&:hover': {
              background: 'rgba(105, 108, 255, 0.16)',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: 'inherit',
          '& svg': {
            width: 20,
            height: 20,
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          margin: 0,
        },
        primary: {
          fontSize: 15,
          fontWeight: 400,
          color: '#919EAB',
        },
      },
    },

    // ---- BREADCRUMBS ----
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: 14,
          color: '#637381',
          marginBottom: 24,
        },
        separator: {
          color: '#919EAB',
        },
      },
    },

    // ---- TOOLTIP ----
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: 12,
          padding: '4px 10px',
        },
      },
    },

    // ---- DIALOG ----
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: '1px solid rgba(145, 158, 171, 0.12)',
          boxShadow: 'none',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 18,
          fontWeight: 600,
          padding: '20px 24px 0',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '0 24px 20px',
        },
      },
    },

    // ---- APP BAR / HEADER ----
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(145, 158, 171, 0.12)',
          background: '#FFFFFF',
          color: '#1C252E',
        },
      },
    },

    // ---- DRAWER ----
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          background: '#1C252E',
          color: '#919EAB',
          width: 280,
        },
      },
    },

    // ---- BADGE ----
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: 12,
          fontWeight: 500,
          height: 20,
          minWidth: 20,
          padding: '0 6px',
          borderRadius: 10,
        },
      },
    },

    // ---- SWITCH ----
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 44,
          height: 24,
          padding: 0,
        },
        switchBase: {
          padding: 0,
          margin: 2,
          '&.Mui-checked': {
            transform: 'translateX(20px)',
          },
        },
        thumb: {
          width: 20,
          height: 20,
          boxShadow: 'none',
        },
        track: {
          borderRadius: 12,
          opacity: 0.38,
        },
      },
    },

    // ---- AUTOCOMPLETE ----
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            padding: '0 8px',
          },
        },
        paper: {
          border: '1px solid rgba(145, 158, 171, 0.12)',
          boxShadow: 'none',
          marginTop: 4,
        },
        option: {
          fontSize: 14,
          minHeight: 40,
        },
      },
    },
  },
};

const centerupTheme = createTheme(themeOptions);

export default centerupTheme;
