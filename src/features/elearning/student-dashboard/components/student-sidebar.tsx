import type { ReactNode } from "react";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";

import { ErgTierChip, ErgTierFrame } from "@/components/erg-mui/erg-tier";
import { NAV_ACTIVE_BG, NAV_ICON_SIZE, navRowSx } from "@/components/portal/portal-sidebar-styles";
import { formatViNumber, tierLabel } from "@/domain/student-tier/tiers";
import type { StudentSidebarData } from "@/features/elearning/student-dashboard/hooks/use-student-sidebar-data";
import type { StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import { STUDENT_NAV_ICONS } from "@/features/elearning/student-dashboard/utils/student-nav-icons";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type Item = { key: StudentPageKey; label: string; badge?: string; badgeTone?: "info" | "error" };

function NavBadge({ active, tone, children }: { active: boolean; tone: "info" | "error"; children: string }) {
  const bg = active ? "rgba(255,255,255,.22)" : tone === "error" ? t.color.danger : t.statusTint.info.bg;
  const color = active || tone === "error" ? t.color.surface : t.statusTint.info.color;
  return (
    <Box component="span" sx={{ alignItems: "center", bgcolor: bg, borderRadius: `${t.radius.chip}px`, color, display: "inline-flex", height: 22, justifyContent: "center", minWidth: 22, ml: "auto", px: 0.875, typography: "caption", fontWeight: "fontWeightBold" }}>
      {children}
    </Box>
  );
}

function NavGroup({ activePage, items, label, onPageChange }: { activePage: StudentPageKey; items: Item[]; label: string; onPageChange: (page: StudentPageKey) => void }) {
  return (
    <Box component="nav" aria-label={label} sx={{ mt: 1.5 }}>
      <Typography color="text.secondary" component="p" sx={{ letterSpacing: "0.06em", px: 1.5, py: 0.75, textTransform: "uppercase" }} variant="caption">{label}</Typography>
      <Box component="ul" sx={{ display: "grid", gap: 0.25, listStyle: "none", m: 0, p: 0 }}>
        {items.map((item) => {
          const active = activePage === item.key;
          const icons = STUDENT_NAV_ICONS[item.key];
          const Icon = icons ? (active ? icons.activeIcon : icons.icon) : null;
          return (
            <Box component="li" key={item.key}>
              <ListItemButton aria-current={active ? "page" : undefined} disableRipple onClick={() => onPageChange(item.key)} sx={{ ...navRowSx(active, { height: t.size.controlMd }), gap: 1.5 }}>
                {Icon ? <Icon sx={{ fontSize: NAV_ICON_SIZE }} /> : null}
                <Typography color="inherit" component="span" variant="subtitle2">{item.label}</Typography>
                {item.badge ? <NavBadge active={active} tone={item.badgeTone ?? "info"}>{item.badge}</NavBadge> : null}
              </ListItemButton>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function StatChip({ tone, icon, children }: { tone: "info" | "warning"; icon: ReactNode; children: string }) {
  return (
    <Box component="span" sx={{ alignItems: "center", bgcolor: t.statusTint[tone].bg, borderRadius: `${t.radius.chip}px`, color: t.statusTint[tone].color, display: "inline-flex", gap: 0.5, height: 26, px: 1.25, typography: "caption", fontWeight: "fontWeightBold" }}>
      {icon}{children}
    </Box>
  );
}

/** Student sidebar body (spec 7.0): brand, tier profile card, grouped nav, streak reminder, account row. */
export function StudentSidebar({ activePage, data, initials, name, rankingEnabled, todoCount, unreadCount, onAccountOpen, onTierOpen, onPageChange, onSignOut, signedIn }: {
  activePage: StudentPageKey;
  data: StudentSidebarData;
  initials: string;
  name: string;
  rankingEnabled: boolean;
  todoCount: number;
  unreadCount: number;
  onAccountOpen: () => void;
  /** Opens the tier page (H15) from the profile card when the student has a tier. */
  onTierOpen?: () => void;
  onPageChange: (page: StudentPageKey) => void;
  onSignOut: () => void;
  signedIn: boolean;
}) {
  const study: Item[] = [
    { key: "overview", label: "Tổng quan" },
    { key: "assignments", label: "Bài tập", badge: todoCount > 0 ? String(todoCount) : undefined },
    { key: "scores", label: "Điểm số" },
  ];
  const classItems: Item[] = [
    ...(rankingEnabled ? [{ key: "ranking" as const, label: "Thi đua", badge: data.rank ? `#${data.rank}` : undefined }] : []),
    { key: "discussion", label: "Thảo luận" },
    { key: "announcements", label: "Hộp thư", badge: unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : undefined, badgeTone: "error" },
  ];
  return (
    <>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.25, px: 0.5, py: 0.5 }}>
        <Box sx={{ alignItems: "center", background: NAV_ACTIVE_BG, borderRadius: `${t.radius.control}px`, boxShadow: t.shadow.float, color: t.color.surface, display: "flex", flexShrink: 0, height: 42, justifyContent: "center", width: 42 }}><SchoolRoundedIcon fontSize="medium" /></Box>
        <Box>
          <Typography component="p" variant="h6">ERG Học tập</Typography>
          <Typography color="text.secondary" component="p" variant="caption">Cổng học sinh</Typography>
        </Box>
      </Box>
      <ButtonBase aria-label="Mở hồ sơ" data-design="sidebar-profile" onClick={data.tier && onTierOpen ? onTierOpen : onAccountOpen} sx={{ alignItems: "stretch", bgcolor: t.color.surfaceMuted, border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, display: "grid", gap: 1, mt: 1.5, p: 1.5, textAlign: "left", width: "100%" }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1.25 }}>
          <ErgTierFrame size={36} tier={data.tier}>
            <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", typography: "caption", fontWeight: "fontWeightBold" }}>{initials}</Avatar>
          </ErgTierFrame>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap variant="subtitle2">{name}</Typography>
            <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
              {data.tier ? <ErgTierChip tier={data.tier}>{tierLabel(data.tier, data.division)}</ErgTierChip> : null}
              {data.className ? <Typography color="text.secondary" noWrap variant="caption">{data.className}</Typography> : null}
            </Box>
          </Box>
        </Box>
        {data.xp !== null || data.streakDays ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {data.xp !== null ? <StatChip icon={<BoltRoundedIcon sx={{ fontSize: t.size.iconMd }} />} tone="info">{`${formatViNumber(data.xp)} XP`}</StatChip> : null}
            {data.streakDays ? <StatChip icon={<LocalFireDepartmentRoundedIcon sx={{ fontSize: t.size.iconMd }} />} tone="warning">{`${data.streakDays} ngày`}</StatChip> : null}
          </Box>
        ) : null}
      </ButtonBase>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <NavGroup activePage={activePage} items={study} label="Học tập" onPageChange={onPageChange} />
        <NavGroup activePage={activePage} items={classItems} label="Lớp của tôi" onPageChange={onPageChange} />
      </Box>
      {data.streakNudge ? (
        <Box data-design="streak-nudge" sx={{ alignItems: "center", bgcolor: t.statusTint.warning.bg, border: 1, borderColor: t.color.warningSoft, borderRadius: `${t.radius.card}px`, color: t.statusTint.warning.color, display: "flex", gap: 1.25, mb: 1.5, p: 1.5 }}>
          <LocalFireDepartmentRoundedIcon sx={{ color: "warning.main" }} />
          <Typography variant="subtitle2">{`Làm 1 bài hôm nay để giữ chuỗi ${data.streakNudge} ngày`}</Typography>
        </Box>
      ) : null}
      <Divider />
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, pt: 1 }}>
        <ButtonBase onClick={onAccountOpen} sx={{ borderRadius: `${t.radius.control}px`, flex: 1, justifyContent: "flex-start", minWidth: 0, px: 1.5, py: 0.75 }}><Typography color="text.secondary" noWrap variant="body2">Tài khoản &amp; cài đặt</Typography></ButtonBase>
        {signedIn ? <IconButton aria-label="Đăng xuất" onClick={onSignOut} sx={{ flexShrink: 0, height: 36, width: 36 }}><LogoutRoundedIcon /></IconButton> : null}
      </Box>
    </>
  );
}
