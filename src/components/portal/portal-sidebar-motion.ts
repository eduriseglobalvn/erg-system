import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export const EXPANDED_SIDEBAR_WIDTH = ergEnterpriseTokens.size.sidebar;
export const COLLAPSED_SIDEBAR_WIDTH = 80;
// Floating card margin on every side; the layout column is card width + 2 gutters.
export const SIDEBAR_GUTTER = 12;
export const PORTAL_SIDEBAR_MOTION_MS = ergEnterpriseTokens.motion.duration.base;
export const PORTAL_SIDEBAR_MOTION_EASING = ergEnterpriseTokens.motion.easing.emphasized;
export const PORTAL_SIDEBAR_TRANSITION =
  `${PORTAL_SIDEBAR_MOTION_MS}ms ${PORTAL_SIDEBAR_MOTION_EASING}`;
