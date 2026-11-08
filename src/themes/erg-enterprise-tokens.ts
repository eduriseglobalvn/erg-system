export const ergEnterpriseTokens = {
  color: {
    // "Xanh Apple" palette chosen from the design canvas (11/2026); replaces the earlier ERG blue.
    primary: "#0071E3",
    primaryHover: "#0058B0",
    primarySoft: "#D2E6FC",
    primarySofter: "#EBF4FE",
    brandRed: "#D92D20",
    brandRedHover: "#B42318",
    brandRedSoft: "rgba(217, 45, 32, 0.09)",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    // Page ground / raised fills / hairlines / ink from the same canvas palette.
    surfaceSubtle: "#F5F5F7",
    surfaceMuted: "#FAFAFC",
    border: "#E3E3E8",
    borderStrong: "#D0D0D6",
    divider: "#EDEDF0",
    text: "#1D1D1F",
    textSecondary: "#424245",
    textMuted: "#6E6E73",
    textSoft: "#86868B",
    navText: "#3A3A3C",
    success: "#16A34A",
    successSoft: "rgba(22, 163, 74, 0.11)",
    warning: "#D97706",
    warningSoft: "rgba(217, 119, 6, 0.12)",
    danger: "#D92D20",
    dangerSoft: "rgba(217, 45, 32, 0.1)",
    info: "#0284C7",
    infoSoft: "rgba(2, 132, 199, 0.1)",
  },
  // Tinted status badges: soft background + dark text of the same hue (plan 7.1).
  statusTint: {
    success: { bg: "#DCFAE5", color: "#04250E", dot: "#16A34A" },
    warning: { bg: "#FFFBEB", color: "#92400E", dot: "#D97706" },
    error: { bg: "#FFEDEA", color: "#831C1E", dot: "#D92D20" },
    info: { bg: "#EBF4FE", color: "#004A94", dot: "#0071E3" },
    neutral: { bg: "#F1F3F5", color: "#4B5563", dot: "#9CA3AF" },
  },
  font: {
    body: '"Be Vietnam Pro", "Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
  },
  // Role radii follow the floating sidebar (KE_HOACH_REFACTOR_UI.md 3.1); xs–xl stay for older code.
  radius: {
    xs: 6,
    sm: 8,
    md: 10,
    lg: 14,
    xl: 18,
    shell: 20,
    card: 14,
    control: 10,
    chip: 999,
  },
  shadow: {
    xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
    sm: "0 8px 24px rgba(15, 23, 42, 0.06)",
    md: "0 18px 48px rgba(15, 23, 42, 0.1)",
    // The only resting elevation: sidebar card, menus, popovers, phone dock, toasts.
    float: "0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 32px rgba(16, 24, 40, 0.08)",
    focus: "0 0 0 3px rgba(0, 113, 227, 0.16)",
  },
  motion: {
    duration: { instant: 100, fast: 160, base: 220, slow: 320 },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
      exit: "cubic-bezier(0.3, 0, 1, 1)",
    },
  },
  size: {
    controlSm: 34,
    controlMd: 40,
    controlLg: 46,
    header: 64,
    sidebar: 264,
    // Phone dock capsule (44px buttons + padding + border); see ergMobileDockClearance.
    mobileDock: 56,
    // Icon sizes: inline in text, menu rows, phone dock.
    iconSm: 16,
    iconMd: 20,
    iconLg: 22,
  },
} as const;

export type ErgEnterpriseTokens = typeof ergEnterpriseTokens;
