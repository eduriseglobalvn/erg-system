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
  // "Thi đua" podium (design H03): gold / silver / bronze for ranks 1-3.
  medal: { gold: "#C98A04", silver: "#8A94A6", bronze: "#B4632B" },
  // Podium arena (design H08 / H03b): spinning rays, confetti, and lid + face + ink per place (1, 2, 3).
  podium: {
    arena: "linear-gradient(180deg,#F7FAFF 0,#fff 55%)",
    rays: "repeating-conic-gradient(from 0deg,rgba(201,138,4,.10) 0 6deg,rgba(201,138,4,0) 6deg 18deg)",
    raysMask: "radial-gradient(circle,#000 0,transparent 60%)",
    confetti: { blue: "#0071E3", gold: "#C98A04", fire: "#EA580C", green: "#16A34A" },
    ranks: [
      { lid: "linear-gradient(#FFF8E1,#FBE7A8)", face: "linear-gradient(#F9E3A0,#EFC85E)", ink: "#7A5A00" },
      { lid: "linear-gradient(#F7F8FA,#E6E9EE)", face: "linear-gradient(#E3E7ED,#CDD3DC)", ink: "#5B6474" },
      { lid: "linear-gradient(#FDF1E8,#F4D9C5)", face: "linear-gradient(#F3D6C1,#E5B593)", ink: "#7C3A12" },
    ],
    fire: "#EA580C",
  },
  // Type roles without a theme variant: tier name on "Bậc của bạn" (34/700), big rank number in the position ring (30/700).
  type: {
    display: { fontSize: 34, fontWeight: 700, lineHeight: 1.1 },
    ringRank: { fontSize: 30, fontWeight: 700, lineHeight: 1 },
    pageTitle: { fontSize: 28, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.01em" },
    pageLead: { fontSize: 15, fontWeight: 400, lineHeight: 1.45 },
    small: { fontSize: 13, fontWeight: 400, lineHeight: 1.45 },
    stat: { fontSize: 26, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" },
    label: { fontSize: 12, fontWeight: 600, lineHeight: 1.45 },
  },
  // Tier name colour (hero title, current ladder step) and hero tint (gradient start + corner glow).
  tierTitle: { go: "#6E4520", sat: "#4A515B", dong: "#8A431A", bac: "#5E6778", vang: "#7A5A00", bk: "#227A72", kc: "#3B52C8", ct: "#7A1FA2" },
  // Solid line colour per tier: hero segments and the ladder connector up to the current step.
  tierLine: { go: "#8B5A2B", sat: "#5B636E", dong: "#B4632B", bac: "#8A94A6", vang: "#C98A04", bk: "#2E8F86", kc: "#3B6CF0", ct: "#B0266B" },
  tierTint: {
    go: { from: "#F7EFE7", glow: "rgba(176,122,69,.25)" },
    sat: { from: "#F0F2F4", glow: "rgba(163,171,181,.3)" },
    dong: { from: "#FBF1E9", glow: "rgba(227,160,107,.25)" },
    bac: { from: "#F3F5F8", glow: "rgba(174,182,195,.3)" },
    vang: { from: "#FFF8E1", glow: "rgba(242,201,76,.28)" },
    bk: { from: "#E9F8F5", glow: "rgba(127,217,205,.28)" },
    kc: { from: "#EDF2FF", glow: "rgba(59,108,240,.2)" },
    ct: { from: "#FBEFFD", glow: "rgba(176,38,107,.2)" },
  },
  // Student tiers (design H15-H18): frame ring, shield emblem and chip fill per tier.
  tier: {
    go: { frame: "repeating-linear-gradient(115deg,#8B5A2B 0 4px,#A9743F 4px 7px,#6E4520 7px 9px)", emblem: "linear-gradient(#B07A45,#6E4520)", chip: "#8B5A2B", ink: "#FFFFFF", glow: "none" },
    sat: { frame: "conic-gradient(from 200deg,#5B636E,#A3ABB5,#4A515B,#8E96A0,#5B636E)", emblem: "linear-gradient(#A3ABB5,#4A515B)", chip: "#5B636E", ink: "#FFFFFF", glow: "none" },
    dong: { frame: "conic-gradient(from 200deg,#9A4E1F,#E3A06B,#8A431A,#D08850,#9A4E1F)", emblem: "linear-gradient(#E3A06B,#8A431A)", chip: "#B4632B", ink: "#FFFFFF", glow: "none" },
    bac: { frame: "conic-gradient(from 200deg,#8A94A6,#F4F6F9,#7C8698,#DCE1E8,#8A94A6)", emblem: "linear-gradient(#F4F6F9,#7C8698)", chip: "linear-gradient(90deg,#DCE1E8,#AEB6C3)", ink: "#3D4553", glow: "none" },
    vang: { frame: "conic-gradient(from 200deg,#B07A00,#FFE08A,#A86F00,#F2C94C,#B07A00)", emblem: "linear-gradient(#FFE08A,#A86F00)", chip: "#C98A04", ink: "#FFFFFF", glow: "0 0 0 2px #FFF3CC" },
    bk: { frame: "conic-gradient(from 200deg,#2E8F86,#B9F3EA,#227A72,#7FD9CD,#2E8F86)", emblem: "linear-gradient(#B9F3EA,#227A72)", chip: "#2E8F86", ink: "#FFFFFF", glow: "0 0 0 2px #DDF7F3" },
    kc: { frame: "conic-gradient(from 200deg,#2D5BD8,#A8C8FF,#6C3FD1,#7FB2FF,#3B6CF0,#C9B6FF,#2D5BD8)", emblem: "linear-gradient(#A8C8FF,#3B6CF0 55%,#6C3FD1)", chip: "linear-gradient(90deg,#2D5BD8,#6C3FD1)", ink: "#FFFFFF", glow: "0 0 0 2px #E3ECFF,0 0 14px rgba(59,108,240,.35)" },
    ct: { frame: "conic-gradient(from 200deg,#7A1FA2,#F2C94C,#B0266B,#FFE08A,#7A1FA2)", emblem: "linear-gradient(#FFE08A,#B0266B 45%,#7A1FA2)", chip: "linear-gradient(90deg,#7A1FA2,#B0266B)", ink: "#FFFFFF", glow: "0 0 0 2px #FBE7FF,0 0 16px rgba(176,38,107,.35)" },
  },
  // Tinted status badges: soft background + dark text of the same hue (plan 7.1).
  statusTint: {
    success: { bg: "#DCFAE5", color: "#04250E", dot: "#16A34A" },
    warning: { bg: "#FFFBEB", color: "#92400E", dot: "#D97706" },
    error: { bg: "#FFEDEA", color: "#831C1E", dot: "#D92D20" },
    info: { bg: "#EBF4FE", color: "#004A94", dot: "#0071E3" },
    neutral: { bg: "#F1F3F5", color: "#4B5563", dot: "#9CA3AF" },
  },
  // Streak / flame accents (design H08-H18): streak chip, sidebar reminder card.
  fireTint: { chip: "#FFEDD5", card: "#FFF7ED", border: "#FED7AA", ink: "#9A3412", icon: "#EA580C" },
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
