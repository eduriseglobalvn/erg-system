import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

import { OfflineShellStatus } from "@/components/erg-mui/offline";
import { ERG_ASSETS } from "@/config/seo";
import { StudentDashboardBottomDock } from "@/features/elearning/student-dashboard/components/student-dashboard-bottom-dock";
import type { StudentDockPageKey, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import { LmsPwaSetupSheet } from "@/features/lms/mobile/components/lms-pwa-setup-sheet";
import { useInstallPrompt } from "@/features/lms/mobile/hooks/use-install-prompt";
import { usePwaNotifications } from "@/features/lms/mobile/hooks/use-pwa-notifications";
import { useServiceWorkerUpdate } from "@/features/lms/mobile/hooks/use-service-worker-update";
import { useOfflineShellStatus } from "@/hooks/use-offline-shell-status";

export function StudentDashboardMobileShell({
  activePage,
  announcementUnreadCount,
  children,
  currentPageLabel,
  dockItems,
  studentName,
  onAccountOpen,
  onAnnouncementsOpen,
  onPageChange,
}: {
  activePage: StudentPageKey;
  announcementUnreadCount: number;
  children: ReactNode;
  currentPageLabel: string;
  dockItems: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode }>;
  studentName: string;
  onAccountOpen: () => void;
  onAnnouncementsOpen: () => void;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  const initial = studentName.trim().slice(0, 1).toUpperCase();
  const installPrompt = useInstallPrompt();
  const notifications = usePwaNotifications("elearning");
  const serviceWorkerUpdate = useServiceWorkerUpdate();
  const network = useOfflineShellStatus();
  const [pwaOpen, setPwaOpen] = useState(false);
  const shouldOfferInstall = !installPrompt.installed && (installPrompt.canInstall || installPrompt.isIos);
  const iconButtonSx = { bgcolor: "background.paper", border: "1px solid", borderColor: "divider", flexShrink: 0, height: 40, width: 40 } as const;

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", display: "flex", flexDirection: "column", height: "100dvh", maxHeight: "100dvh", minHeight: "100dvh", minWidth: 0, overflow: "hidden", width: "100%" }}>
      <Box component="header" data-testid="student-mobile-header" sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", boxShadow: "0 8px 24px rgba(15,23,42,0.06)", flexShrink: 0, pb: 1.25, pt: "calc(env(safe-area-inset-top, 0px) + 8px)", px: 1.5, zIndex: (theme) => theme.zIndex.appBar }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minHeight: 48 }}>
          <IconButton aria-label="Về tổng quan" onClick={() => onPageChange("overview")} sx={iconButtonSx}>
            <Box alt="ERG" component="img" src={ERG_ASSETS.logo} sx={{ maxHeight: 24, maxWidth: 28, objectFit: "contain" }} />
          </IconButton>

          <ButtonBase onClick={() => onPageChange("overview")} sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 5, flex: 1, minHeight: 40, minWidth: 0, px: 1.5, py: 0.5, textAlign: "left" }}>
            <Box sx={{ minWidth: 0, width: "100%" }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.4 }}>{currentPageLabel}</Typography>
              <Typography color="text.secondary" noWrap sx={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.4 }}>Student Workspace</Typography>
            </Box>
          </ButtonBase>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexShrink: 0 }}>
            {serviceWorkerUpdate.updateAvailable ? (
              <IconButton aria-label="Cập nhật ứng dụng" onClick={serviceWorkerUpdate.applyUpdate} sx={iconButtonSx}>
                <RefreshRoundedIcon sx={{ fontSize: 19 }} />
              </IconButton>
            ) : null}
            {installPrompt.canInstall && !installPrompt.installed ? (
              <IconButton aria-label="Cài ERG Learning" onClick={() => setPwaOpen(true)} sx={iconButtonSx}>
                <DownloadRoundedIcon sx={{ fontSize: 19 }} />
              </IconButton>
            ) : null}
            {!network.online ? (
              <Box aria-label="Đang offline" sx={{ alignItems: "center", bgcolor: "warning.light", borderRadius: "50%", color: "warning.dark", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}>
                <WifiOffRoundedIcon sx={{ fontSize: 19 }} />
              </Box>
            ) : null}
            <IconButton aria-label="Thông báo" onClick={onAnnouncementsOpen} sx={iconButtonSx}>
              <Badge badgeContent={announcementUnreadCount > 9 ? "9+" : announcementUnreadCount} color="error">
                <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
              </Badge>
            </IconButton>
            <IconButton aria-label={studentName ? `Tài khoản ${studentName}` : "Tài khoản"} onClick={onAccountOpen} sx={{ flexShrink: 0, height: 40, p: 0.5, width: 40 }}>
              <Avatar sx={{ bgcolor: "primary.main", fontSize: 12, fontWeight: 800, height: 32, width: 32 }}>
                {initial || <AccountCircleOutlinedIcon sx={{ fontSize: 18 }} />}
              </Avatar>
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {shouldOfferInstall ? (
        <Box sx={{ bgcolor: "info.light", flexShrink: 0, px: 1.5, py: 1 }}>
          <ButtonBase onClick={() => setPwaOpen(true)} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, display: "flex", gap: 1.5, minHeight: 56, px: 1.5, py: 1, textAlign: "left", width: "100%" }}>
            <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: 1.5, color: "primary.contrastText", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}><DownloadRoundedIcon /></Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 800 }}>Thêm ERG Learning vào màn hình chính</Typography>
              <Typography color="text.secondary" noWrap sx={{ fontSize: 12, fontWeight: 600 }}>Mở Student Workspace nhanh như ứng dụng.</Typography>
            </Box>
            <DownloadRoundedIcon color="primary" />
          </ButtonBase>
        </Box>
      ) : null}

      <OfflineShellStatus network={network} />
      <Box component="main" data-testid="student-mobile-scroll-region" sx={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", pb: "calc(104px + env(safe-area-inset-bottom, 0px))" }}>
        <Box sx={{ maxWidth: 448, mx: "auto" }}>{children}</Box>
      </Box>

      <StudentDashboardBottomDock activePage={activePage} items={dockItems} onPageChange={onPageChange} />
      <LmsPwaSetupSheet installPrompt={installPrompt} notifications={notifications} onOpenChange={setPwaOpen} open={pwaOpen} workspace="STUDENT" />
    </Box>
  );
}
