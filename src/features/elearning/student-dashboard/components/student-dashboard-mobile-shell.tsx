import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import LaptopChromebookRoundedIcon from "@mui/icons-material/LaptopChromebookRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useMemo, useState, type ReactNode } from "react";

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
  announcementUnreadCount = 0,
  children,
  currentPageLabel: _currentPageLabel,
  dockItems,
  studentName,
  onAccountOpen: _onAccountOpen,
  onAnnouncementsOpen: _onAnnouncementsOpen,
  onPageChange,
}: {
  activePage: StudentPageKey;
  announcementUnreadCount?: number;
  children: ReactNode;
  currentPageLabel?: string;
  dockItems: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode }>;
  studentName: string;
  onAccountOpen?: () => void;
  onAnnouncementsOpen?: () => void;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  const installPrompt = useInstallPrompt();
  const notifications = usePwaNotifications("elearning");
  const serviceWorkerUpdate = useServiceWorkerUpdate();
  const network = useOfflineShellStatus();
  const [pwaOpen, setPwaOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage?.getItem("erg_pwa_banner_dismissed") === "true";
    } catch {
      return false;
    }
  });

  const isInstalled = installPrompt.installed;
  const isIos = installPrompt.isIos;
  const isAndroid = installPrompt.platform === "android";
  const canDirectInstall = installPrompt.canInstall;

  // Never offer install if already installed or dismissed by user in this session
  const shouldOfferInstall =
    !isInstalled && !dismissed && (canDirectInstall || isIos || isAndroid);

  const bannerMeta = useMemo(() => {
    if (isIos) {
      return {
        icon: <IosShareRoundedIcon sx={{ color: "#2563EB", fontSize: 18 }} />,
        subtitle: 'Mở Safari, nhấn nút Chia sẻ và chọn "Thêm vào MH chính"',
        title: "Thêm ERG Learning vào Màn hình chính",
      };
    }
    if (isAndroid) {
      return {
        icon: <PhoneAndroidRoundedIcon sx={{ color: "#2563EB", fontSize: 18 }} />,
        subtitle: "Cài ứng dụng nhanh trực tiếp từ trình duyệt Android",
        title: "Cài đặt ERG Learning cho Android",
      };
    }
    return {
      icon: <LaptopChromebookRoundedIcon sx={{ color: "#2563EB", fontSize: 18 }} />,
      subtitle: "Mở nhanh Student Workspace từ màn hình thiết bị",
      title: "Cài đặt ứng dụng ERG Learning",
    };
  }, [isIos, isAndroid]);

  const handleInstallClick = async () => {
    if (canDirectInstall) {
      const outcome = await installPrompt.promptInstall();
      if (outcome === "accepted") return;
    }
    setPwaOpen(true);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try {
      window.sessionStorage?.setItem("erg_pwa_banner_dismissed", "true");
    } catch {}
  };

  return (
    <Box
      sx={{
        background: "linear-gradient(180deg, #DCE6FF 0%, #EEF2FF 18%, #F8FAFC 45%, #E8F5F8 100%)",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxHeight: "100dvh",
        minHeight: "100dvh",
        minWidth: 0,
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      {/* Brand logo reference for PWA shell branding & policy */}
      <Box alt="ERG" component="img" src={ERG_ASSETS.logo} sx={{ display: "none" }} />

      {/* Floating service worker update banner */}
      {serviceWorkerUpdate.updateAvailable ? (
        <Box sx={{ flexShrink: 0, px: 2, pt: "calc(env(safe-area-inset-top, 0px) + 8px)", zIndex: 1100 }}>
          <ButtonBase
            onClick={serviceWorkerUpdate.applyUpdate}
            sx={{
              alignItems: "center",
              bgcolor: "rgba(37, 99, 235, 0.95)",
              borderRadius: "999px",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
              color: "#FFFFFF",
              display: "flex",
              gap: 1,
              mx: "auto",
              px: 2,
              py: 0.75,
            }}
          >
            <RefreshRoundedIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 750 }}>Bản cập nhật mới có sẵn · Chạm để làm mới</Typography>
          </ButtonBase>
        </Box>
      ) : null}

      {/* Device-aware PWA install prompt banner */}
      {shouldOfferInstall ? (
        <Box sx={{ flexShrink: 0, px: 1.75, pt: "calc(env(safe-area-inset-top, 0px) + 8px)", pb: 0.5, zIndex: 1050 }}>
          <Box
            sx={{
              alignItems: "center",
              backdropFilter: "blur(12px)",
              bgcolor: "rgba(255, 255, 255, 0.94)",
              border: "1px solid rgba(226, 232, 240, 0.85)",
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
              display: "flex",
              gap: 1,
              minHeight: 48,
              pl: 1.25,
              pr: 0.75,
              py: 0.75,
              width: "100%",
            }}
          >
            <ButtonBase
              onClick={handleInstallClick}
              sx={{
                alignItems: "center",
                display: "flex",
                flex: 1,
                gap: 1.25,
                minWidth: 0,
                textAlign: "left",
              }}
            >
              <Box
                alt="ERG"
                component="img"
                src={ERG_ASSETS.logo}
                sx={{ bgcolor: "#FFFFFF", borderRadius: "8px", height: 28, objectFit: "contain", width: 28 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ color: "#0F172A", fontSize: 12.5, fontWeight: 750 }}>
                  {bannerMeta.title}
                </Typography>
                <Typography noWrap sx={{ color: "#64748B", fontSize: 10.5, fontWeight: 550 }}>
                  {bannerMeta.subtitle}
                </Typography>
              </Box>
              <Box sx={{ alignItems: "center", display: "flex", px: 0.5 }}>
                {bannerMeta.icon}
              </Box>
            </ButtonBase>

            <IconButton
              aria-label="Đóng gợi ý cài đặt"
              onClick={handleDismiss}
              size="small"
              sx={{
                color: "#94A3B8",
                flexShrink: 0,
                height: 28,
                p: 0.5,
                width: 28,
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.05)", color: "#0F172A" },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      ) : null}

      <OfflineShellStatus network={network} />

      <Box
        component="main"
        data-testid="student-mobile-scroll-region"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          pb: "calc(64px + env(safe-area-inset-bottom, 0px))",
          pt: shouldOfferInstall ? 0.75 : "calc(env(safe-area-inset-top, 0px) + 12px)",
        }}
      >
        <Box sx={{ maxWidth: 448, mx: "auto", px: { xs: 1.75, sm: 2.25 }, py: 1.5 }}>
          {children}
        </Box>
      </Box>

      <StudentDashboardBottomDock
        activePage={activePage}
        announcementUnreadCount={announcementUnreadCount}
        items={dockItems}
        studentName={studentName}
        onPageChange={onPageChange}
      />

      <LmsPwaSetupSheet
        installPrompt={installPrompt}
        notifications={notifications}
        onOpenChange={setPwaOpen}
        open={pwaOpen}
        workspace="STUDENT"
      />
    </Box>
  );
}
