import { useState, type ReactNode } from "react";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LmsBottomDock, type LmsMobileDockItem } from "./lms-bottom-dock";
import { LmsMobileTopBar } from "./lms-mobile-top-bar";
import { LmsPwaSetupSheet } from "./lms-pwa-setup-sheet";
import { LmsScopeSheet, type LmsMobileClassOption, type LmsMobileSchoolOption } from "./lms-scope-sheet";
import { MobileBottomSheet } from "./mobile-bottom-sheet";
import { useInstallPrompt } from "../hooks/use-install-prompt";
import { useOnlineStatus } from "../hooks/use-online-status";
import { usePwaNotifications } from "../hooks/use-pwa-notifications";
import { useServiceWorkerUpdate } from "../hooks/use-service-worker-update";

export function LmsMobileShell<TSection extends string>({
  activeLabel, activeSection, children, classes, dockItems, notificationCenter, schoolName, schools,
  selectedClassId, selectedClassName, selectedSchoolId, teacherEmail, teacherName, unreadNotificationCount,
  onClassChange, onOpenNotifications, onNavigate, onSchoolChange, onSignOut,
}: {
  activeLabel: string; activeSection: TSection; children: ReactNode; classes: LmsMobileClassOption[];
  dockItems: Array<LmsMobileDockItem<TSection>>; notificationCenter?: ReactNode; schoolName: string;
  schools: LmsMobileSchoolOption[]; selectedClassId: string; selectedClassName: string; selectedSchoolId: string;
  teacherEmail: string; teacherName: string; unreadNotificationCount?: number;
  onClassChange: (classId: string) => void; onOpenNotifications?: () => void; onNavigate: (path: string) => void;
  onSchoolChange: (schoolId: string) => void; onSignOut: () => void;
}) {
  const online = useOnlineStatus();
  const installPrompt = useInstallPrompt();
  const notifications = usePwaNotifications();
  const serviceWorkerUpdate = useServiceWorkerUpdate();
  const [pwaOpen, setPwaOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const shouldOfferInstall = !installPrompt.installed && (installPrompt.canInstall || installPrompt.isIos);

  function navigate(path: string) {
    setAccountOpen(false);
    onNavigate(path);
  }

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", display: { xs: "flex", xl: "none" }, flex: 1, flexDirection: "column", minHeight: "100dvh", minWidth: 0, overflow: "hidden" }}>
      <LmsMobileTopBar
        activeLabel={activeLabel} canInstall={installPrompt.canInstall} selectedClassName={selectedClassName}
        installed={installPrompt.installed} notificationCenter={notificationCenter} online={online}
        schoolName={schoolName} teacherName={teacherName} unreadNotificationCount={unreadNotificationCount}
        updateAvailable={serviceWorkerUpdate.updateAvailable} onAccountOpen={() => setAccountOpen(true)}
        onInstall={() => setPwaOpen(true)} onOpenNotifications={onOpenNotifications}
        onScopeOpen={() => setScopeOpen(true)} onUpdate={serviceWorkerUpdate.applyUpdate}
      />

      {shouldOfferInstall ? (
        <Box sx={{ bgcolor: "info.light", px: 1.5, py: 1 }}>
          <ButtonBase onClick={() => setPwaOpen(true)} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, display: "flex", gap: 1.5, minHeight: 56, px: 1.5, py: 1, textAlign: "left", width: "100%" }}>
            <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: 1.5, color: "primary.contrastText", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}><PhoneAndroidRoundedIcon /></Box>
            <Box sx={{ flex: 1, minWidth: 0 }}><Typography noWrap sx={{ fontSize: 14, fontWeight: 800 }}>Thêm LMS vào màn hình chính</Typography><Typography color="text.secondary" noWrap sx={{ fontSize: 12, fontWeight: 600 }}>Mở nhanh như ứng dụng với biểu tượng riêng.</Typography></Box>
            <DownloadRoundedIcon color="primary" />
          </ButtonBase>
        </Box>
      ) : null}

      {!online ? <Alert severity="warning" sx={{ borderRadius: 0, fontSize: 12, fontWeight: 700, py: 0 }}>Đang offline. Giao bài, lịch làm việc và thông báo cần kết nối mạng để cập nhật an toàn.</Alert> : null}

      <Box component="main" sx={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", pb: "calc(104px + env(safe-area-inset-bottom, 0px))" }}>{children}</Box>
      <LmsBottomDock activeSection={activeSection} items={dockItems} onNavigate={navigate} />
      <LmsScopeSheet classes={classes} onClassChange={onClassChange} onOpenChange={setScopeOpen} onSchoolChange={onSchoolChange} open={scopeOpen} schools={schools} selectedClassId={selectedClassId} selectedSchoolId={selectedSchoolId} />

      <MobileBottomSheet description={teacherEmail} onOpenChange={setAccountOpen} open={accountOpen} title={teacherName}>
        <Stack spacing={1}>
          <AccountActionButton icon={<PersonOutlineRoundedIcon />} label="Quản lý tài khoản" onClick={() => navigate("/account")} />
          <AccountActionButton icon={<SecurityRoundedIcon />} label="Lịch sử đăng nhập" onClick={() => navigate("/account/login-logs")} />
          {onOpenNotifications ? <AccountActionButton icon={<NotificationsNoneRoundedIcon />} label="Mở thông báo" onClick={() => { setAccountOpen(false); onOpenNotifications(); }} /> : null}
          <AccountActionButton danger icon={<LogoutRoundedIcon />} label="Đăng xuất" onClick={onSignOut} />
        </Stack>
      </MobileBottomSheet>

      <LmsPwaSetupSheet installPrompt={installPrompt} notifications={notifications} onOpenChange={setPwaOpen} open={pwaOpen} />
    </Box>
  );
}

function AccountActionButton({ danger = false, icon, label, onClick }: { danger?: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <ButtonBase onClick={onClick} sx={{ border: "1px solid", borderColor: danger ? "error.light" : "divider", borderRadius: 1.5, color: danger ? "error.main" : "text.primary", display: "flex", gap: 1.5, justifyContent: "flex-start", minHeight: 48, px: 1.5, textAlign: "left", width: "100%", "&:hover": { bgcolor: danger ? "error.light" : "action.hover" }, "& .MuiSvgIcon-root": { flexShrink: 0, fontSize: 20 } }}>
      {icon}<Typography sx={{ fontSize: 14, fontWeight: 800 }}>{label}</Typography>
    </ButtonBase>
  );
}
