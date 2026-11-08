import { useState, type ReactNode } from "react";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import InstallMobileRoundedIcon from "@mui/icons-material/InstallMobileRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { LmsMobileTopBar } from "./lms-mobile-top-bar";
import { LmsPwaSetupSheet } from "./lms-pwa-setup-sheet";
import { LmsScopeSheet, type LmsMobileClassOption, type LmsMobileSchoolOption } from "./lms-scope-sheet";
import { MobileBottomSheet } from "./mobile-bottom-sheet";
import { OfflineShellStatus } from "@/components/erg-mui/offline";
import { ErgSheetIdentity, ErgSheetOverline, ErgSheetSignOut, ErgSheetTileGroup, ErgWorkspaceSwitch, type ErgSheetTileItem } from "@/components/portal/erg-mobile-sheet-parts";
import { ERG_FULL_VIEWPORT_FALLBACK, ErgMobileDock, ergMobileDockClearance, type ErgMobileDockItem } from "@/components/portal/erg-mobile-dock";
import { useOfflineShellStatus } from "@/hooks/use-offline-shell-status";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { usePwaNotifications } from "../hooks/use-pwa-notifications";
import { useServiceWorkerUpdate } from "@/hooks/use-service-worker-update";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { getAuthScope } from "@/platform/auth/api/auth-storage";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { radius, size } = ergEnterpriseTokens;

export function LmsMobileShell<TSection extends string>({
  activeLabel, activeSection, children, classes, dockItems, moreItems = [], schoolName, schools,
  selectedClassId, selectedClassName, selectedSchoolId, teacherEmail, teacherName,
  onClassChange, onNavigate, onSchoolChange, onSignOut,
}: {
  activeLabel: string; activeSection: TSection | null; children: ReactNode; classes: LmsMobileClassOption[];
  dockItems: Array<ErgMobileDockItem<TSection>>;
  moreItems?: Array<ErgSheetTileItem & { group: string }>; schoolName: string;
  schools: LmsMobileSchoolOption[]; selectedClassId: string; selectedClassName: string; selectedSchoolId: string;
  teacherEmail: string; teacherName: string;
  onClassChange: (classId: string) => void; onNavigate: (path: string) => void;
  onSchoolChange: (schoolId: string) => void; onSignOut: () => void;
}) {
  const network = useOfflineShellStatus();
  const installPrompt = useInstallPrompt();
  const notifications = usePwaNotifications();
  const serviceWorkerUpdate = useServiceWorkerUpdate();
  const [pwaOpen, setPwaOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const studentCount = classes.find((classroom) => classroom.id === selectedClassId)?.studentCount;
  const shouldOfferInstall = !installPrompt.installed && (installPrompt.canInstall || installPrompt.isIos);

  const session = getAuthScope("lms").session ?? getAuthScope().session;
  const grantedWorkspaces = session?.workspaces ?? [];
  const canSwitchAdmin = grantedWorkspaces.includes("ADMIN");
  const canSwitchStudent = grantedWorkspaces.includes("STUDENT");

  function navigate(path: string) {
    setAccountOpen(false);
    onNavigate(path);
  }

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", display: { xs: "flex", xl: "none" }, flex: 1, flexDirection: "column", height: "100dvh", maxHeight: "100dvh", minHeight: "100dvh", ...ERG_FULL_VIEWPORT_FALLBACK, minWidth: 0, overflow: "hidden", width: "100%" }}>
      <LmsMobileTopBar
        activeLabel={activeLabel} canInstall={installPrompt.canInstall} selectedClassName={selectedClassName}
        installed={installPrompt.installed} online={network.online}
        schoolName={[schoolName, studentCount === undefined ? "" : `${studentCount} học sinh`].filter(Boolean).join(" · ")}
        updateAvailable={serviceWorkerUpdate.updateAvailable}
        onInstall={() => setPwaOpen(true)}
        onScopeOpen={() => setScopeOpen(true)} onUpdate={serviceWorkerUpdate.applyUpdate}
      />

      {shouldOfferInstall ? (
        <Box sx={{ bgcolor: "info.light", px: 1.5, py: 1 }}>
          <ButtonBase onClick={() => setPwaOpen(true)} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, display: "flex", gap: 1.5, minHeight: 56, px: 1.5, py: 1, textAlign: "left", width: "100%" }}>
            <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: 1.5, color: "primary.contrastText", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}><PhoneAndroidRoundedIcon /></Box>
            <Box sx={{ flex: 1, minWidth: 0 }}><Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>Thêm LMS vào màn hình chính</Typography><Typography color="text.secondary" noWrap sx={{ fontSize: 12, fontWeight: 600 }}>Mở nhanh như ứng dụng với biểu tượng riêng.</Typography></Box>
            <DownloadRoundedIcon color="primary" />
          </ButtonBase>
        </Box>
      ) : null}

      <OfflineShellStatus network={network} />

      <Box component="main" data-testid="lms-mobile-scroll-region" sx={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", pb: ergMobileDockClearance() }}>{children}</Box>
      <ErgMobileDock
        activeId={activeSection}
        ariaLabel="Điều hướng giáo viên"
        hideAt="xl"
        items={dockItems.map((item) => (item.opensSheet ? { ...item, avatarInitials: nameInitials(teacherName) } : item))}
        onNavigate={navigate}
        onOpenSheet={() => setAccountOpen(true)}
      />
      <LmsScopeSheet classes={classes} onClassChange={onClassChange} onOpenChange={setScopeOpen} onSchoolChange={onSchoolChange} open={scopeOpen} schools={schools} selectedClassId={selectedClassId} selectedSchoolId={selectedSchoolId} />

      <MobileBottomSheet
        header={<ErgSheetIdentity badges={["Giáo viên", schoolName].filter(Boolean)} email={teacherEmail} initials={nameInitials(teacherName)} name={teacherName} />}
        onOpenChange={setAccountOpen}
        open={accountOpen}
        title={teacherName}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
          {[...new Set(moreItems.map((item) => item.group))].map((group) => (
            <ErgSheetTileGroup items={moreItems.filter((item) => item.group === group)} key={group} label={group} onNavigate={navigate} />
          ))}
          <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <ErgSheetOverline>Tài khoản giáo viên</ErgSheetOverline>
            <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, overflow: "hidden" }}>
              <AccountRow icon={<BadgeRoundedIcon />} label="Hồ sơ giáo viên" onClick={() => navigate(teacherPath("/account"))} />
              <AccountRow icon={<SecurityRoundedIcon />} label="Lịch sử đăng nhập" onClick={() => navigate(teacherPath("/account/login-logs"))} />
              <AccountRow
                hint={installPrompt.installed ? "Đã cài ứng dụng" : "Chưa cài ứng dụng"}
                icon={<InstallMobileRoundedIcon />}
                label="Ứng dụng & thông báo"
                onClick={() => { setAccountOpen(false); setPwaOpen(true); }}
              />
            </Box>
          </Box>
          <ErgWorkspaceSwitch
            onNavigate={navigate}
            options={[
              { active: true, label: "Giáo viên", path: teacherPath("/"), shortLabel: "GV" },
              ...(canSwitchAdmin ? [{ label: "Admin", path: "/admin" }] : []),
              ...(canSwitchStudent ? [{ label: "Học sinh", path: "/student", shortLabel: "HS" }] : []),
            ]}
          />
          <ErgSheetSignOut onSignOut={onSignOut} />
        </Box>
      </MobileBottomSheet>

      <LmsPwaSetupSheet installPrompt={installPrompt} notifications={notifications} onOpenChange={setPwaOpen} open={pwaOpen} />
    </Box>
  );
}

/** First + last word initials ("Lê Thị Thùy" → "LT") for the dock account avatar. */
function nameInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "GV";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

function AccountRow({ hint, icon, label, onClick }: { hint?: string; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <ButtonBase onClick={onClick} sx={{ alignItems: "center", borderTop: 1, borderColor: "divider", display: "flex", gap: 1.5, justifyContent: "flex-start", minHeight: 60, px: 2, py: 1.5, textAlign: "left", width: "100%", "&:first-of-type": { borderTop: 0 }, "& > .MuiSvgIcon-root:first-of-type": { color: "text.secondary" } }}>
      {icon}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2">{label}</Typography>
        {hint ? <Typography color="text.secondary" component="div" variant="caption">{hint}</Typography> : null}
      </Box>
      <ChevronRightRoundedIcon sx={{ color: "text.secondary", fontSize: size.iconMd }} />
    </ButtonBase>
  );
}
