import Box from "@mui/material/Box";
import { useState, type ReactNode } from "react";

import { OfflineShellStatus } from "@/components/erg-mui/offline";
import { ERG_ASSETS } from "@/config/seo";
import { StudentDashboardBottomDock } from "@/features/elearning/student-dashboard/components/student-dashboard-bottom-dock";
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
  dockItems,
  studentName,
  onPageChange,
}: {
  activePage: StudentPageKey;
  announcementUnreadCount?: number;
  children: ReactNode;
  dockItems: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode }>;
  studentName: string;
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
        bgcolor: "background.default",
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

      {/* No top bar (design canvas): notifications and profile live in the floating dock. */}
      <Box aria-hidden sx={{ flexShrink: 0, height: "env(safe-area-inset-top, 0px)" }} />

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
          // Room for the floating dock (60px + 16px offset + breathing space).
          pb: "calc(112px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <Box sx={{ maxWidth: 448, mx: "auto" }}>
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