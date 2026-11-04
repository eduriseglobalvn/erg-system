import Box from "@mui/material/Box";
import { useState, type ReactNode } from "react";

import { OfflineShellStatus } from "@/components/erg-mui/offline";
import { ERG_ASSETS } from "@/config/seo";
import { StudentDashboardBottomDock } from "@/features/elearning/student-dashboard/components/student-dashboard-bottom-dock";
import { StudentDashboardMobileAppBar } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-app-bar";
import type { StudentDockPageKey, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import { LmsPwaSetupSheet } from "@/features/lms/mobile/components/lms-pwa-setup-sheet";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { usePwaNotifications } from "@/features/lms/mobile/hooks/use-pwa-notifications";
import { useServiceWorkerUpdate } from "@/hooks/use-service-worker-update";
import { useOfflineShellStatus } from "@/hooks/use-offline-shell-status";

import { StudentInstallBanner, StudentUpdateBanner } from "@/features/elearning/student-dashboard/components/student-dashboard-pwa-banners";
import { useStudentInstallBanner } from "@/features/elearning/student-dashboard/components/use-student-install-banner";
export function StudentDashboardMobileShell({
  activePage,
  announcementUnreadCount = 0,
  children,
  className,
  dockItems,
  notificationLabel,
  studentName,
  onAccountOpen,
  onAnnouncementsOpen,
  onPageChange,
}: {
  activePage: StudentPageKey;
  announcementUnreadCount?: number;
  children: ReactNode;
  className: string;
  notificationLabel: string;
  dockItems: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode }>;
  studentName: string;
  onAccountOpen: () => void;
  onAnnouncementsOpen: () => void;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  const installPrompt = useInstallPrompt();
  const notifications = usePwaNotifications("elearning");
  const serviceWorkerUpdate = useServiceWorkerUpdate();
  const network = useOfflineShellStatus();
  const [pwaOpen, setPwaOpen] = useState(false);
  const { bannerMeta, handleDismiss, handleInstallClick, shouldOfferInstall } = useStudentInstallBanner(installPrompt, () => setPwaOpen(true));

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

      <StudentDashboardMobileAppBar
        className={className}
        notificationLabel={notificationLabel}
        studentName={studentName}
        unreadCount={announcementUnreadCount}
        onAccountOpen={onAccountOpen}
        onNotificationsOpen={onAnnouncementsOpen}
      />

      {serviceWorkerUpdate.updateAvailable ? <StudentUpdateBanner onApply={serviceWorkerUpdate.applyUpdate} /> : null}

      {shouldOfferInstall ? <StudentInstallBanner meta={bannerMeta} onDismiss={handleDismiss} onInstall={handleInstallClick} /> : null}

      <OfflineShellStatus network={network} />

      <Box
        component="main"
        data-testid="student-mobile-scroll-region"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          pb: "calc(72px + env(safe-area-inset-bottom, 0px))",
          pt: shouldOfferInstall ? 0.75 : 1.5,
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