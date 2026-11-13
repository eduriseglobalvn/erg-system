import type { ReactNode } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgTierFrame } from "@/components/erg-mui/erg-tier";
import type { TierKey } from "@/domain/student-tier/tiers";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

export const cardSx = { bgcolor: t.color.surface, border: 1, borderColor: t.color.border, borderRadius: `${t.radius.card}px`, p: { xs: 2, md: 3 } } as const;

/** Round avatar with initials, inside the tier frame when there is one. `muted` greys it out (locked frame preview). */
export function TierAvatar({ name, tier, size, muted }: { name: string; tier: TierKey | null; size: number; muted?: boolean }) {
  return (
    <ErgTierFrame tier={tier} size={size}>
      <Avatar sx={{ bgcolor: muted ? t.color.borderStrong : "primary.main", color: "primary.contrastText", height: size, typography: size > 48 ? "h4" : "caption", width: size }}>
        {getInitials(name) || "?"}
      </Avatar>
    </ErgTierFrame>
  );
}

/** Thin progress bar; `tier` paints the fill with that tier's emblem gradient. */
export function TierProgress({ value, tier, height = 10 }: { value: number; tier: TierKey; height?: number }) {
  return (
    <Box aria-hidden sx={{ bgcolor: t.color.divider, borderRadius: `${t.radius.chip}px`, height, overflow: "hidden" }}>
      <Box sx={{ background: t.tier[tier].emblem, height: "100%", width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
    </Box>
  );
}

/** Title block of a tier screen; on phones a back arrow comes first, on web a text link above the title when `backLabel` is set. */
export function TierHeader({ title, subtitle, onBack, backLabel, actions }: { title: string; subtitle?: ReactNode; onBack?: () => void; backLabel?: string; actions?: ReactNode }) {
  return (
    <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1.5, justifyContent: "space-between" }}>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, minWidth: 0 }}>
        {onBack ? <ErgIconButton label="Quay lại" onClick={onBack} size="small" sx={{ display: { md: "none" } }}><ArrowBackRoundedIcon /></ErgIconButton> : null}
        <Box sx={{ minWidth: 0 }}>
          {onBack && backLabel ? <Button onClick={onBack} size="small" startIcon={<ArrowBackRoundedIcon />} sx={{ display: { xs: "none", md: "inline-flex" }, ml: -1, mb: 0.5 }} variant="text">{backLabel}</Button> : null}
          <Typography component="h1" variant="h1">{title}</Typography>
          {subtitle ? <Typography variant="body2" sx={{ color: "text.secondary" }}>{subtitle}</Typography> : null}
        </Box>
      </Box>
      {actions}
    </Box>
  );
}

export function TierLoading() {
  return (
    <Box aria-busy="true" sx={{ display: "grid", gap: 2 }}>
      <ErgSkeleton height={180} />
      <ErgSkeleton height={220} />
    </Box>
  );
}

export function TierError({ onRetry }: { onRetry?: () => void }) {
  return <ErgErrorState title="Không tải được dữ liệu bậc" description="Kiểm tra kết nối rồi thử lại." action={onRetry ? <ErgButton variant="outlined" onClick={onRetry}>Thử lại</ErgButton> : undefined} />;
}

export function TierIneligible({ message }: { message: string }) {
  return <ErgEmptyState title={message} description="Bậc được tính từ XP cả khóa, so với các bạn trong khối." />;
}
