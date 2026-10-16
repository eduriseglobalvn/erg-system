import type { ReactNode } from "react";
import MuiStack from "@mui/material/Stack";

import type { StudentDiscussionReactionKey } from "@/features/elearning/student-dashboard/types/discussion-feed-types";

export const MUI_PRIMARY = "#0F6CBD";
export const MUI_TEXT = "#172033";
export const MUI_MUTED = "#667085";
export const MUI_BORDER = "rgba(16, 24, 40, 0.1)";
export const MUI_DIVIDER = "rgba(16, 24, 40, 0.075)";
export const MUI_SURFACE = "#FFFFFF";
export const MUI_CARD_SHADOW = "0 1px 2px rgba(16,24,40,0.045), 0 18px 44px rgba(16,24,40,0.055)";

export const elevatedCardSx = {
  bgcolor: MUI_SURFACE,
  border: `1px solid ${MUI_BORDER}`,
  borderRadius: "14px",
  boxShadow: MUI_CARD_SHADOW,
};

export function Stack({ alignItems, justifyContent, sx, ...props }: {
  alignItems?: unknown;
  children?: ReactNode;
  direction?: unknown;
  justifyContent?: unknown;
  spacing?: unknown;
  sx?: unknown;
  [key: string]: unknown;
}) {
  const layoutSx = {
    ...(alignItems !== undefined ? { alignItems } : {}),
    ...(justifyContent !== undefined ? { justifyContent } : {}),
  };
  return <MuiStack {...(props as Record<string, unknown>)} sx={[Object.keys(layoutSx).length ? layoutSx : null, sx].filter(Boolean) as never} />;
}

export const reactionVisuals: Record<StudentDiscussionReactionKey, { color: string; icon: string; label: string }> = {
  angry: { color: "#E9710F", icon: "😡", label: "Phẫn nộ" },
  care: { color: "#F7B125", icon: "🤗", label: "Cố lên" },
  haha: { color: "#F7B125", icon: "😆", label: "Haha" },
  like: { color: "#1877F2", icon: "👍", label: "Thích" },
  love: { color: "#F3425F", icon: "❤️", label: "Yêu thích" },
  sad: { color: "#F7B125", icon: "😢", label: "Buồn" },
  wow: { color: "#F7B125", icon: "😮", label: "Wow" },
};

export const reactionKeys = Object.keys(reactionVisuals) as StudentDiscussionReactionKey[];

export const commentFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#F0F2F5",
    borderRadius: "18px",
    fontSize: 13,
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "transparent" },
    "&.Mui-focused": { bgcolor: "#fff", boxShadow: "0 0 0 4px rgba(15,108,189,0.08)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(15,108,189,0.34)" },
  },
};

