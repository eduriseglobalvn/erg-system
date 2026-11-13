import type { ReactNode } from "react";
import ChatBubbleIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import FavoriteIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorderRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color, statusTint } = ergEnterpriseTokens;

export const threadIconSx = { fontSize: ergEnterpriseTokens.size.iconSm };

/** Subject pill (Toán, Ngữ văn...) in the info tint. */
export function SubjectTag({ label }: { label: string }) {
  return (
    <Typography component="span" sx={{ bgcolor: statusTint.info.bg, borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: statusTint.info.color, px: 1, py: 0.25, typography: "caption", fontWeight: "fontWeightBold", whiteSpace: "nowrap" }}>
      {label}
    </Typography>
  );
}

export function ThreadAvatar({ initials, size = 36, tone = "neutral" }: { initials: string; size?: number; tone?: "neutral" | "me" | "teacher" }) {
  const palette = tone === "me" ? { bg: color.primary, fg: color.surface } : tone === "teacher" ? { bg: statusTint.success.bg, fg: statusTint.success.color } : { bg: statusTint.neutral.bg, fg: statusTint.neutral.color };
  return <Avatar sx={{ bgcolor: palette.bg, color: palette.fg, height: size, typography: "caption", fontWeight: "fontWeightBold", width: size }}>{initials}</Avatar>;
}

function Stat({ children, icon, tone }: { children: ReactNode; icon: ReactNode; tone?: string }) {
  return (
    <Box component="span" sx={{ alignItems: "center", color: tone ?? color.textMuted, display: "inline-flex", gap: 0.5, typography: "caption", fontWeight: "fontWeightMedium" }}>
      {icon}
      {children}
    </Box>
  );
}

/** Row stats under a thread title: replies, hearts, and the solved marker. */
export function ThreadStats({ hearts, replies, solved }: { hearts: number; replies: number; solved: boolean }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1.75 }}>
      <Stat icon={<ChatBubbleIcon sx={threadIconSx} />}>{replies}</Stat>
      <Stat icon={<FavoriteBorderIcon sx={threadIconSx} />}>{hearts}</Stat>
      {solved ? <Stat icon={<CheckCircleIcon sx={threadIconSx} />} tone={color.success}>
        <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>Đã có lời giải</Box>
        <Box component="span" sx={{ display: { md: "none" } }}>Có lời giải</Box>
      </Stat> : null}
    </Box>
  );
}

/** Heart button: filled and red once the viewer reacted. Tapping sets or clears the viewer reaction. */
export function HeartButton({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
  return (
    <ButtonBase aria-label={label} aria-pressed={active} onClick={onClick} sx={{ borderRadius: `${ergEnterpriseTokens.radius.control}px` }}>
      <Stat icon={active ? <FavoriteIcon sx={threadIconSx} /> : <FavoriteBorderIcon sx={threadIconSx} />} tone={active ? color.danger : undefined}>{count}</Stat>
    </ButtonBase>
  );
}
